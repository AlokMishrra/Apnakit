import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OrderStatus } from '@prisma/client';

/**
 * Referral engine backed by the partner app's Supabase database.
 *
 * Source of truth: referral_links, referral_attributions, referral_events,
 * referral_conversions, partner_commissions (all in Supabase). This service
 * only calls the SQL functions the partner app already defines, using the
 * service role key. It never writes those tables directly.
 *
 * Failure policy: a Supabase outage must never block a shopper. Read paths
 * return "not referred"; order-event writes are logged and retried by
 * `retryPendingOrderEvents`.
 */

export interface ResolvedReferral {
  referralCode: string;
  partnerId: string;
  productId: string | null;
  source: 'code' | 'link';
  isSelf: boolean;
}

const DISCOUNT_SETTING_KEY = 'referral_customer_discount_percent';
const DISCOUNT_CACHE_MS = 60_000;

/** Storefront order status -> partner-app order_status (only these move money). */
const ORDER_STATUS_MAP: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.DELIVERED]: 'delivered',
  [OrderStatus.CANCELLED]: 'cancelled',
  [OrderStatus.RETURNED]: 'returned',
  [OrderStatus.REFUNDED]: 'refunded',
};

@Injectable()
export class ReferralsService implements OnModuleInit {
  private readonly logger = new Logger(ReferralsService.name);
  private supabase: SupabaseClient | null = null;
  private discountCache: { value: number; at: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_KEY');
    if (!url || !key) {
      this.logger.warn('SUPABASE_URL / SUPABASE_SERVICE_KEY not set: referrals are disabled');
      return;
    }
    this.supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  private get db(): SupabaseClient {
    if (!this.supabase) throw new Error('Supabase is not configured');
    return this.supabase;
  }

  /**
   * Records a click on a partner's product link. Called when a visitor lands on
   * a partner URL (/product/<slug>?ref=CODE) or a partner code is entered at cart.
   *
   * The partner app keys every click, attribution and conversion to a
   * referral_links row for (partner, product). Like generate_referral_link(), the
   * row is created on first use with the same snapshot rules, so the partner app
   * shows the link the moment someone uses it.
   */
  async track(input: {
    code: string;
    productSlug?: string | null;
    sessionId: string;
    landingUrl?: string | null;
  }): Promise<{ attributed: boolean; referralCode?: string; reason?: string }> {
    try {
      const { data: normalized } = await this.db.rpc('normalize_referral_code', { raw: input.code });
      if (!normalized) return { attributed: false, reason: 'invalid_code' };

      const { data: pc } = await this.db
        .from('partner_referral_codes')
        .select('partner_id')
        .eq('code', normalized)
        .eq('is_active', true)
        .maybeSingle();
      if (!pc?.partner_id) return { attributed: false, reason: 'unknown_code' };

      if (input.productSlug) {
        const product = await this.productBySlug(input.productSlug);
        if (!product) return { attributed: false, reason: 'unknown_product' };
        await this.ensureLink(pc.partner_id, product, normalized);
      } else {
        // The partner app cannot record a click without a product link.
        return { attributed: false, reason: 'product_required' };
      }

      const { data, error } = await this.db.rpc('track_referral', {
        p_code: normalized,
        p_product_slug: input.productSlug ?? null,
        p_session_id: input.sessionId,
        p_landing_url: input.landingUrl ?? null,
      });
      if (error || !data) {
        this.logger.warn(`track_referral failed: ${error?.message ?? 'no data'}`);
        return { attributed: false, reason: 'track_failed' };
      }
      return { attributed: true, referralCode: (data as any).referral_code };
    } catch (e: any) {
      this.logger.warn(`track failed: ${e?.message}`);
      return { attributed: false, reason: 'error' };
    }
  }

  private async productBySlug(slug: string) {
    const { data } = await this.db
      .from('products')
      .select('id, slug, selling_price, commission_rate')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    return data as { id: string; slug: string; selling_price: number; commission_rate: number } | null;
  }

  /** Same rules as public.generate_referral_link(): one live link per (partner, product). */
  private async ensureLink(
    partnerId: string,
    product: { id: string; slug: string; selling_price: number; commission_rate: number },
    code: string,
  ): Promise<string> {
    const { data: existing } = await this.db
      .from('referral_links')
      .select('id')
      .eq('partner_id', partnerId)
      .eq('product_id', product.id)
      .eq('is_active', true)
      .maybeSingle();
    if (existing?.id) return existing.id;

    const rate = Number(product.commission_rate) > 0
      ? Number(product.commission_rate)
      : await this.defaultCommissionRate();
    const price = Number(product.selling_price);
    const { data: url } = await this.db.rpc('build_referral_url', { p_code: code, p_slug: product.slug });

    const { data: created, error } = await this.db
      .from('referral_links')
      .insert({
        partner_id: partnerId,
        product_id: product.id,
        referral_code: code,
        referral_url: url,
        commission_rate_snapshot: rate,
        product_price_snapshot: price,
        estimated_earning_snapshot: Math.round(price * rate * 100) / 100,
      })
      .select('id')
      .single();
    if (error) {
      // A concurrent click may have created it first.
      const { data: again } = await this.db
        .from('referral_links')
        .select('id')
        .eq('partner_id', partnerId)
        .eq('product_id', product.id)
        .eq('is_active', true)
        .maybeSingle();
      if (again?.id) return again.id;
      throw error;
    }
    return created.id;
  }

  private async defaultCommissionRate(): Promise<number> {
    const { data } = await this.db
      .from('app_settings')
      .select('value')
      .eq('key', 'default_commission_rate')
      .maybeSingle();
    const n = Number(data?.value);
    return Number.isFinite(n) && n > 0 ? n : 0.1;
  }

  /** Customer discount % for referred visitors, from Supabase app_settings. */
  async discountPercent(): Promise<number> {
    if (this.discountCache && Date.now() - this.discountCache.at < DISCOUNT_CACHE_MS) {
      return this.discountCache.value;
    }
    let value = 0;
    try {
      const { data } = await this.db
        .from('app_settings')
        .select('value')
        .eq('key', DISCOUNT_SETTING_KEY)
        .maybeSingle();
      const parsed = Number(data?.value);
      if (Number.isFinite(parsed) && parsed >= 0) value = Math.min(parsed, 100);
    } catch (e: any) {
      this.logger.warn(`discount setting read failed: ${e?.message}`);
    }
    this.discountCache = { value, at: Date.now() };
    return value;
  }

  /**
   * Who is this order referred by?
   *  - an explicit partner code (cart), or
   *  - the visitor's session attribution (link click within 30 days, not yet converted).
   * `buyerEmail` is compared with the partner's own profile to block self-referral.
   */
  async resolve(opts: {
    code?: string | null;
    sessionId?: string | null;
    buyerEmail?: string | null;
  }): Promise<ResolvedReferral | null> {
    if (!opts.code && !opts.sessionId) return null;
    try {
      const { data, error } = await this.db.rpc('resolve_attribution', {
        p_session_id: opts.code ? null : opts.sessionId ?? null,
        p_referral_code: opts.code ?? null,
      });
      if (error || !data || !(data as any).partner_id) return null;
      const row = data as any;

      let isSelf = false;
      if (opts.buyerEmail) {
        const { data: profile } = await this.db
          .from('profiles')
          .select('email')
          .eq('id', row.partner_id)
          .maybeSingle();
        isSelf =
          !!profile?.email && profile.email.toLowerCase() === opts.buyerEmail.trim().toLowerCase();
      }

      return {
        referralCode: row.referral_code,
        partnerId: row.partner_id,
        productId: row.product_id ?? null,
        source: opts.code ? 'code' : 'link',
        isSelf,
      };
    } catch (e: any) {
      this.logger.warn(`resolve_attribution failed: ${e?.message}`);
      return null;
    }
  }

  /** Cart preview: is this session referred, and what discount would apply. */
  async preview(sessionId: string) {
    const referral = await this.resolve({ sessionId });
    if (!referral) return { attributed: false as const };
    return {
      attributed: true as const,
      referralCode: referral.referralCode,
      discountPercent: await this.discountPercent(),
    };
  }

  /**
   * Creates the pending commission for a new order (and its conversion row,
   * and consumes the session attribution). Idempotent on orderNumber.
   */
  async recordOrder(input: {
    orderNumber: string;
    amount: number;
    sessionId?: string | null;
    referralCode?: string | null;
    productId?: string | null;
  }) {
    return this.callOrderEvent({
      orderId: input.orderNumber,
      status: 'created',
      amount: input.amount,
      sessionId: input.sessionId ?? null,
      referralCode: input.referralCode ?? null,
      productId: input.productId ?? null,
    });
  }

  /**
   * Mirrors a storefront status change onto the partner app's commission ledger.
   *
   * The partner app's process_referral_order() returns early ("replay") for an
   * order whose commission already exists, so a 'delivered' event never moves a
   * pending commission to 'approved'. Its cancellation path also fails for
   * pending/approved commissions (it writes an 'commission_cancelled' value that
   * is not in the earning_txn_type enum, which rolls the whole call back).
   *
   * Both are handled here with the partner app's own public functions:
   * approve_commission() and reject_commission(). Nothing else is written
   * directly to the partner app's tables.
   */
  async updateOrderStatus(orderNumber: string, status: OrderStatus) {
    const mapped = ORDER_STATUS_MAP[status];
    if (!mapped) return null;

    if (mapped === 'delivered') {
      const existing = await this.findCommission(orderNumber);
      if (existing && existing.status === 'pending') {
        return this.approveCommission(existing.id);
      }
      if (existing) {
        return existing; // already approved / released: nothing to do
      }
      // No commission yet (order placed before the referral was captured):
      // let the partner app create and approve it in one call.
      return this.callOrderEvent({ orderId: orderNumber, status: mapped });
    }

    // Cancelled / returned / refunded
    const result = await this.callOrderEvent({ orderId: orderNumber, status: mapped });
    if (result) return result;

    const commission = await this.findCommission(orderNumber);
    if (!commission) return null;
    if (commission.status === 'available') {
      // Already cleared: process_referral_order handles this case correctly
      // ('reversed'), so a failure here means there is nothing to reverse.
      return null;
    }
    return this.rejectCommission(commission.id, `Order ${mapped}`);
  }

  /** The partner app's own approval function: pending -> approved, with hold. */
  private async approveCommission(commissionId: string) {
    try {
      const { data, error } = await this.db.rpc('approve_commission', {
        p_commission_id: commissionId,
        p_available_at: null,
      });
      if (error) {
        this.logger.error(`approve_commission failed: ${error.message}`);
        return null;
      }
      return data;
    } catch (e: any) {
      this.logger.error(`approve_commission threw: ${e?.message}`);
      return null;
    }
  }

  /** Void a commission that can no longer be reversed by the partner app. */
  private async rejectCommission(commissionId: string, reason: string) {
    try {
      const { data, error } = await this.db.rpc('reject_commission', {
        p_commission_id: commissionId,
        p_reason: reason,
      });
      if (error) {
        this.logger.error(`reject_commission failed: ${error.message}`);
        return null;
      }
      return data;
    } catch (e: any) {
      this.logger.error(`reject_commission threw: ${e?.message}`);
      return null;
    }
  }

  /** Reads a single commission for an order. */
  async findCommission(orderNumber: string) {
    try {
      const { data } = await this.db
        .from('partner_commissions')
        .select('id, status, commission_amount, order_amount, partner_id')
        .eq('order_id', orderNumber)
        .maybeSingle();
      return data as { id: string; status: string; commission_amount: number; order_amount: number; partner_id: string } | null;
    } catch {
      return null;
    }
  }

  private async callOrderEvent(args: {
    orderId: string;
    status: string;
    amount?: number | null;
    sessionId?: string | null;
    referralCode?: string | null;
    productId?: string | null;
  }) {
    try {
      const { data, error } = await this.db.rpc('process_referral_order', {
        p_order_id: args.orderId,
        p_order_status: args.status,
        p_order_amount: args.amount ?? null,
        p_session_id: args.sessionId ?? null,
        p_referral_code: args.referralCode ?? null,
        p_product_id: args.productId ?? null,
        p_commission_rate: null,
        p_hold_days: null,
      });
      if (error) {
        this.logger.error(`process_referral_order(${args.orderId}, ${args.status}) failed: ${error.message}`);
        return null;
      }
      return data as any;
    } catch (e: any) {
      this.logger.error(`process_referral_order threw for ${args.orderId}: ${e?.message}`);
      return null;
    }
  }

}

