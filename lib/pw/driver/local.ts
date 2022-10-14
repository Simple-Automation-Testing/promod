import { chromium, firefox, Browser } from 'playwright';

const browserNameMapping = {
  chrome: chromium,
  firefox,
};

(async () => {
  const browserServer = await chromium.launchServer();
  const wsEndpoint = browserServer.wsEndpoint();
  // Use web socket endpoint later to establish a connection.
  const browser = await chromium.connect(wsEndpoint);
  // Close browser instance.
  await browserServer.close();
})();

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
