import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Payment, Prisma } from 'generated/prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPayments(): Promise<Payment[] | null> {
    return this.prisma.payment.findMany();
  }

  async createPayment(
    createPaymentDto: CreatePaymentDto,
    idempotencyKey: string,
  ): Promise<{ data: Payment; status: number } | null> {
    try {
      // Execute both insertions ATOMICLY
      return await this.prisma.$transaction(async (tx) => {
        const { amount, card, ...data } = createPaymentDto;
        const newPayment = await tx.payment.create({
          data: {
            ...data,
            amountInCents: amount,
            last4: card?.slice(-4),
            idempotencyKey,
          },
        });

        await tx.outbox.create({
          data: {
            type: 'payment_created',
            payload: JSON.stringify({
              card,
              paymentId: newPayment.id,
              amount: (Number(newPayment.amountInCents) / 100).toFixed(2),
              currency: newPayment.currency,
            }),
          },
        });

        return { data: newPayment, status: 201 };
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const existingPayment = await this.prisma.payment.findUnique({
          where: { idempotencyKey },
        });

        if (existingPayment) {
          return { data: existingPayment, status: 200 };
        }
      }

      throw error;
    }
  }

  private isUniqueViolation(error: any) {
    // To handle Prisma P2002 (unique constraint violation)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return true;
    }

    return false;
  }
}
