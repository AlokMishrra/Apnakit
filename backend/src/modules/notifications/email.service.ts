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
}
