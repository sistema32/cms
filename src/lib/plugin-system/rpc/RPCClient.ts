import { RPCMessage, RPCRequest, RPCResponse, RPCEvent, RPC_ERRORS } from './messages.ts';

type RequestHandler = (...args: any[]) => Promise<any> | any;
type EventHandler = (data: any) => void;

interface PendingRequest {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeoutId: number;
}

interface RPCConfig {
    defaultTimeout?: number;
}

/**
 * RPC Client
 * Handles communication from Worker to Main Thread (and vice versa)
 */
export class RPCClient {
    private postMessage: (message: any) => void;
    private handlers: Map<string, RequestHandler> = new Map();
    private eventListeners: Map<string, Set<EventHandler>> = new Map();
    private pendingRequests: Map<string, PendingRequest> = new Map();
    private defaultTimeout: number;

    constructor(postMessage: (message: any) => void, config: RPCConfig = {}) {
        this.postMessage = postMessage;
        this.defaultTimeout = config.defaultTimeout || 30000;
    }

    /**
     * Handle incoming messages
     */
    async handleMessage(message: RPCMessage): Promise<void> {
        if (!message || !message.type) return;

        switch (message.type) {
            case 'request':
                await this.handleRequest(message as RPCRequest);
                break;
            case 'response':
                this.handleResponse(message as RPCResponse);
                break;
            case 'event':
                this.handleEvent(message as RPCEvent);
                break;
        }
    }

    /**
     * Register a method handler
     */
    registerHandler(method: string, handler: RequestHandler): void {
        this.handlers.set(method, handler);
    }

    /**
     * Call a remote method
     */
    async call(method: string, ...params: any[]): Promise<any> {
        const id = crypto.randomUUID();
        const request: RPCRequest = {
            id,
            type: 'request',
            method,
            params
        };

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject({
                        code: RPC_ERRORS.TIMEOUT,
                        message: `RPC Call '${method}' timed out`
                    });
                }
            }, this.defaultTimeout);

            this.pendingRequests.set(id, { resolve, reject, timeoutId });

            try {
                this.postMessage(request);
            } catch (error) {
                clearTimeout(timeoutId);
                this.pendingRequests.delete(id);
                reject({
                    code: RPC_ERRORS.INTERNAL_ERROR,
                    message: 'Failed to send message',
                    data: error
                });
            }
        });
    }

    /**
     * Handle incoming request
     */
    private async handleRequest(request: RPCRequest): Promise<void> {
        const { id, method, params } = request;
        const handler = this.handlers.get(method);

        try {
            if (!handler) {
                throw {
                    code: RPC_ERRORS.METHOD_NOT_FOUND,
                    message: `Method '${method}' not found`
                };
            }

            const result = await handler(...params);

            const response: RPCResponse = {
                id: crypto.randomUUID(),
                type: 'response',
                requestId: id,
                result
            };

            this.postMessage(response);

        } catch (error: any) {
            const response: RPCResponse = {
                id: crypto.randomUUID(),
                type: 'response',
                requestId: id,
                error: {
                    code: error.code || RPC_ERRORS.INTERNAL_ERROR,
                    message: error.message || 'Internal Error',
                    data: error.data || error
                }
            };
            this.postMessage(response);
        }
    }

    /**
     * Handle incoming response
     */
    private handleResponse(response: RPCResponse): void {
        const { requestId, result, error } = response;
        const pending = this.pendingRequests.get(requestId);

        if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingRequests.delete(requestId);

            if (error) {
                pending.reject(error);
            } else {
                pending.resolve(result);
            }
        }
    }

    /**
     * Handle incoming event
     */
    private handleEvent(event: RPCEvent): void {
        const { name, data } = event;
        const listeners = this.eventListeners.get(name);

        if (listeners) {
            listeners.forEach(handler => {
                try {
                    handler(data);
                } catch (e) {
                    console.error(`Error in event listener for '${name}':`, e);
                }
            });
        }
    }
}
