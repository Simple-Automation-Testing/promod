"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSeleniumDriver = void 0;
const remote_1 = require("./remote");
const swd_client_1 = require("../swd_client");
const config_1 = require("../config");
async function getSeleniumDriver(config = {}, browser) {
    let _config;
    let _browser;
    if (config instanceof swd_client_1.Browser && arguments.length === 1) {
        _browser = config;
        _config = {};
    }
    else {
        _browser = browser;
        _config = config;
    }
    // validate config
    (0, config_1.validateSeleniumConf)(_config);
    const driver = await (0, remote_1.getDriver)(_config);
    /**
     * @info
     * init creations of the new driver
     * and init current driver
     */
    _browser.setCreateNewDriver = () => (0, remote_1.getDriver)(_config);
    _browser.setClient(driver);
    if (config.baseUrl) {
        _browser.baseUrl = config.baseUrl;
    }
    return driver;
}
exports.getSeleniumDriver = getSeleniumDriver;
//# sourceMappingURL=index.js.map