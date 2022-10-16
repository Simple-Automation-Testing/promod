import { chromium, firefox } from 'playwright-core';

const browserNameMapping = {
  chrome: chromium,
  firefox,
};

const throwInstructionError = (additional = '') => {
  throw new Error(`${additional}Run 'npm install playwright' to download and install browsers`);
};

const getCombinedConfig = (config: any = {}) => {
  const combinedConfig = config;

  return combinedConfig;
};

const runLocalEnv = async (config) => {
  if (config.wsEndpoint || config.browserCDPWSEndpoint) {
    return config;
  }
  const combinedConfig = getCombinedConfig(config);

  const server = await browserNameMapping[config.capabilities.browserName].launchServer({ headless: false });
  const wsEndpoint = server.wsEndpoint();

  return {
    server,
    wsEndpoint,
    capabilities: combinedConfig.capabilities,
  };
};

export { runLocalEnv, browserNameMapping };
