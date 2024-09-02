import VCLightMiddleware from "./VCLightMiddleware";
import { IncomingMessage, ServerResponse } from "http";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { Context } from "@netlify/functions";
import { ExecutionContext } from "@cloudflare/workers-types";

export default interface VCLightApp {
    config: {
        useBuilder: boolean;
    };
    middlewares: VCLightMiddleware[];

    use(plugin: VCLightMiddleware): void;

    httpHandler(): (request: IncomingMessage, response: ServerResponse) => Promise<void>;

    vercelHandler(): (request: VercelRequest, response: VercelResponse) => Promise<void>;

    netlifyHandler(): (request: Request, context: Context) => Promise<Response>;

    cloudflareHandler(): (request: Request, env: any, ctx: ExecutionContext) => Promise<Response>;
}