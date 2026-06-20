import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PushService } from './channels/push.service';
import { SmsService } from './channels/sms.service';

@Module({
  providers: [NotificationsService, PushService, SmsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
