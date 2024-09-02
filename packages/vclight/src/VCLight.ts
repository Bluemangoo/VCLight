import VCLightMiddleware from "./types/VCLightMiddleware";
import VCLightResponse from "./types/VCLightResponse";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { IncomingMessage, ServerResponse } from "http";
import { Context } from "@netlify/functions";
import VCLightRequest from "./types/VCLightRequest";
import VCLightApp from "./types/VCLightApp";
import { ExecutionContext } from "@cloudflare/workers-types";

export default class VCLight implements VCLightApp {
    constructor(config: any = {}) {
        this.config = this.mergeConfig(config);
    }

    readonly config: {
        useBuilder: boolean;
    };

    mergeConfig(config: any) {
        const defaultConfig = {
            useBuilder: false
        };

        return { ...defaultConfig, ...config };
    }

    middlewares: VCLightMiddleware[] = [];

    public use(plugin: VCLightMiddleware) {
        this.middlewares[this.middlewares.length] = plugin;
    }

    protected async fetch(request: VCLightRequest): Promise<VCLightResponse> {
        let response: VCLightResponse = new VCLightResponse();
        const posts: VCLightMiddleware[] = [];

        for (const middleware of this.middlewares) {
            posts.push(middleware);
            await middleware.process(request, response, this);
            if (response.end) {
                break;
            }
        }

        for (const middleware of posts.reverse()) {
            await middleware.post(request, response, this);
        }

        if (response.redirect && (response.status < 300 || response.status >= 400)) {
            response.status = 307;
        }

        if (response.status >= 300 && response.status < 400) {
            response.headers.location = response.redirectUrl;
            if (response.response == "") {
                response.response = `<meta http-equiv="refresh" content="0; url=${response.redirectUrl}" />`;
            }
        }

        if (204 === response.status || 304 === response.status) {
            response.headers["content-type"] = undefined;
            response.headers["content-length"] = undefined;
            response.headers["transfer-encoding"] = undefined;
            response.response = "";
        }

        if (request.method == "HEAD") {
            response.response = "";
        }

        let chunk = this.config.useBuilder ? response.builder?.get() : response.response;
        if (chunk == null) {
            chunk = "";
        } else if (typeof chunk == "object") {
            chunk = JSON.stringify(chunk);
        } else {
            chunk = chunk.toString();
        }

        if (chunk == "") {
            chunk = null;
        }

        response.response = chunk;

        return response;
    }

    protected sendServerResponse(rawResponse: ServerResponse, vcLightResponse: VCLightResponse) {
        for (const header in vcLightResponse.headers) {
            if (vcLightResponse.headers[header] == null) {
                rawResponse.removeHeader(header);
            } else {
                rawResponse.setHeader(header, (vcLightResponse.headers[header] || "").toString());
            }
        }
        rawResponse.statusCode = vcLightResponse.status;
        rawResponse.end(vcLightResponse.response);
    }

    protected getResponse(vcLightResponse: VCLightResponse): Response {
        let response = new Response(vcLightResponse.response, {
            status: vcLightResponse.status
        });
        for (const key in vcLightResponse.headers) {
            if (vcLightResponse.headers[key] == null) {
                continue;
            }
            let value = "";
            let v = vcLightResponse.headers[key];
            const k = key.split("-").map(segment => {
                return segment.charAt(0).toUpperCase() + segment.slice(1);
            }).join("-");
            if (v == null) {
                response.headers.delete(k);
            } else {
                if (typeof v == "number") {
                    value = v.toString();
                } else if (Array.isArray(v)) {
                    value = v.join(", ");
                } else {
                    value = (v || "").toString();
                }
                response.headers.set(k, value);
            }
        }

        return response;
    }

    public httpHandler(): (request: IncomingMessage, response: ServerResponse) => Promise<void> {
        const that = this;
        return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
            const res = await that.fetch(await VCLightRequest.fromHttp(request, response));
            that.sendServerResponse(response, res);
        };
    }

    public vercelHandler(): (request: VercelRequest, response: VercelResponse) => Promise<void> {
        const that = this;
        return async (request: VercelRequest, response: VercelResponse): Promise<void> => {
            const res = await that.fetch(await VCLightRequest.fromVercel(request, response));
            that.sendServerResponse(response, res);
        };
    }

    public netlifyHandler(): (request: Request, context: Context) => Promise<Response> {
        const that = this;
        return async (request: Request, context: Context): Promise<Response> => {
            const vcLightResponse = await that.fetch(await VCLightRequest.fromNetlify(request, context));
            return that.getResponse(vcLightResponse);
        };
    }

    public cloudflareHandler(): (request: Request, env: any, ctx: ExecutionContext) => Promise<Response> {
        const that = this;
        return async (request: Request, env: any, ctx: ExecutionContext): Promise<Response> => {
            const vcLightResponse = await that.fetch(await VCLightRequest.fromCloudflare(request, env, ctx));
            return that.getResponse(vcLightResponse);
        };
    }
}
