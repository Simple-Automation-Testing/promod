export declare type BaseConfSWD = {
    [key: string]: any;
    localSeleniumStandaloneOpts?: {
        port?: number | string;
        args?: string[];
        jvmArgs?: string[];
    };
    seleniumServerJar?: string;
    chromeDriver?: string;
    geckoDriver?: string;
    seleniumAddress?: string;
    seleniumSessionId?: string;
    capabilities?: {
        [key: string]: any;
        browserName?: string;
    };
    baseUrl?: string;
};
declare function validateSeleniumConf(configObj: BaseConfSWD): void;
export { validateSeleniumConf };
