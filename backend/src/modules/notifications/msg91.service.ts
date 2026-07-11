import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class Msg91Service {
  private readonly logger = new Logger(Msg91Service.name);
  private readonly baseUrl = 'https://control.msg91.com/api';
  private enabled: boolean;
  private authKey: string;
  private templateId: string;
  private senderId: string;

  constructor(private readonly configService: ConfigService) {
    this.authKey = (this.configService.get('MSG91_AUTH_KEY') || '').trim();
    this.templateId = (this.configService.get('MSG91_TEMPLATE_ID') || '').trim();
    this.senderId = (this.configService.get('MSG91_SENDER_ID') || 'NISHMRT').trim();
    this.enabled =
      this.configService.get('MSG91_ENABLED') === 'true' &&
      !!this.authKey &&
      this.authKey !== 'your-msg91-auth-key' &&
      this.authKey.length > 10;

    if (this.enabled) {
      this.logger.log(`MSG91 SMS service ENABLED (sender: ${this.senderId})`);
    } else {
      this.logger.warn('MSG91 SMS service in MOCK mode (set MSG91_ENABLED=true and a valid MSG91_AUTH_KEY in .env)');
    }
  }

  /** Normalize a phone number to 91XXXXXXXXXX (no +) for Indian, or E.164 for international */
  private normalizePhone(phone: string): string {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.startsWith('91') && digits.length === 12) return digits;
    if (digits.length === 10) return `91${digits}`;
    return digits;
  }

  /**
   * Send OTP via MSG91 — uses plain SMS endpoint with OTP embedded in message
   * This bypasses MSG91's "OTP" template system (which requires DLT-registered templates)
   * and just sends a regular SMS with the OTP code in the body.
   */
  async sendOtp(phone: string, otpCode: string): Promise<{ success: boolean; message: string }> {
    if (!this.enabled) {
      this.logger.log(`[MOCK SMS] To: ${phone}, Message: Your verification code is ${otpCode}. It expires in 10 minutes.`);
      return { success: true, message: 'OTP sent (mock mode)' };
    }

    const mobile = this.normalizePhone(phone);
    try {
      // Use /sendhttp.php — plain SMS endpoint, no template required
      // We embed the OTP directly in the message text
      const message = `Your ApnaKit verification code is ${otpCode}. It expires in 10 minutes.`;
      const params = new URLSearchParams();
      params.append('authkey', this.authKey);
      params.append('mobiles', mobile);
      params.append('message', message);
      params.append('sender', this.senderId);
      params.append('route', '4'); // 4 = transactional route
      if (this.templateId) params.append('DLT_TE_ID', this.templateId);

      const url = `${this.baseUrl}/sendhttp.php?${params.toString()}`;
      this.logger.log(`MSG91 sms request to ${mobile}`);

      const response = await axios.get(url, { timeout: 15000 });
      const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      this.logger.log(`MSG91 sms response: ${data}`);

      // MSG91 success format examples:
      //   - JSON: {"type":"success","number":"919876543210","message":"SMS sent successfully"}
      //   - Plain text: "SMS sent successfully"
      //   - Numeric request ID: 36667775523472705 (or "3.6667775523472705e+23")
      //   - Hex request ID: 3666777554716c46577a746f
      // MSG91 failure: "invalid number" / "authentication failed" / etc.
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      const dataLower = dataStr.toLowerCase();
      // Hex string (0-9, a-f) of length >= 10 — likely a request ID
      const isHexId = /^[0-9a-f]{10,}$/i.test(dataStr.trim());
      const isNumericId = /^\d+(\.\d+)?(e\+\d+)?$/i.test(dataStr.trim());
      const isAlnumId = /^[a-z0-9]{8,}$/i.test(dataStr.trim());
      const isSuccessText =
        dataLower.includes('success') ||
        dataLower.includes('submitted') ||
        dataLower.includes('queued');
      const isErrorText =
        dataLower.includes('error') ||
        dataLower.includes('invalid') ||
        dataLower.includes('failed') ||
        dataLower.includes('"type":"error"') ||
        dataLower.includes('authentication');

      if (isErrorText && !isSuccessText) {
        return { success: false, message: `MSG91: ${dataStr}` };
      }
      if (isSuccessText || isHexId || isNumericId || isAlnumId) {
        return { success: true, message: `OTP sent via MSG91 SMS (request: ${dataStr.slice(0, 30)})` };
      }
      return { success: false, message: `MSG91: ${dataStr}` };
    } catch (err: any) {
      const errMsg = err.response?.data ? String(err.response.data) : err.message;
      this.logger.error(`MSG91 send OTP failed: ${errMsg}`);
      return { success: false, message: errMsg };
    }
  }

  /**
   * Send plain SMS (no OTP code, just a message)
   * Used for general notifications via MSG91
   */
  async sendSms(phone: string, message: string): Promise<{ success: boolean; message: string }> {
    if (!this.enabled) {
      this.logger.log(`[MOCK SMS] To: ${phone}, Message: ${message}`);
      return { success: true, message: 'SMS sent (mock mode)' };
    }

    const mobile = this.normalizePhone(phone);
    try {
      const params = new URLSearchParams();
      params.append('authkey', this.authKey);
      params.append('mobile', mobile);
      params.append('message', message);
      params.append('sender', this.senderId);
      params.append('route', '4');
      if (this.templateId) params.append('DLT_TE_ID', this.templateId);

      const url = `${this.baseUrl}/sendhttp.php?${params.toString()}`;
      const response = await axios.get(url, { timeout: 15000 });
      const data: string = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      this.logger.log(`MSG91 sms response: ${data}`);
      if (data.toLowerCase().includes('success')) {
        return { success: true, message: 'SMS sent via MSG91' };
      }
      return { success: false, message: `MSG91: ${data}` };
    } catch (err: any) {
      const errMsg = err.response?.data ? String(err.response.data) : err.message;
      this.logger.error(`MSG91 send SMS failed: ${errMsg}`);
      return { success: false, message: errMsg };
    }
  }

  /**
   * Verify OTP using MSG91's verify endpoint (server-side verification)
   * (In our current flow, we verify against our DB directly — this is here for future use)
   */
  async verifyOtp(phone: string, otpCode: string): Promise<{ success: boolean; message: string }> {
    if (!this.enabled) {
      return { success: true, message: 'Mock mode — handled by DB' };
    }
    const mobile = this.normalizePhone(phone);
    try {
      const params = new URLSearchParams();
      params.append('authkey', this.authKey);
      params.append('mobile', mobile);
      params.append('otp', otpCode);
      const response = await axios.get(
        `${this.baseUrl}/verifyRequestOTP.php?${params.toString()}`,
        { timeout: 10000 }
      );
      const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const isValid = (typeof data === 'string' && data.toLowerCase().includes('verified'));
      return { success: isValid, message: typeof data === 'string' ? data : JSON.stringify(data) };
    } catch (err: any) {
      const errMsg = err.response?.data ? String(err.response.data) : err.message;
      this.logger.error(`MSG91 verify OTP failed: ${errMsg}`);
      return { success: false, message: errMsg };
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
