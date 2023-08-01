import VCLightResponse from "./VCLightResponse";
import { VercelRequest } from "@vercel/node";
import VCLight from "../VCLight";
import { ServerResponse } from "http";


export default interface VCLightMiddleware {
    init(request: VercelRequest, app: VCLight): Promise<void>;

    process(request: VercelRequest, response: ServerResponse, responseContent: VCLightResponse, app: VCLight): Promise<void>;

}