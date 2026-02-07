import { chromium } from 'playwright';
import { Browser, Builder } from 'selenium-webdriver';
import { expect } from 'assertior';
import { seleniumWD, playwrightWD } from '../lib';

const { ENGINE } = process.env;

const engine = ENGINE === 'pw' ? playwrightWD : seleniumWD;

async function getEngine() {
  if (ENGINE === 'pw') {
    const lauchedChrome = await chromium.launch({ headless: false });
    engine.browser.setClient({ driver: lauchedChrome } as any);
  } else {
    require('chromedriver');
    const lauchedChrome = await new Builder().forBrowser(Browser.CHROME).build();
    engine.browser.setClient({
      driver: lauchedChrome,
      lauchNewInstance: async () => await new Builder().forBrowser(Browser.CHROME).build(),
    } as any);
  }

  return engine;
}

export * from './misc/setup';
export { getEngine, expect, engine };
