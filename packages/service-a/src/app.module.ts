import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/common/enums/transport.enum';
import { ZipkindRedisClient } from '@zippoc/transports';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly service: AppService) {}

  onApplicationBootstrap() {
    this.service.send('Hello');
  }
}
