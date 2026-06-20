import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { MeController } from './me.controller';
import { StaffService } from './staff.service';

@Module({
  controllers: [StaffController, MeController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
