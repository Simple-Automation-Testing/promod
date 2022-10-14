import { isString, isUndefined } from 'sat-utils';
import * as fs from 'fs';

const checkPathes = ['seleniumServerJar', 'chromeDriver', 'geckoDriver'];
const checkString = ['seleniumAddress', 'seleniumSessionId', 'baseUrl'];

export type BaseConfPW = {
  [key: string]: any;
  localSeleniumStandaloneOpts?: {
    port?: number | string;
    args?: string[];
    jvmArgs?: string[];
  };
  seleniumAddress?: string;
  seleniumSessionId?: string;
  // Browser capabilities
  capabilities?: {
    [key: string]: any;
    browserName?: 'chromium' | '';
  };
  // Opts
  baseUrl?: string;
};

function validatePWConf(configObj: BaseConfPW) {
  const configKeys = Object.keys(configObj);
  for (const key of configKeys) {
    if (
      (checkPathes.includes(key) || checkString.includes(key)) &&
      !isString(configObj[key]) &&
      !isUndefined(configObj[key])
    ) {
      throw new TypeError(`
config: ${key} value should be a string,
please use BaseConf type or visit https://github.com/Simple-Automation-Testing/promod/blob/master/lib/swd/config/config.ts
			`);
    }

    if (
      checkPathes.includes(key) &&
      !isUndefined(configObj[key]) &&
      isString(configObj[key]) &&
      !fs.existsSync(configObj[key])
    ) {
      throw new TypeError(`
config: ${key} ${configObj[key]} file does not exist
please use BaseConf type or visit https://github.com/Simple-Automation-Testing/promod/blob/master/lib/swd/config/config.ts
			`);
    }
  }
}

function validatePlaywrightConf(configObj) {
  return configObj;
}

export { validatePWConf, validatePlaywrightConf };
