import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';

@ApiTags('Public - Appointments')
@Controller('appointments')
export class AppointmentsPublicController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('slots/:slug')
  @ApiOperation({ summary: 'Get available slots for a doctor on a given date' })
  @ApiQuery({ name: 'date', required: true, example: '2026-04-15' })
  async getAvailableSlots(
    @Param('slug') slug: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(slug, date);
  }

  @Post('book/:slug')
  @ApiOperation({ summary: 'Book an appointment with a doctor (public, no auth)' })
  async bookAppointment(
    @Param('slug') slug: string,
    @Body() dto: BookAppointmentDto,
  ) {
    return this.appointmentsService.bookAppointment(slug, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment details (public, by ID)' })
  async getAppointment(@Param('id') id: string) {
    const appointment = await this.appointmentsService.getAppointmentPublic(id);
    return { data: appointment, message: 'Cita obtenida' };
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment (public, with appointment ID)' })
  async cancelAppointment(@Param('id') id: string) {
    return this.appointmentsService.cancelAppointment(id);
  }
}
