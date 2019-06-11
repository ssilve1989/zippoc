import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(@Inject('ServiceA') private readonly client: ClientProxy) {}

  getHello(): string {
    return 'Hello World!';
  }

  public send(msg: string) {
    setTimeout(() => {
      this.logger.log(`Sending msg:"${msg}" over redis`);
      this.client.emit('sample-event', { payload: msg }).toPromise();
    }, 1000);
  }
}
