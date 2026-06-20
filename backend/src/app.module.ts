import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { PatientsModule } from './modules/patients/patients.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DisplayModule } from './modules/display/display.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { InsurancesModule } from './modules/insurances/insurances.module';
import { SmartRemindersModule } from './modules/smart-reminders/smart-reminders.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { StaffModule } from './modules/staff/staff.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    SchedulesModule,
    AppointmentsModule,
    PatientsModule,
    NotificationsModule,
    DisplayModule,
    DoctorsModule,
    InsurancesModule,
    SmartRemindersModule,
    MedicalRecordsModule,
    PaymentsModule,
    StaffModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
