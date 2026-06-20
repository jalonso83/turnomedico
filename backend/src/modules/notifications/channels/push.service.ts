import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(playerId: string, title: string, message: string, data?: Record<string, any>): Promise<boolean> {
    // TODO: Integrate with OneSignal REST API
    // TODO: POST to https://onesignal.com/api/v1/notifications
    // TODO: Use configService.get('ONESIGNAL_APP_ID') and configService.get('ONESIGNAL_API_KEY')
    // TODO: Target specific player by playerId
    // TODO: Return true if sent successfully, false otherwise
    this.logger.warn('Push notification not implemented yet');
    return false;
  }

  async sendToSegment(segment: string, title: string, message: string): Promise<boolean> {
    // TODO: Send push notification to a OneSignal segment
    this.logger.warn('Push segment notification not implemented yet');
    return false;
  }
}
