import { IncomingHttpHeaders } from "http";

export default interface RequestContext {
    readonly url: any;
    readonly query: NodeJS.Dict<string | string[]>;
    readonly body: any;
    readonly cookies: NodeJS.Dict<string>;
    readonly method: string;
    readonly headers: IncomingHttpHeaders
}