import {
  Body,
  Controller,
  Post,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  Res,
} from '@nestjs/common';
import * as Express from 'express';
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
    @Res({ passthrough: true }) res: Express.Response,
  ): Promise<Payment | null> {
    const newPayment = await this.paymentsService.createPayment(
      createPaymentDto,
      idempotencyKey,
    );

    if (newPayment) {
      res.status(newPayment.status);
      return newPayment.data;
    }

    return null;
  }
}
