import Plugin from "./types/plugin";
import Response from "./types/response";

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

    private sendResponse(response: any, responseContent: Response) {
        if (responseContent.redirect) {
            response.redirect(responseContent.redirectUrl, responseContent.status);
            return;
        }
        response.status(responseContent.status).send(responseContent.response);
    }

    public async fetch(request: any, response: any) {
        let responseContent: Response = new Response();

        for (const pluginsKey in this.plugins) {
            await this.plugins[pluginsKey].init();
            if(this.broken){
                this.sendResponse(response,responseContent);
                return
            }
        }

        for (const pluginsKey in this.plugins) {
            await this.plugins[pluginsKey].process(request, response, responseContent);
            if(this.broken){
                this.sendResponse(response,responseContent);
                return
            }
        }

        for (const pluginsKey in this.plugins) {
            await this.plugins[pluginsKey].after(request, response, responseContent);
            if(this.broken){
                this.sendResponse(response,responseContent);
                return
            }
        }

        this.sendResponse(response, responseContent);
    }
}