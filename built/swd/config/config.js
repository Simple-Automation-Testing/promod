"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSeleniumConf = void 0;
const sat_utils_1 = require("sat-utils");
const fs = require("fs");
const checkPathes = ['seleniumServerJar', 'chromeDriver', 'geckoDriver'];
const checkString = ['seleniumAddress', 'seleniumSessionId', 'baseUrl'];
function validateSeleniumConf(configObj) {
    const configKeys = Object.keys(configObj);
    for (const key of configKeys) {
        if ((checkPathes.includes(key) || checkString.includes(key)) &&
            !(0, sat_utils_1.isString)(configObj[key]) &&
            !(0, sat_utils_1.isUndefined)(configObj[key])) {
            throw new TypeError(`
config: ${key} value should be a string,
please use BaseConf type or visit https://github.com/Simple-Automation-Testing/promod/blob/master/lib/swd/config/config.ts
			`);
        }
        if (checkPathes.includes(key) &&
            !(0, sat_utils_1.isUndefined)(configObj[key]) &&
            (0, sat_utils_1.isString)(configObj[key]) &&
            !fs.existsSync(configObj[key])) {
            throw new TypeError(`
config: ${key} ${configObj[key]} file does not exist
please use BaseConf type or visit https://github.com/Simple-Automation-Testing/promod/blob/master/lib/swd/config/config.ts
			`);
        }
    }
}
exports.validateSeleniumConf = validateSeleniumConf;
//# sourceMappingURL=config.js.map