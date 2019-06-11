import { Injectable, Logger } from '@nestjs/common';
import { ZipkinRedisClient } from '@zippoc/transports';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private client: ZipkinRedisClient;

  constructor() {
    // this.tracer = this.createTracer('local');
    this.client = new ZipkinRedisClient({
      serviceName: 'local-service-a',
      retryAttempts: 5,
      retryDelay: 3000,
      url: `redis://localhost:6379`,
      host: 'localhost',
      port: 6379,
    });
  }

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
