import VCLightResponse from "./VCLightResponse";
import VCLightRequest from "./VCLightRequest";
import VCLightApp from "./VCLightApp";


export default interface VCLightMiddleware {
    process(request: VCLightRequest, response: VCLightResponse, app: VCLightApp): Promise<void>;

    post(request: VCLightRequest, response: VCLightResponse, app: VCLightApp): Promise<void>;
}