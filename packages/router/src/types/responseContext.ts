import CookieElement from "./cookieElement";
import { VCLightResponse, ResponseBuilder } from "vclight";

export default class ResponseContext {
    public builder: ResponseBuilder | undefined;
    public cache: number | undefined;
    public contentType: string | undefined;
    public cookie: CookieElement[] = [];
    public middlewareContext: { [key: string]: any } = {};
    public redirect: boolean | undefined;
    public redirectUrl: string | undefined;
    public response: any;
    public status: number = 200;
    public end: boolean = false;

    constructor(responseContent?: VCLightResponse) {
        if (responseContent) {
            this.builder = responseContent.builder;
            this.middlewareContext = responseContent.context;
            this.redirect = responseContent.redirect;
            this.redirectUrl = responseContent.redirectUrl;
            this.response = responseContent.response;
            this.status = responseContent.status;
            this.end = responseContent.end;
        }
    }
}
