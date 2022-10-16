"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._getDriver = void 0;
const local_1 = require("./local");
const _getDriver = async (config) => {
    const combinedConfig = config || { capabilities: { browserName: 'chrome' } };
    if (!combinedConfig.capabilities) {
        combinedConfig.capabilities = { browserName: 'chrome' };
    }
    if (config.wsEndpoint) {
        const driver = await local_1.browserNameMapping[combinedConfig.capabilities.browserName].connect(config.wsEndpoint);
        return { driver };
    }
    if (config.browserCDPWSEndpoint) {
        const driver = await local_1.browserNameMapping[combinedConfig.capabilities.browserName].connectOverCDP(config.wsEndpoint);
        return { driver };
    }
    const { server, wsEndpoint } = await (0, local_1.runLocalEnv)(config);
    const driver = await local_1.browserNameMapping[combinedConfig.capabilities.browserName].connect(wsEndpoint);
    return { driver, server };
};
exports._getDriver = _getDriver;
//# sourceMappingURL=remote.js.map