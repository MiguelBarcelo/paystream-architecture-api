import { PrismaModule } from 'src/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { OutboxRelayService } from 'src/outbox-relay/outbox-relay.service';

@Module({
  imports: [
    PrismaModule,
    // Configure the client to communicate with RabbitMQ
    ClientsModule.registerAsync([
      {
        name: 'PAYMENT_STREAM',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') as string],
            queue: configService.get<string>('RMQ_QUEUE') as string,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, OutboxRelayService],
})
export class PaymentsModule {}
