export default class Response {
    public redirect: boolean = false;
    public redirectUrl: string = "/";
    public status: number = 200;
    public response: any = "";

    load(data:any) {
        if (data?.redirect)
            this.redirect = data?.redirect;
        if (data?.redirectUrl)
            this.redirectUrl = data?.redirectUrl;
        if (data?.status)
            this.status = data?.status;
        if (data?.response)
            this.response = data?.response;
    }
}