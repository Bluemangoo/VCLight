import VCLightRequest from "./VCLightRequest";
import VCLightResponse from "./VCLightResponse";
import VCLightApp from "./VCLightApp";

export interface VCLightConfig {
    useBuilder?: boolean;
    onError?: ((request: VCLightRequest, response: VCLightResponse, app: VCLightApp, error: unknown) => Promise<void>) | null;
}

export type VCLightInnerConfig = { [key in keyof VCLightConfig]-?: VCLightConfig[key] };

export function mergeConfig(config: VCLightConfig): VCLightInnerConfig {
    const defaultConfig: VCLightInnerConfig = {
        useBuilder: false,
        onError: null
    };

    for (const key in config) {
        const c = config[key as keyof VCLightConfig];
        if (c != undefined) {
            // @ts-ignore
            defaultConfig[key as keyof VCLightInnerConfig] = c;
        }
    }

    return defaultConfig;
}