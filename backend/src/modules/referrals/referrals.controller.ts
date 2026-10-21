import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { TrackReferralDto } from './dto/track-referral.dto';

/** Per-IP limit on the public click endpoint (each click writes Supabase rows). */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const buckets = new Map<string, { count: number; resetAt: number }>();

function allow(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= MAX_PER_WINDOW;
}

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  /** Called by the storefront when a visitor lands on a partner link. */
  @Post('track')
  async track(@Body() dto: TrackReferralDto, @Req() req: any) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    if (!allow(ip)) {
      return { attributed: false, reason: 'rate_limited' };
    }
    return this.referrals.track({
      code: dto.code,
      productSlug: dto.productSlug ?? null,
      sessionId: dto.sessionId,
      landingUrl: dto.landingUrl ?? null,
    });
  }

  /** Cart preview for a visitor session. Never errors for a plain shopper. */
  @Get('preview')
  preview(@Query('sessionId') sessionId?: string) {
    if (!sessionId || sessionId.length < 8 || sessionId.length > 128) {
      return { attributed: false };
    }
    return this.referrals.preview(sessionId);
  }
}
