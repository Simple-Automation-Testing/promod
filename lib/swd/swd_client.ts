import {
  toArray,
  isArray,
  isString,
  waitForCondition,
  isNumber,
  safeJSONstringify,
  isAsyncFunction,
  isNotEmptyObject,
  compareToPattern,
} from 'sat-utils';
import { WebDriver, Key, WebElement } from 'selenium-webdriver';
import { toNativeEngineExecuteScriptArgs } from '../helpers/execute.script';
import { buildBy } from './swd_alignment';
import { KeysSWD, resolveUrl } from '../mappers';
import { promodLogger } from '../internals';

import type { ExecuteScriptFn, TCookie, TLogLevel, TSwitchBrowserTabPage, PromodElementType } from '../interface';

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
  private _createNewDriver: (capabilities?: any) => Promise<{ driver: WebDriver }>;
  private _browserConfig;

  static getBrowser() {
    return validateBrowserCallMethod(Browser);
  }

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

  injectEngine({ driver }: { driver?: WebDriver }) {
    this.seleniumDriver = driver;
  }

  async scrollElementByMouseWheel(element: PromodElementType, x, y, deltaX, deltaY, duration) {
    promodLogger.engineLog(
      `[SWD] Promod client interface calls method "scrollElementByMouseWheel" from wrapped API, args: `,
      element,
      x,
      y,
      deltaX,
      deltaY,
      duration,
    );
    await this.seleniumDriver
      .actions()
      // @ts-ignore
      .scroll(x, y, deltaX, deltaY, await element.getEngineElement(), duration)
      .perform();
  }

  async scrollByMouseWheel(x, y, deltaX, deltaY, duration) {
    promodLogger.engineLog(
      `[SWD] Promod client interface calls method "scrollByMouseWheel" from wrapped API, args: `,
      x,
      y,
      deltaX,
      deltaY,
      duration,
    );
    await this.seleniumDriver
      .actions()
      // @ts-ignore
      .scroll(x, y, deltaX, deltaY, undefined, duration)
      .perform();
  }


  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.keyDownAndHold(browser.keyboard.PageDown)
   *
   * @param {string} key key that needs to press down
   * @return {Promise<void>}
   */
  async keyDownAndHold(key: string, element?: PromodElementType) {
    promodLogger.engineLog(
      `[SWD] Promod client interface calls method "keyDownAndHold" from wrapped API, args: `,
      key,
      element,
    );
    if (element) {
      await this.seleniumDriver
        .actions()
        .move({ origin: (await element.getEngineElement()) as WebElement })
        .keyDown(key)
        .perform();
    } else {
      await this.seleniumDriver.actions().keyDown(key).perform();
    }
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.keyUp(browser.keyboard.PageDown)
   *
   * @param {string} key key that needs to press down
   * @return {Promise<void>}
   */
  async keyUp(key: string, element?: PromodElementType) {
    promodLogger.engineLog(`[SWD] Promod client interface calls method "keyUp" from wrapped API, args: `, key, element);
    if (element) {
      await this.seleniumDriver
        .actions()
        .move({ origin: (await element.getEngineElement()) as any })
        .keyUp(key)
        .perform();
    } else {
      await this.seleniumDriver.actions().keyUp(key).perform();
    }
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.keyDownAndUp(browser.keyboard.PageDown)
   *
   * @param {string} key key that needs to press down
   * @return {Promise<void>}
   */
  async keyDownAndUp(key: string, element?: PromodElementType) {
    promodLogger.engineLog(`[SWD] Promod client interface calls method "keyUp" from wrapped API, args: `, key, element);
    if (element) {
      await this.seleniumDriver
        .actions()
        .move({ origin: (await element.getEngineElement()) as any })
        .keyDown(key)
        .keyUp(key)
        .perform();
    } else {
      await this.seleniumDriver.actions().keyDown(key).keyUp(key).perform();
    }
  }

  /**
   *
   * @param {object} [browserDescription] browser descriptions
   */
  async runNewBrowser({
    currentBrowserName,
    newBrowserName,
    capabilities,
  }: { currentBrowserName?: string; newBrowserName?: string; capabilities?: any } = {}) {
    promodLogger.engineLog(
      `[SWD] Promod client interface calls method "runNewBrowser" from wrapped API, args: `,
      currentBrowserName,
      newBrowserName,
      capabilities,
    );
    if (!this._createNewDriver) {
      throw new Error('createNewDriver(): seems like create driver method was not inited');
    }

    if (!isArray(this.drivers)) {
      this.drivers = [];
    }

    if (this.seleniumDriver && currentBrowserName) {
      this.seleniumDriver['__promodBrowserName'] = currentBrowserName;
    }

    if (this.seleniumDriver) {
      this.drivers.push(this.seleniumDriver);
    }

    const { driver } = await this._createNewDriver(capabilities);
    if (newBrowserName) {
      driver['__promodBrowserName'] = newBrowserName;
    }
    this.seleniumDriver = driver;
  }

  async switchToIframe(selector: string | any, jumpToDefaultFirst = false) {
    promodLogger.engineLog(
      `[SWD] Promod client interface calls method "switchToIframe" from wrapped API, args: `,
      selector,
      jumpToDefaultFirst,
    );
    if (jumpToDefaultFirst) {
      await this.switchToDefauldIframe();
    }

    await this.seleniumDriver.switchTo().frame(this.seleniumDriver.findElement(buildBy(selector)));
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "switchToDefauldIframe" from wrapped API`);
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
    promodLogger.engineLog(
      `[SWD] Promod client interface calls method "switchToBrowser" from wrapped API, args: `,
      browserData,
    );
    const { index, browserName, ...tabData } = browserData;

    if (this.seleniumDriver && this.drivers && this.drivers.length) {
      const isDriverInPool = this.drivers.find((item) => item === this.seleniumDriver);
      if (!isDriverInPool) {
        this.drivers = [...this.drivers, this.seleniumDriver];
      }
    }

    if (isString(browserName)) {
      const driver = this.drivers.find((item) => item['__promodBrowserName'] === browserName);
      // TODO find better solution
      if (!driver) {
        throw new Error(`Browser with name ${browserName} not found`);
      }

      this.seleniumDriver = driver;

      return;
    }

    if (isNumber(index) && isArray(this.drivers) && this.drivers.length > index) {
      // TODO find better solution
      this.seleniumDriver = this.drivers[index];

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
          this.seleniumDriver = this.drivers[index];
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "returnToInitialTab" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "closeAllTabsExceptInitial" from wrapped API`);
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
    promodLogger.engineLog(
      `[SWD] Promod client interface calls method "makeActionAtEveryTab" from wrapped API, args: `,
      action,
    );
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
    const { strictEquality = true, index, expectedQuantity, timeout = 5000, ...titleUrl } = tabObject;

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

            const { result } = compareToPattern(currentBrowserState, titleUrl, { stringIncludes: !strictEquality });

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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "openNewTab" from wrapped API, args: `, url);
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
    promodLogger.engineLog(
      `[SWD] Promod client interface calls method "switchToTab" from wrapped API, args: `,
      tabObject,
    );
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "setCookies" from wrapped API, args: `, cookies);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "getCookies" from wrapped API`);
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
    promodLogger.engineLog(
      `[SWD] Promod client interface calls method "getCookieByName" from wrapped API, args: `,
      name,
    );
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "deleteCookie" from wrapped API, args: `, name);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "deleteAllCookies" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "getTitle" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "getCurrentUrl" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "getWindomSize" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "takeScreenshot" from wrapped API`);
    const res = await this.seleniumDriver.takeScreenshot();

    return Buffer.from(res, 'base64');
  }

  /**
   * @example
   * const { seleniumWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * const currentPageScreenshot = await browser.getTabs();
   *
   * @returns {Promise<any[]>}
   */
  async getTabs() {
    promodLogger.engineLog(`[SWD] Promod client interface calls method "getTabs" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "getTabsCount" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "get" from wrapped API`);
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
    promodLogger.engineLog(
      `[SWD] Promod client interface calls method "setWindowSize" from wrapped API, args: `,
      width,
      height,
    );
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "sleep" from wrapped API, args: `, time);
    await (() => new Promise((resolve) => setTimeout(resolve, time)))();
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
    promodLogger.engineLog(
      `[SWD] Promod client interface calls method "executeScript" from wrapped API, args: `,
      script,
      args,
    );
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "back" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "forward" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "refresh" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "quit" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "quitAll" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "maximize" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "getBrowserLogs" from wrapped API`);
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
    promodLogger.engineLog(`[SWD] Promod client interface calls method "close" from wrapped API`);
    await this.seleniumDriver.close();
  }
}

const browser = Browser.getBrowser();

export { browser, Browser };
