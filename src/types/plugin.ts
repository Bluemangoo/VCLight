import Response from "./response";

export default interface Plugin {
    init(): Promise<void>;

    process(request: any, response: any, responseContent: Response): Promise<void>;

    after(request: any, response: any, responseContent: Response): Promise<void>;

}