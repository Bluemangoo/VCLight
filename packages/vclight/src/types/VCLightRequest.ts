import { RawCloudflareRequest, RawHttpRequest, RawNetlifyRequest, RawRequest, RawVercelRequest } from "./rawRequest";
import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { Context } from "@netlify/functions";
import { getBodyParser, readBody } from "../helper/helpers";
import { ExecutionContext } from "@cloudflare/workers-types";

export interface VCLightRequestBase {
    rawRequest: RawRequest,
    source: "http" | "vercel" | "netlify" | "cloudflare",
    headers: IncomingHttpHeaders,
    method: string,
    url: string,
    body: any,
    env: any
}

export default class VCLightRequest implements VCLightRequestBase {
    readonly rawRequest: RawRequest;
    readonly source: "http" | "vercel" | "netlify" | "cloudflare";

    readonly headers: IncomingHttpHeaders;
    readonly method: string;
    readonly url: string;

    readonly body: any;
    readonly env: any;

    constructor(context: VCLightRequestBase) {
        this.rawRequest = context.rawRequest;
        this.source = context.source;
        this.headers = context.headers;
        this.method = context.method;
        this.url = context.url;
        this.body = context.body;
        this.env = context.env;
    }

    static async fromHttp(request: IncomingMessage, response: ServerResponse): Promise<VCLightRequest> {
        let body;
        try {
            const contentType = request.headers["content-type"];
            const b =
                contentType == undefined ? Buffer.from("") : await readBody(request);
            body = getBodyParser(b, contentType);
        } catch {
            body = null;
        }
        return new VCLightRequest({
            ...request,
            rawRequest: new RawHttpRequest(request, response),
            source: "http",
            method: request.method || "",
            url: request.url || "",
            headers: request.headers,
            body,
            env: process.env
        });
    }

    static async fromVercel(request: VercelRequest, response: VercelResponse): Promise<VCLightRequest> {
        let body;
        try {
            body = await request.body;
        } catch {
            body = null;
        }
        return new VCLightRequest({
            ...request,
            rawRequest: new RawVercelRequest(request, response),
            source: "vercel",
            method: request.method || "",
            url: request.url || "",
            headers: request.headers,
            body,
            env: process.env
        });
    }

    static async fromNetlify(request: Request, context: Context): Promise<VCLightRequest> {
        const headers: IncomingHttpHeaders = {};
        for (const [key, value] of request.headers.entries()) {
            headers[key.toLowerCase()] = value;
        }
        let body;
        try {
            body = await request.text();
        } catch {
            body = null;
        }
        if (typeof body == "string" && headers["content-type"] == "application/json") {
            try {
                body = JSON.parse(body);
            } catch {
                body = null;
            }
        }
        return new VCLightRequest({
            ...request,
            rawRequest: new RawNetlifyRequest(request, context),
            source: "netlify",
            url: new URL(request.url).pathname,
            method: request.method,
            headers,
            body,
            env: process.env
        });
    }

    static async fromCloudflare(request: Request, env: any, ctx: ExecutionContext): Promise<VCLightRequest> {
        const headers: IncomingHttpHeaders = {};
        for (const [key, value] of request.headers.entries()) {
            headers[key.toLowerCase()] = value;
        }
        let body;
        try {
            body = await request.text();
        } catch {
            body = null;
        }
        if (typeof body == "string" && headers["content-type"] == "application/json") {
            try {
                body = JSON.parse(body);
            } catch {
                body = null;
            }
        }
        return new VCLightRequest({
            ...request,
            rawRequest: new RawCloudflareRequest(request, env, ctx),
            source: "cloudflare",
            url: new URL(request.url).pathname,
            method: request.method,
            headers,
            body,
            env
        });
    }
}

