import {
  toArray,
  isNotEmptyObject,
  waitForCondition,
  isNumber,
  isAsyncFunction,
  lengthToIndexesArray,
  asyncForEach,
} from 'sat-utils';
import { Key } from 'selenium-webdriver';
import { toNativeEngineExecuteScriptArgs } from '../helpers/execute.script';
import { Locator } from 'playwright-core';
import { KeysPW, resolveUrl } from '../mappers';

import type { BrowserServer, Browser as PWBrowser, BrowserContext, Page } from 'playwright-core';
import type { ExecuteScriptFn, TCookie, TLogLevel } from '../interface';

function validateBrowserCallMethod(browserClass): Browser {
  const protKeys = Object.getOwnPropertyNames(browserClass.prototype).filter((item) => item !== 'constructor');
  for (const key of protKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(browserClass.prototype, key);
    if (isAsyncFunction(descriptor.value)) {
      const originalMethod: (...args: any[]) => Promise<any> = descriptor.value;

      // eslint-disable-next-line no-inner-declarations
      async function decoratedWithChecker(...args) {
        if (!this._engineDriver) {
          throw new Error(`
${key}(): Seems like driver was not initialized, please check how or where did you call getDriver function
or visit https://github.com/Simple-Automation-Testing/promod/blob/master/docs/init.md#getDriver
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

interface IBrowserTab {
  index?: number;
  expectedQuantity?: number;
  title?: string;
  timeout?: number;
}

class PageWrapper {
  /** @private */
  private _context: BrowserContext;
  /** @private */
  private _currentPage: Page;
  /** @private */
  private _initialPage: Page;

  _logs: any[];

  constructor(context: BrowserContext) {
    this._context = context;
    this._logs = [];
  }

  async updateContext(context: BrowserContext) {
    this._context = context;
    const contextPages = await context.pages();

    if (contextPages.length) {
      this._currentPage = contextPages[0];
    } else {
      this._currentPage = await this._context.newPage();
    }
  }

  async getCurrentPage() {
    if (!this._currentPage) {
      const page = await this._context.newPage();
      this._currentPage = page;
      this._initialPage = page;

      this._initialPage.on('console', async (msg) => {
        for (const arg of msg.args()) {
          const msfData = {
            level: msg.type(),
            type: msg.location(),
            timestamp: Date.now(),
            message: await arg.jsonValue(),
          };
          this._logs.push(msfData);
        }
      });
    }

    return this._currentPage;
  }

  async switchToNextPage(data: IBrowserTab = {}) {
    if (isNotEmptyObject(data)) {
      const { index, expectedQuantity, title, timeout } = data;

      let pages = await this._context.pages();
      if (isNumber(expectedQuantity)) {
        await waitForCondition(
          async () => {
            pages = await this._context.pages();
            return pages.length === expectedQuantity;
          },
          {
            message: `Couldn't wait for ${expectedQuantity} tab(s) to appear. Probably you should pass expectedQuantity`,
            timeout,
          },
        );
      }
      if (pages.length > 1) {
        if (title) {
          await waitForCondition(
            async () => {
              pages = await this._context.pages();
              for (const tab of pages) {
                if ((await tab.title()) === title) {
                  this._currentPage = tab;
                  return true;
                }
              }
            },
            { message: `Window with ${title} title was not found during ${timeout}.`, timeout },
          );
        } else {
          this._currentPage = pages[index];
        }
      } else {
        this._currentPage = pages[0];
      }
    } else {
      const pages = await this._context.pages();
      if (pages.length === 1) {
        return this._currentPage;
      } else {
        for (const availablePage of pages) {
          if (availablePage !== this._currentPage) {
            this._currentPage = availablePage;

            return this._currentPage;
          }
        }
      }
    }
  }
}

class ContextWrapper {
  server: PWBrowser;

  /** @private */
  private _currentContext: BrowserContext;
  /** @private */
  private _currentPage: PageWrapper;
  /** @private */
  private _contextConfig: {
    [k: string]: any;
    isMobile?: boolean;
    userAgent?: string;
    viewport?: { width: number; height: number };
  };

  constructor(serverBrowser: PWBrowser, config = {}) {
    this.server = serverBrowser;
    this._contextConfig = config;
  }

  async switchPage(data: IBrowserTab) {
    await this._currentPage.switchToNextPage(data);
  }

  getPageLogs() {
    return this._currentPage._logs;
  }

  async runNewContext(ignoreConfig?: boolean) {
    const config = ignoreConfig ? {} : this._contextConfig;

    const { userAgent, isMobile, viewport } = config;

    this._currentContext = await this.server.newContext({ userAgent, isMobile, viewport });

    if (!this._currentPage) {
      this._currentPage = new PageWrapper(this._currentContext);
    } else {
      await this._currentPage.updateContext(this._currentContext);
    }
  }

  async getCurrentContext() {
    if (!this._currentContext) {
      await this.runNewContext();
    }
    return this._currentContext;
  }

  // TODO implement with tab - page title
  async changeContext({ index, tabTitle }) {
    if (isNumber(index)) {
      const contexts = await this.server.contexts();
      this._currentContext = contexts[index];
      await this._currentPage.updateContext(this._currentContext);
    }
  }

  async getCurrentPage() {
    await this.getCurrentContext();

    if (!this._currentPage) {
      this._currentPage = new PageWrapper(this._currentContext);
    }

    return this._currentPage.getCurrentPage();
  }

  async closeAllContexts() {
    await this._currentContext.close();
    const contexts = await this.server.contexts();
    for (const context of contexts) {
      await context.close();
    }
  }
}

class Browser {
  wait = waitForCondition;
  _engineDriver: PWBrowser;
  _contextWrapper: ContextWrapper;
  _contextFrame: Page;
  _contextFrameHolder: Locator;

  /** @private */
  private _server: BrowserServer;
  /** @private */
  private appBaseUrl: string;
  /** @private */
  private initialTab: any;
  /** @private */
  private _engineDrivers: PWBrowser[];
  /** @private */
  private _createNewDriver: () => Promise<PWBrowser>;

  constructor() {
    this.wait = waitForCondition;
  }

  currentClient() {
    return this._engineDriver;
  }

  async getWorkingContext() {
    if (this._contextFrame) {
      return this._contextFrame;
    }
    return await this._contextWrapper.getCurrentPage();
  }

  async getCurrentPage() {
    return await this._contextWrapper.getCurrentPage();
  }

  async runNewBrowser() {
    await this._contextWrapper.runNewContext();
  }

  // TODO - refactor
  async switchToBrowser({ index, tabTitle }: { index?: number; tabTitle?: string } = {}) {
    await this._contextWrapper.changeContext({ index, tabTitle });
  }

  setClient({ driver, server, config }) {
    this._engineDriver = driver;
    this._contextWrapper = new ContextWrapper(driver, config);
    this._server = server;
  }

  set setCreateNewDriver(driverCreator) {
    this._createNewDriver = driverCreator;
  }

  get keyboard() {
    return KeysPW;
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
    await this.closeAllpagesExceptInitial();
    // set initialTab to null for further "it" to use
    this.initialTab = null;
  }

  private async closeAllpagesExceptInitial() {}

  /**
   *
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.openNewTab('https://www.npmjs.com/package/promod');
   *
   * @param {string} url url that needs to open in new browser tab
   * @return {Promise<void>}
   */
  async openNewTab(url = 'data:,') {
    return (await this._contextWrapper.getCurrentPage()).evaluate((openUrl) => {
      window.open(openUrl, '_blank');
    }, url);
  }

  async switchToTab(tabObject: IBrowserTab) {
    if (!this.initialTab) {
      this.initialTab = await this.getCurrentTab();
    }
    await this.switchToBrowserTab(tabObject);
  }

  /**
   * @info https://github.com/microsoft/playwright/issues/10143
   *
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
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
    const tabsCount = await this.getTabsCount();
    await asyncForEach(lengthToIndexesArray(tabsCount), async (index) => {
      await this.switchToBrowserTab({ index });
      await action();
    });
  }

  /**
   * @info https://github.com/microsoft/playwright/issues/10143
   *
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.setCookies({name: 'test', value: 'test'});
   * @param {TCookie | TCookie[]} cookies cookies object
   * @returns {Promise<void>}
   */
  async setCookies(cookies: TCookie | TCookie[]) {
    const currentUrl = await this.getCurrentUrl();
    const parsed = new URL(currentUrl);
    const cookiesToSet = toArray(cookies).map(({ url = parsed.origin, domain, path, ...items }) => {
      if (domain && path) {
        return { domain, path, ...items };
      }

      return { url, ...items };
    });

    await (await this._contextWrapper.getCurrentContext()).addCookies(cookiesToSet as TCookie[]);
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * const cookies = await browser.getCookies();
   * @return {Promise<Array<TCookie>>} cookies list
   */
  async getCookies() {
    return await (await this._contextWrapper.getCurrentContext()).cookies();
  }

  /**
   * @info https://github.com/microsoft/playwright/issues/10143
   *
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.deleteCookie('test');
   * @param {string} name cookie name
   * @returns {Promise<void>}
   */
  async deleteCookie(name: string): Promise<void> {
    const ctx = await this._contextWrapper.getCurrentContext();
    const filteredCookies = (await ctx.cookies()).filter((cookie) => cookie.name !== name);

    await ctx.clearCookies();
    await ctx.addCookies(filteredCookies);
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * const cookie = await browser.getCookieByName('test');
   * @param {string} name cookie name
   * @return {Promise<{ name: string; value: string }>}
   */
  async getCookieByName(name: string): Promise<{ name: string; value: string }> {
    const ctx = await this._contextWrapper.getCurrentContext();
    const requiredCookie = (await ctx.cookies()).find((cookie) => cookie.name !== name);

    return requiredCookie;
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.deleteAllCookies();
   *
   * @return {Promise<void>}
   */
  async deleteAllCookies(): Promise<void> {
    await (await this._contextWrapper.getCurrentContext()).clearCookies();
  }

  /**
   * switchToBrowserTab
   * @private
   */
  private async switchToBrowserTab(tabObject: IBrowserTab): Promise<void> {
    await this._contextWrapper.switchPage(tabObject);
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * const currentTabsCount = await browser.getTabsCount();
   *
   * @returns {Promise<number>}
   */
  async getTabsCount(): Promise<number> {
    return (await this._contextWrapper.getCurrentContext()).pages().length;
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * const currentPageUrl = await browser.getCurrentUrl();
   *
   * @return {Promise<string>}
   */
  async getCurrentUrl() {
    return (await this._contextWrapper.getCurrentPage()).url();
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * const currentPageScreenshot = await browser.takeScreenshot();
   *
   * @returns {Promise<Buffer>}
   */
  async takeScreenshot(): Promise<Buffer> {
    return (await this._contextWrapper.getCurrentPage()).screenshot();
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.maximize();
   *
   * @return {Promise<void>}
   */
  async maximize(): Promise<void> {
    /**
     * @info it is workaround implementation for maximization of the browser page
     */
    const { width, height } = await (
      await this._contextWrapper.getCurrentPage()
    ).evaluate(() => {
      const { availHeight, availWidth } = window.screen;
      return { width: availWidth, height: availHeight };
    });
    return (await this._contextWrapper.getCurrentPage()).setViewportSize({ width, height });
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * const browserLogs = await browser.getBrowserLogs();
   *
   * @return {Promise<TLogLevel[] | string>}
   */
  async getBrowserLogs(): Promise<TLogLevel[] | string> {
    try {
      return this._contextWrapper.getPageLogs();
    } catch (e) {
      return 'Comman was failed ' + e.toString();
    }
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.keyDownAndHold(browser.keyboard.PageDown)
   *
   * @param {string} key key that needs to press down
   * @return {Promise<void>}
   */
  async keyDownAndHold(key: string) {
    return await (await this.getCurrentPage()).keyboard.down(key);
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.keyUp(browser.keyboard.PageDown)
   *
   * @param {string} key key that needs to press down
   * @return {Promise<void>}
   */
  async keyUp(key: string) {
    return await (await this.getCurrentPage()).keyboard.up(key);
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * cosnt { height, width } = await browser.getWindomSize();
   *
   * @return {Promise<{ height: number; width: number }>} window size
   */
  async getWindomSize(): Promise<{ height: number; width: number }> {
    return await (
      await this._contextWrapper.getCurrentPage()
    ).evaluate(() => ({ height: window.outerHeight, width: window.outerWidth }));
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * cosnt title = await browser.getTitle();
   *
   * @return {Promise<string>} tab (page) title
   */
  async getTitle(): Promise<string> {
    return (await this._contextWrapper.getCurrentPage()).title();
  }

  async getCurrentTab() {
    return await this._contextWrapper.getCurrentPage();
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.get('https://github.com/Simple-Automation-Testing/promod');
   *
   * @param {string} url url that needs to be open
   * @return {Promise<void>}
   */
  async get(url: string): Promise<void> {
    const getUrl = resolveUrl(url, this.appBaseUrl);

    return (await this._contextWrapper.getCurrentPage()).goto(getUrl) as any;
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.switchToIframe('my-iframe');
   *
   * @param {string} selector iframe selector
   * @param {boolean} [jumpToDefaultFirst] should switch to top frame first
   * @return {Promise<void>}
   */
  async switchToIframe(selector: string, jumpToDefaultFirst = false): Promise<void> {
    if (jumpToDefaultFirst) {
      await this.switchToDefauldIframe();
    }

    const currentWorkingContext = this._contextFrameHolder ? this._contextFrameHolder : await this.getWorkingContext();

    const requiredFrame = await currentWorkingContext.frameLocator(selector).locator('*').first();
    this._contextFrameHolder = requiredFrame;

    this._contextFrame = (await requiredFrame.elementHandle()) as any as Page;
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.switchToDefauldIframe();
   *
   * @return {Promise<void>}
   */
  async switchToDefauldIframe(): Promise<void> {
    this._contextFrame = null;
    this._contextFrameHolder = null;
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.setWindowSize(800, 600);
   *
   * @param {number} width window width
   * @param {number} height window height
   * @return {Promise<void>}
   */
  async setWindowSize(width: number, height: number): Promise<void> {
    (await this._contextWrapper.getCurrentPage()).setViewportSize({ width, height });
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.sleep(800);
   *
   * @param {number} time time in ms
   * @return {Promise<void>}
   */
  async sleep(time: number) {
    await (() => new Promise((resolve) => setTimeout(resolve, time)))();
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * const result = await browser.executeScript(() => document.body.offsetHeight);
   *
   * @param {!Function} script scripts that needs to be executed
   * @param {any|any[]} [args] function args
   * @returns {Promise<unknown>}
   */
  async executeScript(script: ExecuteScriptFn, args?: any | any[]): Promise<any> {
    const recomposedArgs = await toNativeEngineExecuteScriptArgs(args);

    const res = await (await this.getWorkingContext()).evaluate(script, recomposedArgs);

    return res;
  }

  /**
   * @deprecated
   */
  async executeAsyncScript(script: any, ...args: any[]): Promise<any> {
    throw new TypeError('Not supported for playwright engine');
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.back();
   *
   * @return {Promise<void>}
   */
  async back(): Promise<void> {
    return (await this._contextWrapper.getCurrentPage()).goBack() as any;
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.forward();
   *
   * @return {Promise<void>}
   */
  async forward(): Promise<void> {
    return (await this._contextWrapper.getCurrentPage()).goForward() as any;
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.refresh();
   *
   * @return {Promise<void>}
   */
  async refresh(): Promise<void> {
    return (await this._contextWrapper.getCurrentPage()).reload() as any;
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.quit();
   *
   * @return {Promise<void>}
   */
  async quit(): Promise<void> {
    if (this._engineDrivers && this._engineDrivers.length) {
      const index = this._engineDrivers.findIndex((driver) => driver === this._engineDriver);
      if (index !== -1) this._engineDrivers.splice(index, 1);
    }

    await (await this._contextWrapper.getCurrentContext()).close();
    this._engineDriver = null;
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.quitAll();
   *
   * @return {Promise<void>}
   */
  async quitAll() {
    await this._contextWrapper.closeAllContexts();
    await this._engineDriver.close();
    if (this._server) {
      await this._server.close();
    }
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.close();
   *
   * @return {Promise<void>}
   */
  async close(): Promise<void> {
    return (await this.getCurrentPage()).close();
  }
}

const browser = validateBrowserCallMethod(Browser);

export { browser, Browser };
