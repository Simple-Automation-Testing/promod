declare const browserNameMapping: {
    chrome: any;
    firefox: any;
};
declare const runLocalEnv: (config: any) => Promise<any>;
export { runLocalEnv, browserNameMapping };
