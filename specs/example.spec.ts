import { By, WebDriver, until, Key } from 'selenium-webdriver';
import { expect } from 'assertior';
import { seleniumWD, BaseConf } from '../lib';

describe.skip('Base', () => {
  it('example spec', async () => {
    const { getSeleniumDriver, browser } = seleniumWD;
    const config: BaseConf = {
      seleniumSessionId: 'a77dc7a90c1f59bb7aa31622415761d3',
      seleniumAddress: 'http://localhost:4444/wd/hub',
    };
    await getSeleniumDriver(config, browser);
    await browser.get('https://google.com');
  });
});
