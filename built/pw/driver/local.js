"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.browserNameMapping = exports.runLocalEnv = void 0;
const playwright_1 = require("playwright");
const browserNameMapping = {
    chrome: playwright_1.chromium,
    firefox: playwright_1.firefox,
};
exports.browserNameMapping = browserNameMapping;
(async () => {
    const browserServer = await playwright_1.chromium.launchServer();
    const wsEndpoint = browserServer.wsEndpoint();
    // Use web socket endpoint later to establish a connection.
    const browser = await playwright_1.chromium.connect(wsEndpoint);
    // Close browser instance.
    await browserServer.close();
})();
const throwInstructionError = (additional = '') => {
    throw new Error(`${additional}Run 'npm install playwright' to download and install browsers`);
};
const getCombinedConfig = (config = {}) => {
    const combinedConfig = config;
    return combinedConfig;
};
const runLocalEnv = async (config) => {
    if (config.wsEndpoint || config.browserCDPWSEndpoint) {
        return config;
    }
    const combinedConfig = getCombinedConfig(config);
    const server = await browserNameMapping[config.capabilities.browserName].launchServer({ headless: false });
    const wsEndpoint = server.wsEndpoint();
    return {
        server,
        wsEndpoint,
        capabilities: combinedConfig.capabilities,
    };
};
exports.runLocalEnv = runLocalEnv;
//# sourceMappingURL=local.js.map