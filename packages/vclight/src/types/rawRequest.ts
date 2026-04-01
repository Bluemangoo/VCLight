import { IncomingMessage, ServerResponse } from "http";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { Context } from "@netlify/functions";
import { ExecutionContext } from "@cloudflare/workers-types";
import type {
    waitUntil,
    getEnv,
    geolocation,
    ipAddress,
    invalidateByTag,
    dangerouslyDeleteByTag,
    invalidateBySrcImage,
    dangerouslyDeleteBySrcImage,
    addCacheTag,
    getCache,
    attachDatabasePool
} from "@vercel/functions";

export class RawHttpRequest {
    public request: IncomingMessage;
    public response: ServerResponse;

    constructor(request: IncomingMessage, response: ServerResponse) {
        this.request = request;
        this.response = response;
    }
}

export class RawVercelRequest {
    public request: VercelRequest;
    public response: VercelResponse;

    constructor(request: VercelRequest, response: VercelResponse) {
        this.request = request;
        this.response = response;
    }
}

type VercelFunctionHelper = {
        waitUntil: typeof waitUntil;
        getEnv: typeof getEnv;
        geolocation: typeof geolocation;
        ipAddress: typeof ipAddress;
        invalidateByTag: typeof invalidateByTag;
        dangerouslyDeleteByTag: typeof dangerouslyDeleteByTag;
        invalidateBySrcImage: typeof invalidateBySrcImage;
        dangerouslyDeleteBySrcImage: typeof dangerouslyDeleteBySrcImage;
        addCacheTag: typeof addCacheTag;
        getCache: typeof getCache;
        attachDatabasePool: typeof attachDatabasePool;
    }

export class RawVercelFunctionRequest {
    public request: Request;
    public helpers: VercelFunctionHelper;

    constructor(request: Request, helpers: VercelFunctionHelper) {
        this.request = request;
        this.helpers = helpers;
    }
}

export class RawNetlifyRequest {
    public request: Request;
    public context: Context;

    constructor(request: Request, context: Context) {
        this.request = request;
        this.context = context;
    }
}

export class RawCloudflareRequest {
    public request: Request;
    public env: any;
    public ctx: ExecutionContext;

    constructor(request: Request, env: any, ctx: ExecutionContext) {
        this.request = request;
        this.env = env;
        this.ctx = ctx;
    }
}

export type RawRequest =
    | RawHttpRequest
    | RawVercelRequest
    | RawVercelFunctionRequest
    | RawNetlifyRequest
    | RawCloudflareRequest;
