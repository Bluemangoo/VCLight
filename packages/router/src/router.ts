import ResponseContext from "./types/responseContext";
import RequestContext from "./types/requestContext";
import { parse, serialize } from "cookie";
import { VCLightResponse, VCLightMiddleware, VCLightRequest, VCLightApp } from "vclight";
import buildInRouters from "./buildInRouters";
import VCLightRouterConfig from "./types/vclightRouterConfig";
import { parse as parseURL } from "url";

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
     * @param request VCLight request
     * @param response VCLight response
     * @param app VCLight app
     */
    async post(request: VCLightRequest, response: VCLightResponse, app: VCLightApp): Promise<void> {
    }

    /**
     * Process request.
     *
     * Do not call this function unless inside VCLight app.
     *
     * @param request VCLight request
     * @param response VCLight response
     * @param app VCLight app
     */
    async process(request: VCLightRequest, response: VCLightResponse, app: VCLightApp): Promise<void> {
        if (response.end) {
            return;
        }

        //finding process function
        const parsedUrl = new URL(`https://foo.bar${request.url}`);
        const fn: (data: RequestContext, response: ResponseContext) => Promise<void> = this.get(<string>parsedUrl.pathname);

        //prepare request data
        let cookies: NodeJS.Dict<string>;
        const header: undefined | string | string[] = request.headers.cookie;
        if (header) {
            cookies = parse(Array.isArray(header) ? header.join(";") : header);
        } else {
            cookies = {};
        }
        const requestContext: RequestContext = {
            url: parsedUrl.pathname,
            query: parseURL(request.url, true).query,
            body: (() => {
                try {
                    return request.body;
                } catch {
                    return null;
                }
            })(),
            cookies,
            method: <string>request.method,
            headers: request.headers
        };
        const responseContext = new ResponseContext(response);

        //processing
        await fn(requestContext, responseContext);

        //process response
        response.load(responseContext);
        if (response.redirect) {
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
            response.headers["set-cookie"] = cookie;
        }

        if (responseContext.contentType) {
            response.headers["content-type"] = responseContext.contentType;
        }
        if (responseContext.cache) {
            response.headers["cache-control"] = "stale-while-revalidate=" + responseContext.cache.toString();
        }
    }
}
