import * as fs from 'fs';
import * as computeFsPaths from 'selenium-standalone/lib/compute-fs-paths';
import * as standAloneDefaultConfig from 'selenium-standalone/lib/default-config';
import * as getPort from 'get-port';

import { SeleniumServer } from 'selenium-webdriver/remote';

async function getOptsData(opts: { [k: string]: any } = {}) {
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

  const fsPaths = await computeFsPaths({
    seleniumVersion: opts.version,
    drivers: opts.drivers,
    basePath: opts.basePath,
  });
  return fsPaths;
}

const throwInstructionError = (additional = '') => {
  throw new Error(
    `${additional}Run 'selenium-standalone install' to download browser drivers and selenium standalone server.`,
  );
};

async function checkIfUpdateRequired(driverName, opts) {
  const optsData = await getOptsData(opts);
  if (driverName === 'selenium') {
    if (!fs.existsSync(optsData.selenium.installPath)) {
      throwInstructionError();
    }
  }

  if (driverName === 'chrome') {
    if (!fs.existsSync(optsData.chrome.installPath)) {
      throwInstructionError();
    }
  }

  if (driverName === 'firefox') {
    if (!fs.existsSync(optsData.firefox.installPath)) {
      throwInstructionError();
    }
  }
}

function checkIfDriverOrServerExists(pathTo) {
  if (!fs.existsSync(pathTo)) {
    throwInstructionError(`${pathTo} does not exists \n`);
  }
}

async function getCombinedConfig(config: any = {}) {
  const combinedConfig = config;

  if (!config.seleniumServerStartTimeout) {
    config.seleniumServerStartTimeout = 30000;
  }

  combinedConfig.capabilities =
    combinedConfig.capabilities.map_ instanceof Map
      ? Object.fromEntries(combinedConfig.capabilities.map_)
      : combinedConfig.capabilities;

  if (!combinedConfig.seleniumServerJar) {
    const optsData = await getOptsData(config.selenium);
    checkIfUpdateRequired('selenium', config.selenium);
    const pathToServer = optsData.selenium.installPath;

    checkIfDriverOrServerExists(pathToServer);
    combinedConfig.seleniumServerJar = pathToServer;
  }

  if (!combinedConfig.chromeDriver && combinedConfig.capabilities.browserName === 'chrome') {
    const optsData = await getOptsData(config.selenium);
    checkIfUpdateRequired('chrome', config.selenium);
    const pathToChromedriver = optsData.chrome.installPath;

    checkIfDriverOrServerExists(pathToChromedriver);
    combinedConfig.chromeDriver = pathToChromedriver;
  }

  if (!combinedConfig.geckoDriver && combinedConfig.capabilities.browserName === 'firefox') {
    const optsData = await getOptsData(config.selenium);
    checkIfUpdateRequired('firefox', config.selenium);
    const pathTogeckoDriver = optsData.firefox.installPath;

    checkIfDriverOrServerExists(pathTogeckoDriver);
    combinedConfig.geckoDriver = pathTogeckoDriver;
  }

  return combinedConfig;
}

async function runLocalEnv(config) {
  if (config.seleniumAddress) {
    return config;
  }
  const combinedConfig = await getCombinedConfig(config);
  const serverConf = combinedConfig.localSeleniumStandaloneOpts || {};
  const port = combinedConfig.seleniumPort || (await getPort());

  if (!serverConf.args) {
    serverConf.args = combinedConfig.seleniumArgs || [];
  }
  if (!serverConf.jvmArgs) {
    serverConf.jvmArgs = combinedConfig.jvmArgs || [];
  } else if (!Array.isArray(serverConf.jvmArgs)) {
    throw new TypeError('jvmArgs should be an array.');
  }
  if (!serverConf.port) {
    serverConf.port = port;
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
    seleniumAddress: address,
    capabilities: combinedConfig.capabilities,
  };
}

export { runLocalEnv };
