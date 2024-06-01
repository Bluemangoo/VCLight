import { RawHttpRequest, RawNetlifyRequest, RawRequest, RawVercelRequest } from "./rawRequest";
import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { Context } from "@netlify/functions";

export interface VCLightRequestBase {
    rawRequest: RawRequest,
    source: "http" | "vercel" | "netlify",
    headers: IncomingHttpHeaders,
    method: string,
    url: string,
    body: any
}

export default class VCLightRequest implements VCLightRequestBase {
    readonly rawRequest: RawRequest;
    readonly source: "http" | "vercel" | "netlify";

    readonly headers: IncomingHttpHeaders;
    readonly method: string;
    readonly url: string;

    readonly body: any;

    constructor(context: VCLightRequestBase) {
        this.rawRequest = context.rawRequest;
        this.source = context.source;
        this.headers = context.headers;
        this.method = context.method;
        this.url = context.url;
        this.body = context.body;
    }

    static fromHttp(request: IncomingMessage, response: ServerResponse): VCLightRequest {
        return new VCLightRequest({
            ...request,
            rawRequest: new RawHttpRequest(request, response),
            source: "http",
            method: request.method || "",
            url: request.url || "",
            body: undefined
        });
    }

    static fromVercel(request: VercelRequest, response: VercelResponse): VCLightRequest {
        return new VCLightRequest({
            ...request,
            rawRequest: new RawVercelRequest(request, response),
            source: "vercel",
            method: request.method || "",
            url: request.url || ""
        });
    }

    static fromNetlify(request: Request, context: Context): VCLightRequest {
        const headers: IncomingHttpHeaders = {};
        for (const [key, value] of request.headers.entries()) {
            headers[key.toLowerCase()] = value;
        }
        return new VCLightRequest({
            ...request,
            rawRequest: new RawNetlifyRequest(request, context),
            source: "netlify",
            headers,
            body: undefined
        });
    }
}