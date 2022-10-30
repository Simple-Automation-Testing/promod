import { Browser as PWBrowser } from 'playwright-core';
import { _getDriver } from './remote';
import { BaseConfPW } from '../config/config';
import { Browser } from '../pw_client';
import { validatePlaywrightConf } from '../config';

async function getDriver(config: BaseConfPW | Browser = {}, browser?: Browser): Promise<PWBrowser> {
  let _config;
  let _browser;

  if (config instanceof Browser && arguments.length === 1) {
    _browser = config;
    _config = {};
  } else {
    _browser = browser;
    _config = config;
  }

  // validate config
  validatePlaywrightConf(_config);

  const { driver, server, config: commonConfig } = await _getDriver(_config);

  /**
   * @info
   * init creations of the new driver
   * and init current driver
   */

  _browser.setCreateNewDriver = (): Promise<PWBrowser> => getDriver(_config);
  _browser.setClient({ driver, server, config: commonConfig });

  if (config.baseUrl) {
    _browser.baseUrl = config.baseUrl;
  }

  return driver;
}

export { getDriver };
