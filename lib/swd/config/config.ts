import {isString, isUndefined} from 'sat-utils';
import * as fs from 'fs';

const checkPathes = ['seleniumServerJar', 'chromeDriver', 'geckoDriver'];
const checkString = ['seleniumAddress', 'seleniumSessionId', 'baseUrl'];

export type BaseConf = {
	[key: string]: any;
	localSeleniumStandaloneOpts?: {
		port?: number | string;
		args?: string[];
		jvmArgs?: string[];
	};
	// Selenium drivers options
	seleniumServerJar?: string;
	chromeDriver?: string;
	geckoDriver?: string;

	seleniumAddress?: string;
	seleniumSessionId?: string;
	// Browser capabilities
	capabilities?: {
		[key: string]: any;
		browserName?: string;
	};
	// Opts
	baseUrl?: string;
}

function validateSeleniumConf(configObj: BaseConf) {
	const configKeys = Object.keys(configObj);
	for (const key of configKeys) {
		if ((checkPathes.includes(key) || checkString.includes(key)) && (!isString(configObj[key]) && !isUndefined(configObj[key]))) {
			throw new TypeError(`
config: ${key} value should be a string,
please use BaseConf type or visit https://github.com/Simple-Automation-Testing/promod/blob/master/lib/swd/config/config.ts
			`);
		}

		if (checkPathes.includes(key) && (!isUndefined(configObj[key]) && isString(configObj[key]) && !fs.existsSync(configObj[key]))) {
			throw new TypeError(`
config: ${key} ${configObj[key]} file does not exist
please use BaseConf type or visit https://github.com/Simple-Automation-Testing/promod/blob/master/lib/swd/config/config.ts
			`);
		}
	}
}

export {
	validateSeleniumConf
};
