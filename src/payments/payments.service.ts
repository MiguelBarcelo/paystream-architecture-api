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
  ): Promise<Payment | null> {
    try {
      const { amount, card, ...data } = createPaymentDto;
      return await this.prisma.payment.create({
        data: {
          ...data,
          amountInCents: amount,
          last4: card?.slice(-4),
          idempotencyKey,
        },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return await this.prisma.payment.findUnique({
          where: { idempotencyKey },
        });
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
