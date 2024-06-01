import ResponseBuilder from "../responseBuilder";

export default class HtmlBuilder implements ResponseBuilder {
    type: "html" = "html";
    private data = {
        head: {
            title: undefined,
            lang: "en",
            etc: ""
        },
        body: {
            etc: ""
        }
    };

    constructor() {
    }

    get(): string {
        return `<html lang="${this.data.head.lang}">
<head>
<title>${this.data.head.title}</title>
</head>
<body>
${this.data.body.etc}
</body>
</html>`;
    }

    getHead(): string {
        return this.data.head.etc;
    }

    setHead(data: string): HtmlBuilder {
        this.data.head.etc = data;
        return this;
    }

    appendHead(data: string): HtmlBuilder {
        this.data.head.etc += data;
        return this;
    }

    getBody(): string {
        return this.data.body.etc;
    }

    setBody(data: string): HtmlBuilder {
        this.data.body.etc = data;
        return this;
    }

    appendBody(data: string): HtmlBuilder {
        this.data.body.etc += data;
        return this;
    }
}