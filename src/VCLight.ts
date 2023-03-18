import Plugin from "./types/plugin";
import Response from "./types/response";
import { VercelRequest, VercelResponse } from "@vercel/node";

export default class VCLight {
    constructor(config: {} = {}) {
        this.config = config;
    }

    readonly config: {};
    plugins: Plugin[] = [];

    public use(plugin: Plugin) {
        this.plugins[this.plugins.length] = plugin;
    }

    private broken = false;

    public breakApp() {
        this.broken = true;
    }

    private sendResponse(response: VercelResponse, responseContent: Response) {
        if (responseContent.redirect) {
            response.redirect(responseContent.status, responseContent.redirectUrl);
            return;
        }
        response.status(responseContent.status).send(responseContent.response);
    }

    public async fetch(request: VercelRequest, response: VercelResponse) {
        let responseContent: Response = new Response();

        const taskList = [];
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
}