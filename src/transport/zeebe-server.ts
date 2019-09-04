import { Server, CustomTransportStrategy } from '@nestjs/microservices';
import { Inject, Injectable } from '@nestjs/common';
import { ZEEBE_CONNECTION_PROVIDER } from '../zeebe.constans';
import { ZBClient } from 'zeebe-node';
import * as process from 'process';
import { ZeebeWorkerProperties } from '../zeebe.interfaces';

@Injectable()
export class ZeebeServer extends Server implements CustomTransportStrategy {
    constructor(@Inject(ZEEBE_CONNECTION_PROVIDER) private readonly client: ZBClient) {
        super();
      }

  public async listen(callback: () => void) {
    this.init();
    callback();
  }

  public close() {
    this.client.close().then(() => console.log('All workers closed'))
  }

  private init() : void {
    const handlers = this.getHandlers();
    handlers.forEach((value, key : any, map) => {
        let workerOptions = {
          id: '',
          taskType: '',
          handler: value,
          options: {},
          onConnectionError: undefined
        }
        let jsonKey: ZeebeWorkerProperties = null;
        // See if it's a json, if so use it's data
        try {
          jsonKey = JSON.parse(key);
          workerOptions.taskType = key.type;
          workerOptions.options = key.options || {};
        }
        catch(ex) {
          workerOptions.taskType = key;
        }

        workerOptions.id = `${workerOptions.taskType}_${process.pid}`;
        const zbWorker = this.client.createWorker(workerOptions.id, workerOptions.taskType, workerOptions.handler, workerOptions.options);
    });
  }
}