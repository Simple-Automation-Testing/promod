import { Browser, BrowserServer } from 'playwright-core';
import { runLocalEnv, browserNameMapping } from './local';

const _getDriver = async (config): Promise<{ driver: Browser; server?: BrowserServer; config?: any }> => {
  const combinedConfig = config || { capabilities: { browserName: 'chrome' } };

  const restConfig = {
    isMobile: config.isMobile,
    userAgent: config.userAgent,
    viewport: config.viewport,
  };

  if (!combinedConfig.capabilities) {
    combinedConfig.capabilities = { browserName: 'chrome' };
  }

  if (config.wsEndpoint) {
    const driver = await browserNameMapping[combinedConfig.capabilities.browserName].connect(config.wsEndpoint);

    return { driver };
  }

  if (config.browserCDPWSEndpoint) {
    const driver = await browserNameMapping[combinedConfig.capabilities.browserName].connectOverCDP(config.wsEndpoint);
    return { driver };
  }

  const { server, wsEndpoint } = await runLocalEnv(config);

  const driver = await browserNameMapping[combinedConfig.capabilities.browserName].connect(wsEndpoint);

  return { driver, server, config: restConfig };
};

export { _getDriver };
