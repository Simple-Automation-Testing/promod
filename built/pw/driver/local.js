"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.browserNameMapping = exports.runLocalEnv = void 0;
const playwright_core_1 = require("playwright-core");
const browserNameMapping = {
    chrome: playwright_core_1.chromium,
    firefox: playwright_core_1.firefox,
};
exports.browserNameMapping = browserNameMapping;
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