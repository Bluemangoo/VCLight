import VCLightMiddleware from "./VCLightMiddleware";
import { IncomingMessage, ServerResponse } from "http";
// @ts-ignore
import { VercelRequest, VercelResponse } from "@vercel/node";
// @ts-ignore
import { Context } from "@netlify/functions";
// @ts-ignore
import { ExecutionContext } from "@cloudflare/workers-types";

export default interface VCLightApp {
    config: {};

    middlewares: VCLightMiddleware[];

    use(plugin: VCLightMiddleware): void;

    httpHandler(): (request: IncomingMessage, response: ServerResponse) => Promise<void>;

    vercelHandler(): (request: VercelRequest, response: VercelResponse) => Promise<void>;

    vercelFunctionHandler(): (request: Request) => Promise<Response>;

    netlifyHandler(): (request: Request, context: Context) => Promise<Response>;

    cloudflareHandler(): (request: Request, env: any, ctx: ExecutionContext) => Promise<Response>;
}
