import { WebDriver } from 'selenium-webdriver';
import { BaseConfSWD } from '../config/config';
import { Browser } from '../swd_client';
declare function getSeleniumDriver(config?: BaseConfSWD | Browser, browser?: Browser): Promise<WebDriver>;
export { getSeleniumDriver };
