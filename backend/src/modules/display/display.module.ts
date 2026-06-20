import { Module } from '@nestjs/common';
import { DisplayController } from './display.controller';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';

@Module({
  controllers: [DisplayController],
  providers: [QueueService, QueueGateway],
  exports: [QueueService, QueueGateway],
})
export class DisplayModule {}
