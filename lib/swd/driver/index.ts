import { WebDriver } from 'selenium-webdriver';
import { _getDriver } from './remote';
import { BaseConfSWD } from '../config/config';
import { Browser } from '../swd_client';
import { validateSeleniumConf } from '../config';

async function getDriver(config: BaseConfSWD | Browser = {}, browser?: Browser): Promise<WebDriver> {
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
  validateSeleniumConf(_config);

  const driver = await _getDriver(_config);

  /**
   * @info
   * init creations of the new driver
   * and init current driver
   */

  _browser.setCreateNewDriver = () => _getDriver(_config);
  _browser.setClient(driver);

  if (config.baseUrl) {
    _browser.baseUrl = config.baseUrl;
  }

  return driver;
}

export { getDriver };
