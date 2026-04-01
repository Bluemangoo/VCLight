import { OutgoingHttpHeaders } from "node:http";

export default class VCLightResponse {
    public redirect: boolean = false;
    public redirectUrl: string = "/";
    public status: number = 200;
    public response: any = "";
    public headers: OutgoingHttpHeaders = {};
    public end: boolean = false;
    public context: { [key: string]: any } = {};

    load(data: any) {
        if (data?.redirect)
            this.redirect = data?.redirect;
        if (data?.redirectUrl)
            this.redirectUrl = data?.redirectUrl;
        if (data?.status)
            this.status = data?.status;
        if (data?.response)
            this.response = data?.response;
        if (data?.headers)
            this.headers = data?.headers;
        if (data?.end)
            this.end = data?.end;
        if (data?.context)
            this.context = data?.context;
    }
}