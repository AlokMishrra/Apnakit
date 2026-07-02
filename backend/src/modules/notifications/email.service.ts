import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private enabled: boolean;
  private fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get('SMTP_HOST');
    const port = parseInt(this.configService.get('SMTP_PORT') || '587', 10);
    const user = this.configService.get('SMTP_USER');
    const pass = this.configService.get('SMTP_PASS');
    this.fromAddress = user || 'noreply@apnakit.in';

    const hasValidCreds = host && user && pass && !pass.startsWith('your-');
    this.enabled = !!hasValidCreds;

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      this.logger.log(`Email service ENABLED (host: ${host})`);
    } else {
      this.logger.log('Email service in MOCK mode (set SMTP_USER/SMTP_PASS in .env to enable)');
    }
  }

  async sendOtp(email: string, code: string): Promise<{ success: boolean; message: string }> {
    if (!this.enabled || !this.transporter) {
      this.logger.log(`[MOCK EMAIL] To: ${email}, Subject: Your Verification Code, Body: Your code is ${code}. It expires in 10 minutes.`);
      return { success: true, message: 'OTP sent (mock mode)' };
    }

    try {
      await this.transporter.sendMail({
        from: `"ApnaKit" <${this.fromAddress}>`,
        to: email,
        subject: `${code} is your ApnaKit verification code`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">ApnaKit</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Verification Code</p>
            </div>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 32px; text-align: center;">
              <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">Enter this code to verify your email:</p>
              <div style="background: white; border: 2px dashed #6366f1; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="color: #6366f1; font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: monospace;">${code}</p>
              </div>
              <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
            </div>
            <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">© ApnaKit. All rights reserved.</p>
          </div>
        `,
        text: `Your ApnaKit verification code is: ${code}\n\nThis code expires in 10 minutes.`,
      });
      this.logger.log(`OTP email sent to ${email}`);
      return { success: true, message: 'OTP email sent' };
    } catch (err: any) {
      this.logger.error(`Email send failed: ${err.message}`);
      return { success: false, message: err.message };
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async sendOrderNotification(
    to: string,
    orderData: {
      orderNumber: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      items: { name: string; quantity: number; price: number }[];
      subtotal: number;
      discount: number;
      tax: number;
      shippingCost: number;
      total: number;
      paymentMethod: string;
      shippingAddress: {
        name: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
      };
    },
  ): Promise<{ success: boolean; message: string }> {
    if (!this.enabled || !this.transporter) {
      this.logger.log(`[MOCK EMAIL] To: ${to}, Subject: New Order ${orderData.orderNumber}, Body: New order received.`);
      return { success: true, message: 'Order notification sent (mock mode)' };
    }

    try {
      const itemsHtml = orderData.items
        .map(
          (item) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(item.quantity * item.price).toFixed(2)}</td>
          </tr>
        `,
        )
        .join('');

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Order Received!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Order #${orderData.orderNumber}</p>
          </div>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px;">Customer Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;">Name:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 500;">${orderData.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0; color: #1f2937;">${orderData.customerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Phone:</td>
                <td style="padding: 8px 0; color: #1f2937;">${orderData.customerPhone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Payment:</td>
                <td style="padding: 8px 0; color: #1f2937;">${orderData.paymentMethod}</td>
              </tr>
            </table>

            <h2 style="color: #1f2937; margin: 24px 0 16px 0; font-size: 18px;">Items Ordered</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <h2 style="color: #1f2937; margin: 24px 0 16px 0; font-size: 18px;">Order Summary</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Subtotal:</td>
                <td style="padding: 8px 0; text-align: right; color: #1f2937;">₹${orderData.subtotal.toFixed(2)}</td>
              </tr>
              ${orderData.discount > 0 ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Discount:</td>
                <td style="padding: 8px 0; text-align: right; color: #059669;">-₹${orderData.discount.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Tax:</td>
                <td style="padding: 8px 0; text-align: right; color: #1f2937;">₹${orderData.tax.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Shipping:</td>
                <td style="padding: 8px 0; text-align: right; color: #1f2937;">₹${orderData.shippingCost.toFixed(2)}</td>
              </tr>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td style="padding: 12px 0; color: #1f2937; font-weight: 700; font-size: 18px;">Total:</td>
                <td style="padding: 12px 0; text-align: right; color: #6366f1; font-weight: 700; font-size: 18px;">₹${orderData.total.toFixed(2)}</td>
              </tr>
            </table>

            <h2 style="color: #1f2937; margin: 24px 0 16px 0; font-size: 18px;">Shipping Address</h2>
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
              <p style="margin: 0; color: #1f2937; font-weight: 500;">${orderData.shippingAddress.name}</p>
              <p style="margin: 4px 0 0 0; color: #6b7280;">${orderData.shippingAddress.phone}</p>
              <p style="margin: 4px 0 0 0; color: #6b7280;">${orderData.shippingAddress.addressLine1}</p>
              ${orderData.shippingAddress.addressLine2 ? `<p style="margin: 0; color: #6b7280;">${orderData.shippingAddress.addressLine2}</p>` : ''}
              <p style="margin: 4px 0 0 0; color: #6b7280;">${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} - ${orderData.shippingAddress.pincode}</p>
            </div>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 16px;">© ApnaKit. All rights reserved.</p>
        </div>
      `;

      const sendPromise = this.transporter.sendMail({
        from: `"ApnaKit" <${this.fromAddress}>`,
        to: to,
        subject: `New Order #${orderData.orderNumber} - ApnaKit`,
        html,
        text: `New Order Received!\n\nOrder Number: ${orderData.orderNumber}\n\nCustomer: ${orderData.customerName}\nEmail: ${orderData.customerEmail}\nPhone: ${orderData.customerPhone}\nPayment: ${orderData.paymentMethod}\n\nItems:\n${orderData.items.map((item) => `- ${item.name} x${item.quantity} = ₹${(item.quantity * item.price).toFixed(2)}`).join('\n')}\n\nSubtotal: ₹${orderData.subtotal.toFixed(2)}\nDiscount: ₹${orderData.discount.toFixed(2)}\nTax: ₹${orderData.tax.toFixed(2)}\nShipping: ₹${orderData.shippingCost.toFixed(2)}\nTotal: ₹${orderData.total.toFixed(2)}\n\nShipping Address:\n${orderData.shippingAddress.name}\n${orderData.shippingAddress.phone}\n${orderData.shippingAddress.addressLine1}\n${orderData.shippingAddress.addressLine2 ? orderData.shippingAddress.addressLine2 + '\n' : ''}${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} - ${orderData.shippingAddress.pincode}`,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout after 20s')), 20000)
      );
      await Promise.race([sendPromise, timeoutPromise]);
      this.logger.log(`Order notification email sent to ${to} for order ${orderData.orderNumber}`);
      return { success: true, message: 'Order notification sent' };
    } catch (err: any) {
      this.logger.error(`Order notification email failed: ${err.message}`);
      return { success: false, message: err.message };
    }
  }
}
