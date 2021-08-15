import {WebDriver} from 'selenium-webdriver';
import {getDriver} from './remote';

async function getSeleniumDriver(config = {}, browser): Promise<WebDriver> {
	const driver = await getDriver(config);
	browser.setClient(driver);
	return driver;
}

export {
	getSeleniumDriver
};
