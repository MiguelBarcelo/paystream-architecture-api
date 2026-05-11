import {
  IsEnum,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsCreditCard,
} from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  total: number;

  @IsEnum(['MXN', 'USD', 'EUR'], { message: 'Use correct currency' })
  currency: 'MXN' | 'USD' | 'EUR';

  @MinLength(3)
  description: string;

  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @IsOptional()
  @IsCreditCard({ message: 'Invalid credit card number' })
  card: string;

  @IsNotEmpty()
  storeId: number;
}
