import { NestFactory } from '@nestjs/core';
// import { Transport } from '@nestjs/microservices';
import { ZipkinRedisServer } from '@zippoc/transports';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    strategy: new ZipkinRedisServer({
      host: 'localhost',
      port: 6379,
      serviceName: 'service-a',
      retryAttempts: 5,
      retryDelay: 3000,
      url: `redis://localhost:6379`,
    }),
  });

  await app.listenAsync();
}
bootstrap();
