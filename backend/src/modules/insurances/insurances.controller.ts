import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InsurancesService } from './insurances.service';

@ApiTags('Public - Insurances')
@Controller('public/insurances')
export class InsurancesController {
  constructor(private readonly insurancesService: InsurancesService) {}

  @Get()
  @ApiOperation({ summary: 'List active insurance providers (ARS) catalog' })
  async list() {
    return this.insurancesService.listActive();
  }
}
