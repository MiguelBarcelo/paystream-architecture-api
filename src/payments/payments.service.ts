import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  async createPayment(createPaymentDto: CreatePaymentDto) {
    throw new NotImplementedException(
      'This feature is currently in development.',
    );
  }
}
