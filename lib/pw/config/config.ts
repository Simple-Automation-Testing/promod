import { isString, isUndefined } from 'sat-utils';
import * as fs from 'fs';

const checkString = ['baseUrl'];

export type BaseConfPW = {
  [key: string]: any;
  capabilities?: {
    [key: string]: any;
    browserName?: 'chromium' | '';
  };
  // Opts
  baseUrl?: string;
};

function validatePWConf(configObj: BaseConfPW) {
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

function validatePlaywrightConf(configObj) {
  return configObj;
}

export { validatePWConf, validatePlaywrightConf };
