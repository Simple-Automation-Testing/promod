"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriver = void 0;
const remote_1 = require("./remote");
const pw_client_1 = require("../pw_client");
const config_1 = require("../config");
async function getDriver(config = {}, browser) {
    let _config;
    let _browser;
    if (config instanceof pw_client_1.Browser && arguments.length === 1) {
        _browser = config;
        _config = {};
    }
    else {
        _browser = browser;
        _config = config;
    }
    // validate config
    (0, config_1.validatePlaywrightConf)(_config);
    const { driver, server } = await (0, remote_1._getDriver)(_config);
    /**
     * @info
     * init creations of the new driver
     * and init current driver
     */
    _browser.setCreateNewDriver = () => getDriver(_config);
    _browser.setClient({ driver, server });
    if (config.baseUrl) {
        _browser.baseUrl = config.baseUrl;
    }
    return driver;
}
exports.getDriver = getDriver;
//# sourceMappingURL=index.js.map