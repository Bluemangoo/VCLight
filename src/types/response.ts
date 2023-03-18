import ResponseBuilder from "./responseBuilder";

export default class Response {
    public redirect: boolean = false;
    public redirectUrl: string = "/";
    public status: number = 200;
    public response: any = "";
    public builder: ResponseBuilder | undefined;

    load(data: any) {
        if (data?.redirect)
            this.redirect = data?.redirect;
        if (data?.redirectUrl)
            this.redirectUrl = data?.redirectUrl;
        if (data?.status)
            this.status = data?.status;
        if (data?.response)
            this.response = data?.response;
        if (data?.builder)
            this.builder = data?.builder;
    }
}