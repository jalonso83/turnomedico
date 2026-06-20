import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QueueService } from './queue.service';

@ApiTags('Display')
@Controller('display')
export class DisplayController {
  constructor(private readonly queueService: QueueService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Get waiting room display data by token (no auth required)' })
  async getDisplayData(@Param('token') token: string) {
    return this.queueService.getDisplayData(token);
  }
}
