import VCLightMiddleware from "./VCLightMiddleware";
import { IncomingMessage, ServerResponse } from "http";
import { VercelRequest, VercelResponse } from "@vercel/node";

export default interface VCLightApp {
    config: {
        useBuilder: boolean;
    };
    middlewares: VCLightMiddleware[];

    use(plugin: VCLightMiddleware): void;

    httpHandler(): (request: IncomingMessage, response: ServerResponse) => Promise<void>;

    vercelHandler(): (request: VercelRequest, response: VercelResponse) => Promise<void>;
}