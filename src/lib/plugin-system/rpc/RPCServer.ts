import { RPCClient } from './RPCClient.ts';

/**
 * RPC Server
 * Wraps a Worker and provides RPC functionality
 */
export class RPCServer extends RPCClient {
    constructor(worker: Worker) {
        super(worker.postMessage.bind(worker));
        worker.onmessage = (e) => this.handleMessage(e.data);
    }
}
