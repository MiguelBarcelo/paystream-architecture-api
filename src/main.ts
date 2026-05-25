import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

// TODO: Use SerlializerInterceptor
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.create(AppModule);

  // Apply the validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties not defined in the DTO
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to match DTO types
    }),
  );

  // Connect the hybrid microservice to listen the responses
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL') as string],
      queue: configService.get<string>('RMQ_REPLY_QUEUE'),
      noAck: true,
    },
  });

  await appContext.close();

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
  console.log('HTTP API and Response listener running in parallel');
}
bootstrap();
