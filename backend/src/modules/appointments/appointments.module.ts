import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsPublicController } from './appointments-public.controller';
import { AppointmentsService } from './appointments.service';
import { SmartRemindersModule } from '../smart-reminders/smart-reminders.module';

@Module({
  imports: [SmartRemindersModule],
  controllers: [AppointmentsController, AppointmentsPublicController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
