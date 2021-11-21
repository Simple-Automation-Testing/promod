import {Builder, Capabilities, WebDriver} from 'selenium-webdriver';
import * as _http from 'selenium-webdriver/http';

const getRemoteDriver = async (config) => {
	const combinedConfig = config || {capabilities: Capabilities.chrome()};

	if (!combinedConfig.capabilities) {
		combinedConfig.capabilities = Capabilities.chrome();
	}

	if (config.seleniumSessionId) {
		return await new WebDriver(
			config.seleniumSessionId,
			new _http.Executor(Promise.resolve(config.seleniumAddress)
				.then((url) => new _http.HttpClient(url, null, null)))
		);
	}

	const driver = new Builder()
		.usingServer(config.seleniumAddress)
		.withCapabilities(config.capabilities)
		.build();

	return driver;
};

export {
	getRemoteDriver,
};
