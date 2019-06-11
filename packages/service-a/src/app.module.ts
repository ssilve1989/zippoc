import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/common/enums/transport.enum';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ServiceA',
        transport: Transport.REDIS,
        options: {
          retryAttempts: 5,
          retryDelay: 3000,
          url: `redis://localhost:6379`,
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly service: AppService) {}

  onApplicationBootstrap() {
    this.service.send('Hello');
  }
}
