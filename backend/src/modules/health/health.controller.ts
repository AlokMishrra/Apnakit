import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/roles.decorator';
import { EmailService } from '../notifications/email.service';
import { PrismaService } from '../../config/database.config';

@Controller()
export class HealthController {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  root() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Liveness plus a real database round-trip.
   *
   * The function itself starting up says nothing about whether the API can
   * actually serve data, so this reports the database explicitly rather than
   * returning a cheerful 200 while every query 500s.
   */
  @Public()
  @Get('health')
  async check() {
    const database = await this.checkDatabase();
    return {
      status: database === 'ok' ? 'ok' : 'degraded',
      database,
      databaseUrlConfigured: !!process.env.DATABASE_URL,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<'ok' | 'not_configured' | 'unreachable'> {
    if (!process.env.DATABASE_URL) return 'not_configured';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch (err: any) {
      return 'unreachable';
    }
  }

  @Public()
  @Get('test-email')
  async testEmail() {
    const enabled = this.emailService.isEnabled();
    if (!enabled) {
      return { success: false, message: 'Email service not enabled (MOCK mode)' };
    }
    try {
      const result = await this.emailService.sendOrderNotification('apnakit.official@gmail.com', {
        orderNumber: 'TEST-' + Date.now(),
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '9999999999',
        items: [{ name: 'Test Product', quantity: 1, price: 100 }],
        subtotal: 100,
        discount: 0,
        tax: 0,
        shippingCost: 0,
        total: 100,
        paymentMethod: 'COD',
        shippingAddress: {
          name: 'Test User',
          phone: '9999999999',
          addressLine1: 'Test Address',
          city: 'Chhutmalpur',
          state: 'Uttar Pradesh',
          pincode: '247662',
        },
      });
      return { success: true, emailResult: result };
    } catch (err: any) {
      return { success: false, error: err.message, stack: err.stack };
    }
  }
}