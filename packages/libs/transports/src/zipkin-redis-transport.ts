/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable dot-notation */
import { ServerRedis, ClientRedis, MessageHandler } from '@nestjs/microservices';
import {
  Tracer,
  BatchRecorder,
  jsonEncoder,
  InetAddress,
  Annotation,
  TraceId,
  randomTraceId,
  option,
} from 'zipkin';
import CLSContext from 'zipkin-context-cls';
import { HttpLogger } from 'zipkin-transport-http';
import { RedisOptions } from '@nestjs/common/interfaces/microservices/microservice-configuration.interface';
import { Logger } from '@nestjs/common';

export type ZipkinRedisOptions = RedisOptions['options'] & {
  serviceName: string;
  host: string;
  port: number;
};

export type AnnotateFn = (tracer: Tracer) => void;

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

function getTraceId(tracer: Tracer, data: any) {
  if (typeof data === 'object' && data.traceId) {
    const traceId = new TraceId({
      spanId: randomTraceId(),
      traceId: new option.Some(data.traceId),
      parentId: data.TraceId || option.None,
    });

    return traceId;
  }
  return tracer.createChildId();
}

export class ZipkinRedisServer extends ServerRedis {
  public logger = new Logger(ZipkinRedisServer.name);
  private tracer: Tracer;
  private serviceName: ZipkinRedisOptions['serviceName'];
  private serverAddress: {
    serviceName: string;
    host: InetAddress;
    port: number;
  };

  public constructor({ serviceName, host, port, ...options }: ZipkinRedisOptions) {
    super(options);
    this.tracer = createTracer(serviceName);
    this.serverAddress = {
      serviceName: 'redis',
      host: new InetAddress(host),
      port,
    };
  }

  public getHandlerByPattern(pattern: any): MessageHandler | null {
    const handler = super.getHandlerByPattern(pattern);
    return handler ? this.withTrace(pattern, handler) : handler;
  }

  private withTrace(pattern: any, handler: MessageHandler) {
    return (data: any) => {
      const { traceId, ...rest } = data;
      this.recordTrace(pattern, { traceId });
      return handler(rest);
    };
  }

  private recordTrace(pattern: any, data: any) {
    const id = getTraceId(this.tracer, data);
    const childId = this.tracer.createChildId();
    this.logger.debug(`Recording trace with id: ${id}`);

    this.tracer.letId(childId, () => {
      this.tracer.recordAnnotation(new Annotation.ClientRecv());
    });

    this.tracer.letId(id, () => {
      this.tracer.recordRpc(JSON.stringify(pattern));
      this.tracer.recordAnnotation(new Annotation.ServiceName(this.serviceName));
      this.tracer.recordAnnotation(new Annotation.ServerAddr(this.serverAddress));
      this.tracer.recordAnnotation(new Annotation.ServerRecv());
    });
  }
}

export class ZipkinRedisClient extends ClientRedis {
  public logger = new Logger(ZipkinRedisClient.name);
  private tracer: Tracer;
  private serviceName: ZipkinRedisOptions['serviceName'];
  private serverAddress: {
    serviceName: string;
    host: InetAddress;
    port: number;
  };

  public constructor({ serviceName, host, port, ...options }: ZipkinRedisOptions) {
    super(options);
    this.serviceName = serviceName;
    this.tracer = createTracer(serviceName);

    this.serverAddress = {
      serviceName: 'redis',
      host: new InetAddress(host),
      port,
    };
  }

  public send: ClientRedis['send'] = (pattern, data) => {
    const traceId = this.recordTrace(pattern, data);
    return super.send(pattern, { ...data, traceId: traceId.traceId });
  };

  public emit: ClientRedis['emit'] = (pattern, data) => {
    const traceId = this.recordTrace(pattern, data);

    this.logger.debug(`Recording trace: ${traceId}`);

    this.tracer.setId(traceId);
    return super.emit(pattern, { ...data, traceId: traceId.traceId });
  };

  private recordTrace(pattern: any, data: any) {
    const traceId = getTraceId(this.tracer, data);

    this.logger.debug(`Recording trace with: ${traceId}`);

    this.tracer.letId(traceId, () => {
      this.tracer.recordRpc(JSON.stringify(pattern));
      this.tracer.recordAnnotation(new Annotation.ServiceName(this.serviceName));
      this.tracer.recordAnnotation(new Annotation.ServerAddr(this.serverAddress));
      this.tracer.recordAnnotation(new Annotation.ClientSend());
    });

    return traceId;
  }
}
