export declare type BaseConfPW = {
    [key: string]: any;
    localSeleniumStandaloneOpts?: {
        port?: number | string;
        args?: string[];
        jvmArgs?: string[];
    };
    seleniumAddress?: string;
    seleniumSessionId?: string;
    capabilities?: {
        [key: string]: any;
        browserName?: 'chromium' | '';
    };
    baseUrl?: string;
};
declare function validatePWConf(configObj: BaseConfPW): void;
declare function validatePlaywrightConf(configObj: any): any;
export { validatePWConf, validatePlaywrightConf };
