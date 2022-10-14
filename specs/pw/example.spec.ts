import { By, WebDriver, until, Key } from 'selenium-webdriver';
import { expect } from 'assertior';
import { playwrightWD, BaseConf } from '../lib';

describe.skip('Base', () => {
  it('example spec', async () => {
    const { getDriver, browser } = playwrightWD;
    const config: BaseConf = {
      seleniumSessionId: 'a77dc7a90c1f59bb7aa31622415761d3',
      seleniumAddress: 'http://localhost:4444/wd/hub',
    };
    await getDriver(config, browser);
    await browser.get('https://google.com');
  });
});
