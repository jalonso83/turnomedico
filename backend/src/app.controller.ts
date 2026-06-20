import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return { status: 'ok', service: 'TurnoMedico API' };
  }
}
