import { IncomingMessage, ServerResponse } from "http";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { Context } from "@netlify/functions";

export class RawHttpRequest {
    public request: IncomingMessage;
    public response: ServerResponse;

    constructor(request: IncomingMessage, response: ServerResponse) {
        this.request = request;
        this.response = response;
    }
}

export class RawVercelRequest {
    public request: VercelRequest;
    public response: VercelResponse;

    constructor(request: VercelRequest, response: VercelResponse) {
        this.request = request;
        this.response = response;
    }
}

export class RawNetlifyRequest {
    public request: Request;
    public context: Context;

    constructor(request: Request, context: Context) {
        this.request = request;
        this.context = context;
    }
}

export type RawRequest = RawHttpRequest | RawVercelRequest | RawNetlifyRequest;