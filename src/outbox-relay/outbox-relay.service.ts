import { Outbox } from './../../dist/generated/prisma/client.d';
import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from 'src/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OutboxRelayService {
  private isProcessing = false; // Flag to prevent overlapping executions

  constructor(
    @Inject('PAYMENT_STREAM') private readonly rabbitClient: ClientProxy,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_SECOND)
  async processOutbox() {
    // Prevent one loop running on top of another if the DB or RabbitMQ is slow
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Bring in a block of pending events
      const pendingEvents: Outbox[] = await this.prisma.outbox.findMany({
        where: { status: 'PENDING' },
        take: 20,
        orderBy: { createdAt: 'asc' },
      });

      if (pendingEvents.length === 0) {
        this.isProcessing = false;
        return;
      }

      for (const event of pendingEvents) {
        try {
          // Parse the payload string that we stored in the transaction
          const messageData: unknown = JSON.parse(event.payload);
          if (!(typeof messageData === 'object' && messageData !== null))
            continue;

          // 2. Emit to RabbitMQ in async way (Fire and Forget)
          // firstValueFrom converts the NestJS Observable into a native Promise
          await firstValueFrom(this.rabbitClient.emit(event.type, messageData));

          // 3. Mark as successfully processed
          await this.prisma.outbox.update({
            where: { id: event.id },
            data: { status: 'PROCESSED' },
          });

          console.log(
            `[Outbox] Event ${event.id} (${event.type}) sent to RabbitMQ`,
          );
        } catch (publishError) {
          console.error(
            `[Outbox] Error sending event ${event.id}`,
            publishError,
          );
        }
      }
    } catch (dbError) {
      console.error('[Outbox] Error querying the Outbox table:', dbError);
    } finally {
      this.isProcessing = false;
    }
  }
}
