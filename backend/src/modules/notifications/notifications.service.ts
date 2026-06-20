import { Injectable, Logger } from '@nestjs/common';
import { PushService } from './channels/push.service';
import { SmsService } from './channels/sms.service';

export interface NotificationPayload {
  recipientPhone: string;
  recipientPushId?: string;
  recipientEmail?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly pushService: PushService,
    private readonly smsService: SmsService,
  ) {}

  async notify(payload: NotificationPayload): Promise<void> {
    // TODO: Orchestrate notification delivery with fallback chain:
    // 1. Try push notification (if recipientPushId is available)
    // 2. If push fails or no pushId, fall back to SMS
    // 3. If SMS fails, fall back to email (future)
    // 4. Log delivery status for each channel

    let delivered = false;

    // Step 1: Try push
    if (payload.recipientPushId) {
      delivered = await this.pushService.send(
        payload.recipientPushId,
        payload.title,
        payload.message,
        payload.data,
      );
    }

    // Step 2: Fallback to SMS
    if (!delivered && payload.recipientPhone) {
      delivered = await this.smsService.send(payload.recipientPhone, payload.message);
    }

    // Step 3: Fallback to email (future)
    if (!delivered && payload.recipientEmail) {
      // TODO: Implement email fallback
      this.logger.warn('Email notification not implemented yet');
    }

    if (!delivered) {
      this.logger.error(`Failed to deliver notification to ${payload.recipientPhone}`);
    }
  }

  async notifyAppointmentConfirmed(appointmentId: string): Promise<void> {
    // TODO: Fetch appointment + patient data
    // TODO: Build notification payload
    // TODO: Call this.notify()
    throw new Error('Not implemented');
  }

  async notifyTurnApproaching(appointmentId: string): Promise<void> {
    // TODO: Notify patient their turn is coming up (2 patients ahead)
    throw new Error('Not implemented');
  }

  async notifyAppointmentReminder(appointmentId: string): Promise<void> {
    // TODO: Send reminder 24h and 2h before appointment
    throw new Error('Not implemented');
  }
}
