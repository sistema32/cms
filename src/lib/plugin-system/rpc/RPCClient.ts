import { RPCMessageType, RPCRequest, RPCResponse, RPCEvent, RPCHandler, RPCMessage } from './types.ts';

/**
 * RPC Client
 * Handles communication from the worker side (or client side of the connection)
 */
export class RPCClient {
    private handlers: Map<string, RPCHandler> = new Map();
    private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (reason: any) => void }> = new Map();
    private postMessage: (message: any) => void;

    constructor(postMessage: (message: any) => void) {
        this.postMessage = postMessage;
    }

    /**
     * Register a method handler
     */
    registerHandler(method: string, handler: RPCHandler) {
        this.handlers.set(method, handler);
    }

    /**
     * Handle incoming message
     */
    async handleMessage(message: RPCMessage) {
        if (message.type === RPCMessageType.REQUEST) {
            await this.handleRequest(message as RPCRequest);
        } else if (message.type === RPCMessageType.RESPONSE) {
            this.handleResponse(message as RPCResponse);
        } else if (message.type === RPCMessageType.EVENT) {
            // Handle events if needed
        }
    }

    /**
     * Call a remote method
     */
    call(method: string, ...params: any[]): Promise<any> {
        const id = crypto.randomUUID();
        const request: RPCRequest = {
            type: RPCMessageType.REQUEST,
            id,
            method,
            params,
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.postMessage(request);
        });
    }

    /**
     * Handle incoming request
     */
    private async handleRequest(request: RPCRequest) {
        const handler = this.handlers.get(request.method);

        if (!handler) {
            this.sendError(request.id, -32601, `Method not found: ${request.method}`);
            return;
        }

        try {
            const result = await handler(...request.params);
            this.sendResponse(request.id, result);
        } catch (error) {
            this.sendError(request.id, -32000, (error as Error).message);
        }
    }

    /**
     * Handle incoming response
     */
    private handleResponse(response: RPCResponse) {
        const pending = this.pendingRequests.get(response.id);
        if (!pending) return;

        this.pendingRequests.delete(response.id);

        if (response.error) {
            pending.reject(new Error(response.error.message));
        } else {
            pending.resolve(response.result);
        }
    }

    /**
     * Send success response
     */
    private sendResponse(id: string, result: any) {
        const response: RPCResponse = {
            type: RPCMessageType.RESPONSE,
            id,
            result,
        };
        this.postMessage(response);
    }

    /**
     * Send error response
     */
    private sendError(id: string, code: number, message: string) {
        const response: RPCResponse = {
            type: RPCMessageType.RESPONSE,
            id,
            error: {
                code,
                message,
            },
        };
        this.postMessage(response);
    }
}
