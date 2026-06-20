import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(to: string, message: string): Promise<boolean> {
    // TODO: Integrate with Twilio API
    // TODO: Use configService.get('TWILIO_ACCOUNT_SID'), TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
    // TODO: Send SMS via Twilio client.messages.create()
    // TODO: Return true if sent successfully, false otherwise
    this.logger.warn(`SMS not implemented yet. Would send to ${to}: ${message}`);
    return false;
  }

  async sendOtp(to: string, otp: string): Promise<boolean> {
    // TODO: Send OTP message with formatted text
    const message = `TurnoMedico: Tu codigo de verificacion es ${otp}. Expira en 5 minutos.`;
    return this.send(to, message);
  }
}
