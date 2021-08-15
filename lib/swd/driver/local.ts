import * as fs from 'fs';
import * as computeFsPaths from 'selenium-standalone/lib/compute-fs-paths';
import * as standAloneDefaultConfig from 'selenium-standalone/lib/default-config';

import {SeleniumServer} from 'selenium-webdriver/remote';

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

	if (!config.seleniumServerStartTimeout) {
		config.seleniumServerStartTimeout = 30000;
	}

	combinedConfig.capabilities =
		combinedConfig.capabilities.map_ instanceof Map
			? Object.fromEntries(combinedConfig.capabilities.map_)
			: combinedConfig.capabilities;

	if (!combinedConfig.seleniumServerJar) {
		checkIfUpdateRequired('selenium', config.selenium);
		const pathToServer = getOptsData(config.selenium).selenium.installPath;

		checkIfDriverOrServerExists(pathToServer);
		combinedConfig.seleniumServerJar = pathToServer;
	}

	if (!combinedConfig.chromeDriver && combinedConfig.capabilities.browserName === 'chrome') {
		checkIfUpdateRequired('chrome', config.selenium);
		const pathToChromedriver = getOptsData(config.selenium).chrome.installPath;

		checkIfDriverOrServerExists(pathToChromedriver);
		combinedConfig.chromeDriver = pathToChromedriver;
	}

	if (!combinedConfig.geckoDriver && combinedConfig.capabilities.browserName === 'firefox') {
		checkIfUpdateRequired('firefox', config.selenium);
		const pathTogeckoDriver = getOptsData(config.selenium).firefox.installPath;

		checkIfDriverOrServerExists(pathTogeckoDriver);
		combinedConfig.geckoDriver = pathTogeckoDriver;
	}

	return combinedConfig;
};

const runLocalEnv = async (config) => {
	if (config.seleniumAddress) {
		return config;
	}
	const combinedConfig = getCombinedConfig(config);

	const serverConf = combinedConfig.localSeleniumStandaloneOpts || {};

	if (!serverConf.args) {
		serverConf.args = combinedConfig.seleniumArgs || [];
	}
	if (!serverConf.jvmArgs) {
		serverConf.jvmArgs = combinedConfig.jvmArgs || [];
	} else if (!Array.isArray(serverConf.jvmArgs)) {
		throw new TypeError('jvmArgs should be an array.');
	}
	if (!serverConf.port) {
		serverConf.port = combinedConfig.seleniumPort;
	}

	if (combinedConfig.chromeDriver) {
		serverConf.jvmArgs.push(`-Dwebdriver.chrome.driver=${combinedConfig.chromeDriver}`);
	}
	if (combinedConfig.geckoDriver) {
		serverConf.jvmArgs.push(`-Dwebdriver.gecko.driver=${combinedConfig.geckoDriver}`);
	}

	const server = new SeleniumServer(combinedConfig.seleniumServerJar, serverConf);

	await server.start(combinedConfig.seleniumServerStartTimeout);

	const address = await server.address();

	return {
		server,
		seleniumAddress: address,
		capabilities: combinedConfig.capabilities,
	};
};

export {
	runLocalEnv,
};
