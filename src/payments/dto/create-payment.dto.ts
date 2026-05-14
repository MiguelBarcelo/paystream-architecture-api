import { Transform } from 'class-transformer';
import {
  IsEnum,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsCreditCard,
  ValidateBy,
} from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  /*
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Amount must be a valid number' },
  )
  @Min(0, { message: 'The amount must be at least $constraint1' })
  */
  @Transform(({ value }) => {
    if (typeof value === 'number') {
      // Multiplica por 100 para convertir los decimales (pesos/dólares) en centavos para Prisma
      // Math.round evita problemas de precisión decimal latentes en JS (ej. 19.99 * 100 = 1998.9999)
      return BigInt(Math.round(value * 100));
    }

    return value;
  })
  @ValidateBy({
    name: 'isSafeAmount',
    validator: {
      validate: (value) => {
        // Ensure the transformed value is a BigInt and it's not negative
        return typeof value === 'bigint' && value >= 0n;
      },
      defaultMessage: (args) => {
        // Determine which specific rule failed to give an accurate error message
        const originalValue = args?.object[args?.property];
        if (typeof originalValue !== 'bigint') {
          return 'Amount must be a valid number';
        }
        return 'The amount must be at least 0';
      },
    },
  })
  amount: bigint; // Llegará al controlador y a Prisma como un BigInt entero (centavos)

  @IsEnum(['MXN', 'USD', 'EUR'], { message: 'Use correct currency' })
  currency: 'MXN' | 'USD' | 'EUR';

  @MinLength(3)
  description: string;

  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @IsOptional()
  @IsCreditCard({ message: 'Invalid credit card number' })
  card: string;

  @IsNotEmpty({ message: 'Store ID should not be empty' })
  storeId: number;
}
