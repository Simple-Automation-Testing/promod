import {WebDriver} from 'selenium-webdriver';
import {getDriver} from './remote';
import {BaseConf} from '../config/config';
import {Browser} from '../swd_client';
import {validateSeleniumConf} from '../config';

async function getSeleniumDriver(config: BaseConf | Browser = {}, browser?: Browser): Promise<WebDriver> {
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

	const driver = await getDriver(_config);

	/**
	 * @info
	 * init creations of the new driver
	 * and init current driver
	 */

	_browser.setCreateNewDriver = () => getDriver(_config);
	_browser.setClient(driver);

	if (config.baseUrl) {
		_browser.baseUrl = config.baseUrl;
	}

	return driver;
}

export {
	getSeleniumDriver
};
