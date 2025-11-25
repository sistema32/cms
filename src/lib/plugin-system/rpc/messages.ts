export interface RPCMessage {
    type: 'request' | 'response' | 'event';
    id?: string;
}

export interface RPCRequest extends RPCMessage {
    type: 'request';
    id: string;
    method: string;
    params: any[];
}

export interface RPCResponse extends RPCMessage {
    type: 'response';
    id: string;
    requestId: string;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

export interface RPCEvent extends RPCMessage {
    type: 'event';
    id: string;
    name: string;
    data: any;
}

export const RPC_ERRORS = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    TIMEOUT: -32000,
    WORKER_TERMINATED: -32001,
};
