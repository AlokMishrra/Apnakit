import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto';
import { QueryDeliveryZonesDto } from './dto/query-delivery-zones.dto';

@Injectable()
export class DeliveryZonesService {
  private readonly logger = new Logger(DeliveryZonesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Public serviceability check used by the location modal */
  async checkPincode(pincode: string) {
    if (!/^\d{6}$/.test(pincode)) {
      return { serviceable: false, pincode, reason: 'Invalid pincode' };
    }
    const zone = await this.prisma.deliveryZone.findUnique({
      where: { pincode },
    });
    if (!zone || !zone.isActive) {
      return {
        serviceable: false,
        pincode,
        reason: 'not_in_list',
        message:
          "We're working on delivering to your area. Stay tuned — it will be available very soon!",
      };
    }
    return {
      serviceable: true,
      pincode: zone.pincode,
      city: zone.city,
      state: zone.state,
      country: zone.country,
      estimatedDays: zone.estimatedDays,
      estimatedHours: zone.estimatedHours,
      estimatedMinutes: zone.estimatedMinutes,
      deliveryTimeUnit: zone.deliveryTimeUnit,
      cities: zone.cities,
      codEnabled: zone.codEnabled,
      prepaidOnly: zone.prepaidOnly,
      minOrderFreeDelivery: zone.minOrderFreeDelivery
        ? Number(zone.minOrderFreeDelivery)
        : null,
    };
  }

  async findAll(query: QueryDeliveryZonesDto) {
    const { page = 1, limit = 50, search, city, state, pincode, isActive } = query;
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (city) where.city = { equals: city, mode: 'insensitive' };
    if (state) where.state = { equals: state, mode: 'insensitive' };
    if (pincode) where.pincode = pincode;
    if (search) {
      where.OR = [
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { pincode: { contains: search } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.deliveryZone.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { state: 'asc' }, { city: 'asc' }, { pincode: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.deliveryZone.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string) {
    const zone = await this.prisma.deliveryZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException(`Delivery zone ${id} not found`);
    return zone;
  }

  async create(dto: CreateDeliveryZoneDto) {
    try {
      const created = await this.prisma.deliveryZone.create({
        data: {
          pincode: dto.pincode,
          city: dto.city,
          state: dto.state,
          country: dto.country || 'India',
          isActive: dto.isActive ?? true,
          codEnabled: dto.codEnabled ?? true,
          prepaidOnly: dto.prepaidOnly ?? false,
          minOrderFreeDelivery: dto.minOrderFreeDelivery,
          estimatedDays: dto.estimatedDays ?? 3,
          estimatedHours: dto.estimatedHours,
          estimatedMinutes: dto.estimatedMinutes,
          deliveryTimeUnit: dto.deliveryTimeUnit || 'days',
          cities: dto.cities,
          notes: dto.notes,
        },
      });
      this.logger.log(`Delivery zone created: ${created.pincode} (${created.city})`);
      return created;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          `Pincode ${dto.pincode} already exists in delivery zones`,
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateDeliveryZoneDto) {
    const existing = await this.findOne(id);
    try {
      const updated = await this.prisma.deliveryZone.update({
        where: { id },
        data: {
          ...(dto.pincode !== undefined && { pincode: dto.pincode }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.state !== undefined && { state: dto.state }),
          ...(dto.country !== undefined && { country: dto.country }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.codEnabled !== undefined && { codEnabled: dto.codEnabled }),
          ...(dto.prepaidOnly !== undefined && { prepaidOnly: dto.prepaidOnly }),
          ...(dto.minOrderFreeDelivery !== undefined && {
            minOrderFreeDelivery: dto.minOrderFreeDelivery,
          }),
          ...(dto.estimatedDays !== undefined && {
            estimatedDays: dto.estimatedDays,
          }),
          ...(dto.estimatedHours !== undefined && {
            estimatedHours: dto.estimatedHours,
          }),
          ...(dto.estimatedMinutes !== undefined && {
            estimatedMinutes: dto.estimatedMinutes,
          }),
          ...(dto.deliveryTimeUnit !== undefined && {
            deliveryTimeUnit: dto.deliveryTimeUnit,
          }),
          ...(dto.cities !== undefined && { cities: dto.cities }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
      });
      this.logger.log(`Delivery zone updated: ${updated.pincode}`);
      return updated;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          `Pincode ${dto.pincode} already exists`,
        );
      }
      throw err;
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.prisma.deliveryZone.delete({ where: { id } });
    this.logger.log(`Delivery zone deleted: ${existing.pincode}`);
    return { message: 'Deleted', id, pincode: existing.pincode };
  }

  /** Bulk operations — single transaction, much faster than per-id calls */
  async bulkAction(
    action: 'activate' | 'deactivate' | 'delete',
    ids: string[],
  ) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('ids[] is required');
    }
    // Verify all exist (so we don't silently no-op on bad ids)
    const existing = await this.prisma.deliveryZone.findMany({
      where: { id: { in: ids } },
      select: { id: true, pincode: true },
    });
    if (existing.length === 0) {
      throw new Error('No matching zones found');
    }
    const foundIds = existing.map((z) => z.id);
    let result: { action: string; updated: number; deleted: number; ids: string[] };
    if (action === 'delete') {
      const del = await this.prisma.deliveryZone.deleteMany({
        where: { id: { in: foundIds } },
      });
      result = { action, updated: 0, deleted: del.count, ids: foundIds };
    } else {
      const isActive = action === 'activate';
      const upd = await this.prisma.deliveryZone.updateMany({
        where: { id: { in: foundIds } },
        data: { isActive },
      });
      result = { action, updated: upd.count, deleted: 0, ids: foundIds };
    }
    this.logger.log(
      `Bulk ${action}: ${result.deleted || result.updated} zones affected`,
    );
    return result;
  }

  /** List of all unique cities/states — useful for the admin filter dropdown */
  async getCities(search?: string) {
    const where: any = { isActive: true };
    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { city: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
      ];
    }
    const zones = await this.prisma.deliveryZone.findMany({
      where,
      select: { city: true, state: true, cities: true },
      orderBy: [{ state: 'asc' }, { city: 'asc' }],
    });
    const seen = new Set<string>();
    const result: { city: string; state: string; country: string }[] = [];
    for (const zone of zones) {
      const primary = `${zone.city?.toLowerCase().trim()}|${zone.state?.toLowerCase().trim()}`;
      if (zone.city && !seen.has(primary)) {
        seen.add(primary);
        result.push({ city: zone.city, state: zone.state || '', country: 'India' });
      }
      if (Array.isArray(zone.cities)) {
        for (const c of zone.cities) {
          const name = typeof c === 'string' ? c : (c as any)?.name;
          if (!name) continue;
          const key = `${name.toLowerCase().trim()}|${zone.state?.toLowerCase().trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            result.push({ city: name, state: zone.state || '', country: 'India' });
          }
        }
      }
    }
    result.sort((a, b) => a.state.localeCompare(b.state) || a.city.localeCompare(b.city));
    return result;
  }
}
