declare const browserNameMapping: {
    chrome: import("playwright-core").BrowserType<{}>;
    firefox: import("playwright-core").BrowserType<{}>;
};
declare const runLocalEnv: (config: any) => Promise<any>;
export { runLocalEnv, browserNameMapping };
