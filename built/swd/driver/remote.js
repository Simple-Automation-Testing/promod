"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriver = void 0;
const selenium_webdriver_1 = require("selenium-webdriver");
const _http = require("selenium-webdriver/http");
const local_1 = require("./local");
const getDriver = async (config) => {
    const combinedConfig = config || { capabilities: selenium_webdriver_1.Capabilities.chrome() };
    if (!combinedConfig.capabilities) {
        combinedConfig.capabilities = selenium_webdriver_1.Capabilities.chrome();
    }
    if (config.seleniumSessionId) {
        const driver = await new selenium_webdriver_1.WebDriver(config.seleniumSessionId, new _http.Executor(Promise.resolve(config.seleniumAddress).then((url) => new _http.HttpClient(url, null, null))));
        return driver;
    }
    const { seleniumAddress, capabilities = selenium_webdriver_1.Capabilities.chrome() } = await (0, local_1.runLocalEnv)(combinedConfig);
    const driver = new selenium_webdriver_1.Builder().usingServer(seleniumAddress).withCapabilities(capabilities).build();
    return driver;
};
exports.getDriver = getDriver;
//# sourceMappingURL=remote.js.map