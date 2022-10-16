"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePlaywrightConf = exports.validatePWConf = void 0;
const checkString = ['seleniumAddress', 'seleniumSessionId', 'baseUrl'];
function validatePWConf(configObj) {
    const configKeys = Object.keys(configObj);
    //       throw new TypeError(`
    // config: ${key} value should be a string,
    // please use BaseConf type or visit https://github.com/Simple-Automation-Testing/promod/blob/master/lib/swd/config/config.ts
    // 			`);
    //     }
    //       throw new TypeError(`
    // config: ${key} ${configObj[key]} file does not exist
    // please use BaseConf type or visit https://github.com/Simple-Automation-Testing/promod/blob/master/lib/swd/config/config.ts
    // 			`);
}
exports.validatePWConf = validatePWConf;
function validatePlaywrightConf(configObj) {
    return configObj;
}
exports.validatePlaywrightConf = validatePlaywrightConf;
//# sourceMappingURL=config.js.map