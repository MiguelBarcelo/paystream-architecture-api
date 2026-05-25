import { Controller } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class PaymentResponseController {
  constructor(private readonly prisma: PrismaService) {}

  @EventPattern('payment_success')
  async handlePaymentSuccess(@Payload() data: { paymentId: string }) {
    console.log(
      `[API] Confirmation received for Payment ID: ${data.paymentId}. Updating database...`,
    );

    await this.prisma.payment.update({
      where: { id: data.paymentId },
      data: { status: 'COMPLETED' },
    });

    console.log(
      `[API] Database updated! Payment ${data.paymentId} is COMPLETED.`,
    );
  }
}
