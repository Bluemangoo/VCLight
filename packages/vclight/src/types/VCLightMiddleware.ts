import VCLightResponse from "./VCLightResponse";
import VCLight from "../VCLight";
import VCLightRequest from "./VCLightRequest";


export default interface VCLightMiddleware {
    process(request: VCLightRequest, response: VCLightResponse, app: VCLight): Promise<void>;

    post(request: VCLightRequest, response: VCLightResponse, app: VCLight): Promise<void>;
}