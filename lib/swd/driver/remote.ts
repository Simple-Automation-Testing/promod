import { Builder, Capabilities, WebDriver } from 'selenium-webdriver';
import * as _http from 'selenium-webdriver/http';

import { runLocalEnv } from './local';

const _getDriver = async (config) => {
  const combinedConfig = config || { capabilities: Capabilities.chrome() };
  if (!combinedConfig.capabilities) {
    combinedConfig.capabilities = Capabilities.chrome();
  }

  if (config.seleniumSessionId) {
    const driver = await new WebDriver(
      config.seleniumSessionId,
      new _http.Executor(Promise.resolve(config.seleniumAddress).then((url) => new _http.HttpClient(url, null, null))),
    );

    return { driver, config };
  }

  const { seleniumAddress, capabilities = Capabilities.chrome() } = await runLocalEnv(combinedConfig);

  const driver = new Builder().usingServer(seleniumAddress).withCapabilities(capabilities).build();

  return { driver, config: { seleniumAddress, capabilities } };
};

export { _getDriver };
