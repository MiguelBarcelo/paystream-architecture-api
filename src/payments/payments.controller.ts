import {
  Body,
  Controller,
  Post,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from 'generated/prisma/client';
import { IdempotencyKey } from './decorators/idempotency-key/idempotency-key.decorator';

@Controller('payments')
@UseInterceptors(ClassSerializerInterceptor)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async getPayments(): Promise<Payment[] | null> {
    const payments = await this.paymentsService.getPayments();
    return payments;
  }

  @Post()
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @IdempotencyKey() idempotencyKey: string,
  ): Promise<Payment | null> {
    const newPayment = await this.paymentsService.createPayment(
      createPaymentDto,
      idempotencyKey,
    );
    return newPayment;
  }
}
