import VCLightMiddleware from "./types/VCLightMiddleware";
import VCLightResponse from "./types/VCLightResponse";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { IncomingMessage, ServerResponse } from "http";
import { addHelpers } from "./helper/helpers";

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

    private sendResponse(response: VercelResponse, responseContent: VCLightResponse) {
        if (responseContent.redirect) {
            response.redirect(responseContent.status, responseContent.redirectUrl);
            return;
        }
        if (this.config.useBuilder) {
            response.status(responseContent.status).send(responseContent.builder?.get());
        } else {
            response.status(responseContent.status).send(responseContent.response);
        }
    }

    protected async fetch(request: VercelRequest, response: VercelResponse) {
        let responseContent: VCLightResponse = new VCLightResponse();
        const posts: VCLightMiddleware[] = [];

        for (const middleware of this.middlewares) {
            posts.push(middleware);
            await middleware.process(request, response, responseContent, this);
            if (responseContent.end) {
                break;
            }
        }

        for (const middleware of posts.reverse()) {
            await middleware.post(request, response, responseContent, this);
        }

        this.sendResponse(response, responseContent);
    }

    public httpHandler(): (request: IncomingMessage, response: ServerResponse) => Promise<void> {
        const that = this;
        return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
            await addHelpers(request, response);
            await that.fetch(<VercelRequest>request, <VercelResponse>response);
        };
    }

    public vercelHandler(): (request: IncomingMessage, response: ServerResponse) => Promise<void> {
        const that = this;
        return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
            await that.fetch(<VercelRequest>request, <VercelResponse>response);
        };
    }
}
