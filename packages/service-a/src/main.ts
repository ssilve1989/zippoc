import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.REDIS,
    options: {
      retryDelay: 3000,
      retryAttempts: 5,
      url: `redis://localhost:6379`,
    },
  });

  await app.listenAsync();
}
bootstrap();
