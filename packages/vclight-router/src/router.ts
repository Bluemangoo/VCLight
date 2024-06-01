import ResponseContext from "./types/responseContext";
import RequestContext from "./types/requestContext";
import { serialize } from "cookie";
import VCLight, { VCLightResponse, VCLightMiddleware } from "vclight";
import buildInRouters from "./buildInRouters";
import { VercelRequest } from "@vercel/node";
import { ServerResponse } from "http";
import VCLightRouterConfig from "./types/vclightRouterConfig";

interface Pattern {
    pattern: RegExp;
    fn: (data: RequestContext, response: ResponseContext) => Promise<void>;
}

export default class VCLightRouter implements VCLightMiddleware {
    constructor(config: VCLightRouterConfig = {}) {
        this.config = this.mergeConfig(config);
        if (this.config.buildInRouters._404) {
            this.on("/404/", buildInRouters.error404);
        }
    }

    protected readonly config: {
        buildInRouters: {
            _404: boolean;
        };
        use404Router: boolean
    };

    protected mergeConfig(config: any) {
        const defaultConfig: VCLightRouterConfig = {
            buildInRouters: {
                _404: true
            },
            use404Router: true
        };

        let mergedConfig = { ...defaultConfig, ...config };
        mergedConfig.buildInRouters = { ...defaultConfig.buildInRouters, ...mergedConfig.buildInRouters };

        return mergedConfig;
    }

    /**
     * Add a regular router
     *
     * Tips: event should be started and ended with "/". Example: "/event/"
     *
     * @param event the event.
     * @param fn
     */
    public on(event: string, fn: (data: RequestContext, response: ResponseContext) => void) {
        if (this.events[event]) {
            console.warn(`Warning: event ${event} have been redefined`);
        }
        this.events[event] = fn;
    }

    /**
     * Add a pattern router
     *
     * @param pattern the regular expression to match path
     * @param fn the function to process the request
     */
    public pattern(pattern: RegExp, fn: (data: RequestContext, response: ResponseContext) => Promise<void>) {
        this.eventPatterns[this.eventPatterns.length] = { pattern, fn };
    }

    /**
     * Get the function to process request
     *
     * @param event the event
     */
    public get(event: string): (data: RequestContext, response: ResponseContext) => Promise<void> {
        if (this.events?.[event]) {
            return this.events?.[event];
        }

        if (event[event.length - 1] !== "/" && this.events?.[(event + "/")]) {
            return this.events?.[(event + "/")];
        }

        for (const pattern in this.eventPatterns) {
            if (this.eventPatterns[pattern].pattern.test(event)) {
                return this.eventPatterns[pattern].fn;
            }
        }
        if (this.config.use404Router) {
            return this.events["/404/"];
        } else {
            return async (_data, _response) => {
            };
        }
    }

    protected events: {
        [key: string]: any;
    } = {};
    protected eventPatterns: Pattern[] = [];


    /**
     * Post task of this instance.
     *
     * Do not call this function unless inside VCLight app.
     *
     * @param request VercelRequest
     * @param response ServerResponse(VercelResponse)
     * @param responseContent Response content
     * @param app VCLight app
     */
    async post(request: VercelRequest, response: ServerResponse, responseContent: VCLightResponse, app: VCLight): Promise<void> {
    }

    /**
     * Process request.
     *
     * Do not call this function unless inside VCLight app.
     *
     * @param request VercelRequest
     * @param response ServerResponse(VercelResponse)
     * @param responseContent Response content
     * @param app VCLight app
     */
    async process(request: VercelRequest, response: ServerResponse, responseContent: VCLightResponse, app: VCLight): Promise<void> {
        if (responseContent.end) {
            return;
        }

        //finding process function
        const parsedUrl = new URL(`https://foo.bar${request.url}`);
        const fn: (data: RequestContext, response: ResponseContext) => Promise<void> = this.get(<string>parsedUrl.pathname);

        //prepare request data
        const requestContext: RequestContext = {
            url: parsedUrl.pathname,
            query: request.query,
            body: (() => {
                try {
                    return request.body;
                } catch {
                    return null;
                }
            })(),
            cookies: request.cookies,
            method: <string>request.method,
            headers: request.headers
        };
        const responseContext = new ResponseContext(responseContent);

        //processing
        await fn(requestContext, responseContext);

        //process response
        responseContent.load(responseContext);
        if (responseContent.redirect) {
            return;
        }

        let cookie = [];
        for (const cookieElement of responseContext.cookie) {
            cookie[cookie.length] = serialize(cookieElement.name, cookieElement.val, {
                httpOnly: true,
                expires: cookieElement.expires,
                path: "/"
            });
        }
        if (cookie.length > 0) {
            response.setHeader("Set-Cookie", cookie);
        }

        if (responseContext.contentType) {
            response.setHeader("content-type", responseContext.contentType);
        }
        if (responseContext.cache) {
            response.setHeader("cache-control", "stale-while-revalidate=" + responseContext.cache.toString());
        }
    }
}
