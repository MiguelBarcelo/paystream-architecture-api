import { PrismaModule } from 'src/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { OutboxRelayService } from 'src/outbox-relay/outbox-relay.service';
import { PaymentResponseController } from './payment-response.controller';

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
              arguments: {
                'x-dead-letter-exchange': configService.get<string>(
                  'DEAD_LETTER_EXCHANGE',
                ),
                'x-dead-letter-routing-key': configService.get<string>(
                  'DEAD_LETTER_ROUTING_KEY',
                ),
              },
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PaymentsController, PaymentResponseController],
  providers: [PaymentsService, OutboxRelayService],
})
export class PaymentsModule {}
