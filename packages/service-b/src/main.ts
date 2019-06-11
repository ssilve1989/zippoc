import { NestFactory } from '@nestjs/core';
import { ZipkinRedisServer } from '@zippoc/transports';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    strategy: new ZipkinRedisServer({
      host: 'localhost',
      port: 6379,
      retryAttempts: 5,
      retryDelay: 3000,
      serviceName: 'local-service-b',
      url: `redis://localhost:6379`,
    }),
  });

  await app.listenAsync();
}
bootstrap();
