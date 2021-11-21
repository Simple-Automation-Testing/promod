import * as fs from 'fs';
import {isMap} from 'sat-utils';
import {Builder, Capabilities} from 'selenium-webdriver';
import * as computeFsPaths from 'selenium-standalone/lib/compute-fs-paths';
import * as standAloneDefaultConfig from 'selenium-standalone/lib/default-config';

import * as chrome from 'selenium-webdriver/chrome';
import * as firefox from 'selenium-webdriver/firefox';
/*
import * as ie from 'selenium-webdriver/ie';
import * as edge from 'selenium-webdriver/edge';
*/

const browsers = {
	chrome: {
		getService: (pathToDriver) => new chrome.ServiceBuilder(pathToDriver),
		method: 'setChromeService',
	},
	firefox: {
		getService: (pathToDriver) => new firefox.ServiceBuilder(pathToDriver),
		method: 'setFirefoxService',
	},
};

function getOptsData(opts: {[k: string]: any} = {}) {
	const defaultConfig = standAloneDefaultConfig();

	if (!opts.version) {
		opts.version = defaultConfig.version;
	}

	if (opts.drivers) {
		opts.drivers = Object.keys(opts.drivers).reduce((config, driverName) => {
			config[driverName] = Object.assign({}, defaultConfig.drivers[driverName], opts.drivers[driverName]);
			return config;
		}, {});
	} else {
		opts.drivers = defaultConfig.drivers;
	}

	const fsPaths = computeFsPaths({
		seleniumVersion: opts.version,
		drivers: opts.drivers,
		basePath: opts.basePath,
	});

	return fsPaths;
}

const throwInstructionError = (additional = '') => {
	throw new Error(`${additional}Run 'selenium-standalone install' to download browser drivers and selenium standalone server.`);
};

const checkIfUpdateRequired = (driverName, opts) => {
	if (driverName === 'selenium') {
		if (!fs.existsSync(getOptsData(opts).selenium.installPath)) {
			throwInstructionError();
		}
	}

	if (driverName === 'chrome') {
		if (!fs.existsSync(getOptsData(opts).chrome.installPath)) {
			throwInstructionError();
		}
	}

	if (driverName === 'firefox') {
		if (!fs.existsSync(getOptsData(opts).firefox.installPath)) {
			throwInstructionError();
		}
	}
};

const checkIfDriverOrServerExists = (pathTo) => {
	if (!fs.existsSync(pathTo)) {
		throwInstructionError(`${pathTo} does not exists \n`);
	}
};

const getCombinedConfig = (config: any = {}) => {
	const combinedConfig = config;

	if (!config.capabilities) config.capabilities = Capabilities.chrome();

	if (isMap(combinedConfig.capabilities.map_)) combinedConfig.capabilities = Object.fromEntries(combinedConfig.capabilities.map_);

	if (!combinedConfig.chrome && combinedConfig.capabilities.browserName === 'chrome') {
		checkIfUpdateRequired('chrome', config.selenium);
		const pathToChromedriver = getOptsData(config.selenium).chrome.installPath;

		checkIfDriverOrServerExists(pathToChromedriver);
		combinedConfig.chrome = pathToChromedriver;
	}

	if (!combinedConfig.firefox && combinedConfig.capabilities.browserName === 'firefox') {
		checkIfUpdateRequired('firefox', config.selenium);
		const pathTogeckoDriver = getOptsData(config.selenium).firefox.installPath;

		checkIfDriverOrServerExists(pathTogeckoDriver);
		combinedConfig.firefox = pathTogeckoDriver;
	}

	return combinedConfig;
};

const getLocalDriver = async (config) => {
	const combinedConfig = getCombinedConfig(config);
	const requiredBrowser = combinedConfig.capabilities.browserName;

	const browserService = browsers[requiredBrowser].getService(combinedConfig[requiredBrowser]);
	const serviceCall = browsers[requiredBrowser].method;

	const driver = await new Builder()[serviceCall](browserService)
		.forBrowser(requiredBrowser)
		.build();

	return driver;
};

export {
	getLocalDriver,
};
