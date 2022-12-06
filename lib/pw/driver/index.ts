import { Browser as PWBrowser } from 'playwright-core';
import { _getDriver } from './remote';
import { findDeviceMetrics, findDownloadDefaultDir, findUserAgentIfExists, findViewPort } from './mappers';
import { BaseConfPW } from '../config/config';
import { Browser } from '../pw_client';
import { validatePlaywrightConf } from '../config';

function getPwCtxConfig(capabilitiesDescriptor) {
  const isMobile = findDeviceMetrics(capabilitiesDescriptor) ? true : false;
  const viewport = findDeviceMetrics(capabilitiesDescriptor) || findViewPort(capabilitiesDescriptor);
  const userAgent = findUserAgentIfExists(capabilitiesDescriptor);

  return { isMobile, viewport, userAgent };
}

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

  const { driver, server } = await _getDriver(_config);

  /**
   * @info
   * init creations of the new driver
   * and init current driver
   */
  _browser.setCreateNewDriver = (): Promise<PWBrowser> => getDriver(_config);
  _browser.setClient({ driver, server, config: getPwCtxConfig(_config) });

  if (config.baseUrl) {
    _browser.baseUrl = config.baseUrl;
  }

  return driver;
}

export { getDriver };
