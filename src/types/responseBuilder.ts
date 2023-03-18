export default interface ResponseBuilder {
    type: "html" | "custom";

    get(): String;
}