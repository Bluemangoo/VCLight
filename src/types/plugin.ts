import Response from "./response";
import { VercelRequest } from "@vercel/node";
import VCLight from "../VCLight";
import { ServerResponse } from "http";


export default interface Plugin {
    init(request: VercelRequest, app: VCLight): Promise<void>;

    process(request: VercelRequest, response: ServerResponse, responseContent: Response, app: VCLight): Promise<void>;

}