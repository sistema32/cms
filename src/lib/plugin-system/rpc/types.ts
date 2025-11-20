/**
 * RPC Message Types
 */

export enum RPCMessageType {
    REQUEST = 'request',
    RESPONSE = 'response',
    EVENT = 'event',
}

export interface RPCMessage {
    type: RPCMessageType;
    id?: string;
}

export interface RPCRequest extends RPCMessage {
    type: RPCMessageType.REQUEST;
    id: string;
    method: string;
    params: any[];
}

export interface RPCResponse extends RPCMessage {
    type: RPCMessageType.RESPONSE;
    id: string;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

export interface RPCEvent extends RPCMessage {
    type: RPCMessageType.EVENT;
    event: string;
    data: any;
}

export type RPCHandler = (...args: any[]) => Promise<any> | any;
