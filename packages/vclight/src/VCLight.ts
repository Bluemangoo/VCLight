import VCLightMiddleware from "./types/VCLightMiddleware";
import VCLightResponse from "./types/VCLightResponse";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { IncomingMessage, ServerResponse } from "http";
import { Context } from "@netlify/functions";
import VCLightRequest from "./types/VCLightRequest";

export default class VCLight {
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

    private sendServerResponse(rawRequest: IncomingMessage, rawResponse: ServerResponse, vcLightResponse: VCLightResponse) {
        for (const header in vcLightResponse.headers) {
            if (vcLightResponse.headers[header] != null) {
                rawResponse.setHeader(header, (vcLightResponse.headers[header] || "").toString());
            }
        }
        if (vcLightResponse.redirect) {
            rawResponse.writeHead(vcLightResponse.status, { Location: vcLightResponse.redirectUrl }).end();
            return;
        }
        rawResponse.statusCode = vcLightResponse.status;
        if (204 === rawResponse.statusCode || 304 === rawResponse.statusCode) {
            rawResponse.removeHeader("Content-Type");
            rawResponse.removeHeader("Content-Length");
            rawResponse.removeHeader("Transfer-Encoding");
            rawResponse.end();
        }
        if (rawRequest.method === "HEAD") {
            rawResponse.end();
        }
        let chunk = this.config.useBuilder ? vcLightResponse.builder?.get() : vcLightResponse.response;
        if (typeof chunk == "object") {
            chunk = JSON.stringify(chunk);
        }
        rawResponse.end(chunk);
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

        return response;
    }

    public httpHandler(): (request: IncomingMessage, response: ServerResponse) => Promise<void> {
        const that = this;
        return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
            const res = await that.fetch(await VCLightRequest.fromHttp(request, response));
            that.sendServerResponse(request, response, res);
        };
    }

    public vercelHandler(): (request: VercelRequest, response: VercelResponse) => Promise<void> {
        const that = this;
        return async (request: VercelRequest, response: VercelResponse): Promise<void> => {
            const res = await that.fetch(await VCLightRequest.fromVercel(request, response));
            that.sendServerResponse(request, response, res);
        };
    }

    public netlifyHandler(): (request: Request, context: Context) => Promise<Response> {
        const that = this;
        return async (request: Request, context: Context): Promise<Response> => {
            const res = await that.fetch(await VCLightRequest.fromNetlify(request, context));

            let response = res.redirect ?
                Response.redirect(res.redirectUrl, res.status)
                : new Response(res.response, {
                    status: res.status
                });
            if (204 === res.status || 304 === res.status) {
                res.headers["content-type"] = undefined;
                res.headers["content-length"] = undefined;
                res.headers["transfer-encoding"] = undefined;
                response = new Response(null, {
                    status: res.status
                });
            }
            for (const key in res.headers) {
                if (res.headers[key] == null) {
                    continue;
                }
                let value = "";
                let v = res.headers[key];
                if (typeof v == "number") {
                    value = v.toString();
                } else if (Array.isArray(v)) {
                    value = v.join(", ");
                } else {
                    value = (v || "").toString();
                }
                response.headers.set(key.split("-").map(segment => {
                    return segment.charAt(0).toUpperCase() + segment.slice(1);
                }).join("-"), value);
            }

            return response;
        };
    }
}
