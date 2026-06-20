import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { QueueService } from './queue.service';

@WebSocketGateway({
  namespace: '/display',
  cors: { origin: '*' },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QueueGateway.name);

  constructor(private readonly queueService: QueueService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Display client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Display client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-display')
  async handleJoinDisplay(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token: string },
  ) {
    try {
      const displayData = await this.queueService.getDisplayData(data.token);
      client.emit('queue:state', displayData.data);
      this.logger.log(`Client ${client.id} joined display with token ${data.token}`);
    } catch (err) {
      client.emit('error', { message: 'Token inválido' });
    }
  }

  async emitQueueUpdate(displayToken: string) {
    try {
      const displayData = await this.queueService.getDisplayData(displayToken);
      this.server.emit('queue:update', displayData.data);
    } catch (err) {
      this.logger.error(`Error emitting queue update: ${err}`);
    }
  }
}
