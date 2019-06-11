/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable dot-notation */
import { ServerRedis, ClientRedis } from '@nestjs/microservices';
import { Tracer, BatchRecorder, jsonEncoder } from 'zipkin';
import CLSContext from 'zipkin-context-cls';
import { HttpLogger } from 'zipkin-transport-http';
import Redis from 'redis';
import zipkinClient from 'zipkin-instrumentation-redis';
import { RedisOptions } from '@nestjs/common/interfaces/microservices/microservice-configuration.interface';

type ZipkinRedisOptions = RedisOptions['options'] & {
  serviceName: string;
  host: string;
  port: number;
};

function createTracer(serviceName: string) {
  const ctxImpl = new CLSContext('zipkin');
  const recorder = new BatchRecorder({
    logger: new HttpLogger({
      jsonEncoder: jsonEncoder.JSON_V2,
      endpoint: 'http://localhost:9411/api/v2/spans',
    }),
  });

  return new Tracer({ ctxImpl, recorder, localServiceName: serviceName });
}

export class ZipkinRedisServer extends ServerRedis {
  private tracer: Tracer;

  public constructor({ serviceName, ...options }: ZipkinRedisOptions) {
    super(options);
    this.tracer = createTracer(serviceName);
  }

  public createRedisClient() {
    // eslint-disable-next-line dot-notation
    return zipkinClient(
      this.tracer,
      Redis,
      Object.assign({}, this.getClientOptions(), this['options'])
    );
  }
}

export class ZipkinRedisClient extends ClientRedis {
  private tracer: Tracer;
  public constructor({ serviceName, ...options }: ZipkinRedisOptions) {
    super(options);
    this.tracer = createTracer(serviceName);
  }

  public createClient: ClientRedis['createClient'] = error$ => {
    return zipkinClient(
      this.tracer,
      Redis,
      Object.assign({}, this.getClientOptions(error$), this['options'])
    );
  };
}
