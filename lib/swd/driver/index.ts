import {WebDriver} from 'selenium-webdriver';
import {getDriver} from './remote';
import {BaseConf} from '../config/config';

async function getSeleniumDriver(config: BaseConf = {}, browser): Promise<WebDriver> {
	const driver = await getDriver(config);
	browser.setClient(driver);
	if (config.baseUrl) {
		browser.baseUrl = config.baseUrl;
	}
	return driver;
}

export {
	getSeleniumDriver
};
