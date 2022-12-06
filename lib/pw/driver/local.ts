import { isBoolean, safeJSONstringify } from 'sat-utils';
import { chromium, firefox, webkit } from 'playwright-core';

import type { BrowserType } from 'playwright-core';

const browserNameMapping = {
  chrome: chromium,
  firefox,
  webkit,
};

const shouldBeHeadless = (args: string[], isHeadlessRequired, fullConfig) => {
  if (safeJSONstringify(fullConfig).includes('--headless')) {
    return true;
  }

  if (isBoolean(isHeadlessRequired)) {
    return isHeadlessRequired;
  }

  return args.some((arg) => arg === '--headless');
};

const throwInstructionError = (additional = '') => {
  throw new Error(`${additional}Run 'npx playwright install' to download and install browsers`);
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

  // TODO investigate how add prefs to chrome
  const { downloadsPath, headless = false, args = [], agent } = combinedConfig;

  const isHeadless = shouldBeHeadless(args, headless, combinedConfig);

  const server = await (browserNameMapping[config.capabilities.browserName] as BrowserType).launchServer({
    headless: isHeadless,
    args,
    downloadsPath,
  });
  const wsEndpoint = server.wsEndpoint();

  return {
    server,
    wsEndpoint,
    capabilities: combinedConfig.capabilities,
  };
};

export { runLocalEnv, browserNameMapping };
