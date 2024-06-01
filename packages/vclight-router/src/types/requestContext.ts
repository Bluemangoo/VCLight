import { VercelRequestBody, VercelRequestCookies, VercelRequestQuery } from "@vercel/node";
import { IncomingHttpHeaders } from "http";

export default interface RequestContext {
    readonly url: any;
    readonly query: VercelRequestQuery;
    readonly body: VercelRequestBody;
    readonly cookies: VercelRequestCookies;
    readonly method: string;
    readonly headers: IncomingHttpHeaders
}