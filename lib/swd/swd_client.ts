import {
  toArray,
  isArray,
  waitForCondition,
  isNumber,
  safeJSONstringify,
  isAsyncFunction,
  isNotEmptyObject,
  compareToPattern,
} from 'sat-utils';
import { WebDriver, Key } from 'selenium-webdriver';
import { toNativeEngineExecuteScriptArgs } from '../helpers/execute.script';
import { buildBy } from './swd_alignment';
import { KeysSWD, resolveUrl } from '../mappers';

import type { ExecuteScriptFn, TCookie, TLogLevel, TSwitchBrowserTabPage } from '../interface';

const availableToRunEvenIfCurrentDriverDoesNotExist = ['constructor', 'runNewBrowser', 'switchToBrowser', 'quitAll'];

function validateBrowserCallMethod(browserClass): Browser {
  const protKeys = Object.getOwnPropertyNames(browserClass.prototype).filter(
    (item) => !availableToRunEvenIfCurrentDriverDoesNotExist.includes(item),
  );

  for (const key of protKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(browserClass.prototype, key);
    if (isAsyncFunction(descriptor.value)) {
      const originalMethod: (...args: any[]) => Promise<any> = descriptor.value;

      // eslint-disable-next-line no-inner-declarations
      async function decoratedWithChecker(...args) {
        if (!this.seleniumDriver) {
          throw new Error(`
${key}(): Seems like driver was not initialized, please check how or where did you call getDriver function
or visit https://github.com/Simple-Automation-Testing/promod/blob/master/docs/init.md#getdriver
					`);
        }

        return originalMethod.call(this, ...args);
      }

      Object.defineProperty(decoratedWithChecker, 'name', { value: key });

      descriptor.value = decoratedWithChecker;
      Object.defineProperty(browserClass.prototype, key, descriptor);
    }
  }
  return new browserClass();
}

class Browser {
  wait = waitForCondition;
  seleniumDriver: WebDriver;
  private appBaseUrl: string;
  private initialTab: any;
  private drivers: WebDriver[];
  private _createNewDriver: () => Promise<{ driver: WebDriver }>;
  private _browserConfig;

  constructor() {
    this.wait = waitForCondition;
    this.seleniumDriver;
  }

  currentClient() {
    return this.seleniumDriver;
  }

  get keyboard() {
    return KeysSWD;
  }

  async keyDownAndHold(key: string) {
    await this.seleniumDriver.actions().keyDown(key).perform();
  }

  async keyUp(key: string) {
    await this.seleniumDriver.actions().keyUp(key).perform();
  }

  async runNewBrowser() {
    if (!this._createNewDriver) {
      throw new Error('createNewDriver(): seems like create driver method was not inited');
    }

    if (!isArray(this.drivers)) {
      this.drivers = [];
    }

    if (this.seleniumDriver) {
      this.drivers.push(this.seleniumDriver);
    }

    const { driver } = await this._createNewDriver();

    this.seleniumDriver = driver;
  }

  async switchToIframe(element: string, jumpToDefaultFirst = false) {
    if (jumpToDefaultFirst) {
      await this.switchToDefauldIframe();
    }

    await this.seleniumDriver.switchTo().frame(this.seleniumDriver.findElement(buildBy(element)));
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.switchToDefauldIframe();
   *
   * @return {Promise<void>}
   */
  async switchToDefauldIframe() {
    await this.seleniumDriver.switchTo().defaultContent();
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.switchToBrowser();
   *
   * @return {Promise<void>}
   */
  async switchToBrowser(browserData: TSwitchBrowserTabPage = {}) {
    const { index, ...tabData } = browserData;

    if (this.seleniumDriver && this.drivers && this.drivers.length) {
      this.drivers = [this.seleniumDriver, ...this.drivers];
      this.seleniumDriver = null;
    }

    if (isNumber(index) && isArray(this.drivers) && this.drivers.length > index) {
      // TODO find better solution
      const [driver] = this.drivers.splice(index, 1);

      this.seleniumDriver = driver;

      return;
    }

    if (isNotEmptyObject(tabData)) {
      for (const driver of this.drivers) {
        this.seleniumDriver = driver;

        const result = await this.switchToBrowserTab({ ...tabData })
          .then(
            () => true,
            () => false,
          )
          .catch(() => false);

        if (result) {
          const index = this.drivers.findIndex((item) => item === this.seleniumDriver);
          this.drivers.splice(index, 1);
          return;
        }
      }
    }

    throw new Error(`switchToBrowser(): required browser was not found`);
  }

  set setCreateNewDriver(driverCreator) {
    this._createNewDriver = driverCreator;
  }

  setClient(client) {
    this.seleniumDriver = client;
  }

  get Key() {
    return Key;
  }

  get baseUrl() {
    return this.appBaseUrl;
  }

  set baseUrl(url) {
    this.appBaseUrl = url;
  }

  async returnToInitialTab() {
    // there was no switching in test
    if (!this.initialTab) {
      return;
    }
    await this.closeAllTabsExceptInitial();
    this.seleniumDriver.switchTo().window(this.initialTab);
    // set initialTab to null for further "it" to use
    this.initialTab = null;
  }

  private async closeAllTabsExceptInitial() {
    const handles = await this.getTabs();
    handles.splice(handles.indexOf(this.initialTab), 1);
    await this.makeActionAtEveryTab(async () => this.close(), handles);
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * const tabTitles = [];
   * await browser.makeActionAtEveryTab(async () => {
   *    tabTitles.push(await browser.getTitle());
   * });
   *
   * @param {!Function} action action that needs to be performed
   * @return {Promise<void>}
   */
  async makeActionAtEveryTab(action: (...args: any) => Promise<any>, handles?: string[]) {
    handles = handles || (await this.getTabs());
    for (const windowHandle of handles) {
      await this.seleniumDriver.switchTo().window(windowHandle);
      await action();
    }
  }

  /**
   * switchToBrowserTab
   * @private
   */
  private async switchToBrowserTab(tabObject: TSwitchBrowserTabPage = {}) {
    const { index, expectedQuantity, timeout = 5000, ...titleUrl } = tabObject;

    if (isNumber(expectedQuantity)) {
      let errorMessage;

      await waitForCondition(
        async () => {
          const tabs = await this.getTabs();

          errorMessage = () =>
            `Expected browser tabs count is ${expectedQuantity}, current browser tabs count is ${tabs.length}`;

          return tabs.length === expectedQuantity;
        },
        { message: errorMessage, timeout },
      );
    }

    if (isNumber(index) && (await this.getTabs()).length < index + 1) {
      throw new Error(
        `Index is out available browser tabs count, index is ${index}, current browser tabs count is ${
          (await this.getTabs()).length
        }`,
      );
    } else if (isNumber(index)) {
      return await this.seleniumDriver.switchTo().window((await this.getTabs())[index]);
    }

    if (isNotEmptyObject(titleUrl)) {
      let errorMessage;

      await waitForCondition(
        async () => {
          const tabs = await this.getTabs();

          for (const tab of tabs) {
            await this.seleniumDriver.switchTo().window(tab);

            const currentBrowserState = {
              url: await this.getCurrentUrl(),
              title: await this.getTitle(),
            };

            const { result } = compareToPattern(currentBrowserState, titleUrl, { stringIncludes: true });

            if (result) return true;
          }

          errorMessage = () =>
            `Expected browser tab state is ${safeJSONstringify(titleUrl)}, current browser tab states was not met`;
        },
        { message: errorMessage, timeout },
      );
    }
  }

  /**
   *
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.openNewTab('https://www.npmjs.com/package/promod');
   *
   * @param {string} url url that needs to open in new browser tab
   * @return {Promise<void>}
   */
  async openNewTab(url = 'data:,') {
    await this.seleniumDriver.executeScript((openUrl) => {
      window.open(openUrl, '_blank');
    }, url);
  }

  /**
   *
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.switchToTab({ index: 2, expectedQuantity: 3 });
   *
   * @param {TSwitchBrowserTabPage} tabObject tab description
   * @return {Promise<void>}
   */
  async switchToTab(tabObject: TSwitchBrowserTabPage) {
    if (!this.initialTab) {
      this.initialTab = await this.seleniumDriver.getWindowHandle();
    }
    await this.switchToBrowserTab(tabObject);
  }

  /**
   *
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.setCookies({name: 'test', value: 'test'});
   * @param {TCookie | TCookie[]} cookies cookies object
   * @returns {Promise<void>}
   */
  async setCookies(cookies: TCookie | TCookie[]) {
    const cookiesArr = toArray(cookies);
    for (const cookie of cookiesArr) {
      await (await this.seleniumDriver.manage()).addCookie(cookie);
    }
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * const cookies = await browser.getCookies();
   * @return {Promise<Array<TCookie>>} cookies list
   */
  async getCookies() {
    return await (await this.seleniumDriver.manage()).getCookies();
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * const cookie = await browser.getCookieByName('test');
   * @param {string} name cookie name
   * @return {Promise<{ name: string; value: string }>}
   */
  async getCookieByName(name: string) {
    return await (await this.seleniumDriver.manage()).getCookie(name);
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.deleteCookie('test');
   * @param {string} name cookie name
   * @returns {Promise<void>}
   */
  async deleteCookie(name: string) {
    await (await this.seleniumDriver.manage()).deleteCookie(name);
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.deleteAllCookies();
   * @returns {Promise<void>}
   */
  async deleteAllCookies() {
    await (await this.seleniumDriver.manage()).deleteAllCookies();
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * cosnt title = await browser.getTitle();
   *
   * @return {Promise<string>} tab (page) title
   */
  async getTitle() {
    return await this.seleniumDriver.getTitle();
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * const currentPageUrl = await browser.getCurrentUrl();
   *
   * @return {Promise<string>}
   */
  async getCurrentUrl() {
    return await this.seleniumDriver.getCurrentUrl();
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * cosnt { height, width } = await browser.getWindomSize();
   *
   * @return {Promise<{ height: number; width: number }>} window size
   */
  async getWindomSize(): Promise<{ height: number; width: number }> {
    return await this.seleniumDriver.executeScript(() => ({ height: window.outerHeight, width: window.outerWidth }));
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * const currentPageScreenshot = await browser.takeScreenshot();
   *
   * @returns {Promise<Buffer>}
   */
  async takeScreenshot(): Promise<Buffer> {
    const res = await this.seleniumDriver.takeScreenshot();

    return Buffer.from(res, 'base64');
  }

  async getTabs() {
    return await this.seleniumDriver.getAllWindowHandles();
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * const currentTabsCount = await browser.getTabsCount();
   *
   * @returns {Promise<number>}
   */
  async getTabsCount() {
    return (await this.seleniumDriver.getAllWindowHandles()).length;
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.get('https://github.com/Simple-Automation-Testing/promod');
   *
   * @param {string} url url that needs to be open
   * @return {Promise<void>}
   */
  async get(url: string) {
    const getUrl = resolveUrl(url, this.appBaseUrl);

    return await this.seleniumDriver.get(getUrl);
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.setWindowSize(800, 600);
   *
   * @param {number} width window width
   * @param {number} height window height
   * @return {Promise<void>}
   */
  async setWindowSize(width: number, height: number) {
    return await this.seleniumDriver.manage().window().setRect({
      width,
      height,
    });
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.sleep(800);
   *
   * @param {number} time time in ms
   * @return {Promise<void>}
   */
  async sleep(time: number) {
    await (() => new Promise((resolve) => setTimeout(resolve, time)))();
  }

  /** @depreacted */
  manage() {
    return this.seleniumDriver.manage();
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * const result = await browser.executeScript(() => document.body.offsetHeight);
   *
   * @param {!Function} script scripts that needs to be executed
   * @param {any|any[]} [args] function args
   * @returns {Promise<unknown>}
   */
  async executeScript(script: ExecuteScriptFn, args?: any | any[]): Promise<any> {
    const recomposedArgs = await toNativeEngineExecuteScriptArgs(args);
    const res = await this.seleniumDriver.executeScript(script, recomposedArgs);

    return res;
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.back();
   *
   * @return {Promise<void>}
   */
  async back() {
    return (await this.seleniumDriver.navigate()).back();
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.forward();
   *
   * @return {Promise<void>}
   */
  async forward() {
    return (await this.seleniumDriver.navigate()).forward();
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.refresh();
   *
   * @return {Promise<void>}
   */
  async refresh() {
    return (await this.seleniumDriver.navigate()).refresh();
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.quit();
   *
   * @return {Promise<void>}
   */
  async quit() {
    if (this.drivers && this.drivers.length) {
      const index = this.drivers.findIndex((driver) => driver === this.seleniumDriver);
      if (index !== -1) this.drivers.splice(index, 1);
    }
    await this.seleniumDriver.quit();
    this.seleniumDriver = null;
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.quitAll();
   *
   * @return {Promise<void>}
   */
  async quitAll() {
    const drivers = toArray(this.drivers);
    this.drivers = [];

    if (this.seleniumDriver) {
      await this.seleniumDriver.quit();
    }
    this.seleniumDriver = null;

    for (const driver of drivers) {
      await driver.quit().catch((_) => ({}));
    }
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.maximize();
   *
   * @return {Promise<void>}
   */
  async maximize(): Promise<void> {
    const { width, height } = (await this.seleniumDriver.executeScript(() => {
      const { availHeight, availWidth } = window.screen;
      return { width: availWidth, height: availHeight };
    })) as { width: number; height: number };

    const manage = await this.seleniumDriver.manage();
    await manage.window().setRect({ width, height });
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * const browserLogs = await browser.getBrowserLogs();
   *
   * @return {Promise<TLogLevel[] | string>}
   */
  async getBrowserLogs(): Promise<TLogLevel[] | string> {
    try {
      // @ts-ignore
      const manage = await this.seleniumDriver.manage();

      return manage.logs().get('browser') as any;
    } catch (e) {
      return 'Comman was failed ' + e.toString();
    }
  }

  /**
   * @info
   * when you close current browser and you still have another browser sessions
   * you have to switch to another browser manually via switchToBrowser
   *
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.close();
   *
   * @return {Promise<void>}
   */
  async close(): Promise<void> {
    await this.seleniumDriver.close();
    this.seleniumDriver = null;
  }
}

const browser = validateBrowserCallMethod(Browser);

export { browser, Browser };
