import { Module } from '@nestjs/common';
import { SmartRemindersService } from './smart-reminders.service';
import { SmartRemindersController } from './smart-reminders.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [SmartRemindersService],
  controllers: [SmartRemindersController],
  exports: [SmartRemindersService],
})
export class SmartRemindersModule {}
