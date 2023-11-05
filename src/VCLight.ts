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

    plugins: VCLightMiddleware[] = [];

    public use(plugin: VCLightMiddleware) {
        this.plugins[this.plugins.length] = plugin;
    }

    private broken = false;

    public breakApp() {
        this.broken = true;
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

    public async fetch(request: VercelRequest, response: VercelResponse) {
        let responseContent: VCLightResponse = new VCLightResponse();

        const taskList: Promise<void>[] = [];
        for (const pluginsKey in this.plugins) {
            taskList[taskList.length] = this.plugins[pluginsKey].init(request, this);
        }
        await Promise.all(taskList);
        if (this.broken) {
            this.sendResponse(response, responseContent);
            return;
        }

        for (const pluginsKey in this.plugins) {
            await this.plugins[pluginsKey].process(request, response, responseContent, this);
            if (this.broken) {
                this.sendResponse(response, responseContent);
                return;
            }
        }

        this.sendResponse(response, responseContent);
    }

    private async httpHandler(request: IncomingMessage, response: ServerResponse) {
        const that = this;
        await addHelpers(request, response);
        await that.fetch(<VercelRequest>request, <VercelResponse>response);
    }

    static getHttpHandler(app: VCLight): (request: IncomingMessage, response: ServerResponse) => Promise<void> {
        return async (request: IncomingMessage, response: ServerResponse) => {
            await app.httpHandler(request, response);
        };
    }
}
