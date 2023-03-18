import Response from "./response";
import { VercelRequest, VercelResponse } from "@vercel/node";
import VCLight from "../VCLight";

export default interface Plugin {
    init(request: VercelRequest, app: VCLight): Promise<void>;

    process(request: VercelRequest, response: VercelResponse, responseContent: Response, app: VCLight): Promise<void>;

}