import {By} from 'selenium-webdriver';
import {seleniumWD} from '../lib';

async function test() {
	const {getSeleniumDriver, browser, $, $$} = seleniumWD;
	const searchInput = $('input[name="q"]');

	const withBy = $(By.css('input[name="q"]'));

	await getSeleniumDriver(undefined, browser);
	await browser.get('https://www.google.com/');
	await searchInput.sendKeys('test' + browser.Key.ENTER);
	await withBy.sendKeys(browser.Key.ENTER);

	await browser.sleep(25000);
	await browser.quit();
}

