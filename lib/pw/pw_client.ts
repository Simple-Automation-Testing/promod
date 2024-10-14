import {
  toArray,
  isNotEmptyObject,
  waitForCondition,
  isNumber,
  isAsyncFunction,
  lengthToIndexesArray,
  asyncForEach,
  asyncSome,
  safeJSONstringify,
  isString,
  isArray,
  asyncFilter,
} from 'sat-utils';
import { compare } from 'sat-compare';
import { toNativeEngineExecuteScriptArgs } from '../helpers/execute.script';
import { Locator } from 'playwright-core';
import { KeysPW, resolveUrl } from '../mappers';
import { promodLogger } from '../internals';

import type { BrowserServer, Browser as PWBrowser, BrowserContext, Page, ElementHandle } from 'playwright-core';
import type {
  TSwitchToIframe,
  ExecuteScriptFn,
  TCookie,
  TLogLevel,
  TSwitchBrowserTabPage,
  PromodElementType,
} from '../interface';

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

  async switchToNextPage(tabObject: TSwitchBrowserTabPage = {}) {
    const { strictEquality = true, index = 0, expectedQuantity, timeout = 5000, ...titleUrl } = tabObject;

    if (isNumber(expectedQuantity)) {
      let errorMessage;

      await waitForCondition(
        async () => {
          const tabs = this._context.pages();

          errorMessage = () =>
            `Expected browser tabs count is ${expectedQuantity}, current browser tabs count is ${tabs.length}`;

          return tabs.length === expectedQuantity;
        },
        { message: errorMessage, timeout },
      );
    }

    if (isNumber(index) && this._context.pages().length < index + 1) {
      throw new Error(
        `Index is out available browser tabs count, index is ${index}, current browser tabs count is ${
          this._context.pages().length
        }`,
      );
    } else if (isNumber(index)) {
      this._currentPage = this._context.pages()[index];
    }

    if (isNotEmptyObject(titleUrl)) {
      let errorMessage;
      await waitForCondition(
        async () => {
          const tabs = this._context.pages();

          for (const tab of tabs) {
            this._currentPage = tab;

            const currentBrowserState = {
              url: await this._currentPage.url(),
              title: await this._currentPage.title(),
            };

            const { result } = compare(currentBrowserState, titleUrl, { stringIncludes: !strictEquality });

            if (result) return true;
          }

          errorMessage = () =>
            `Expected browser tab state is ${safeJSONstringify(titleUrl)}, current browser tab states was not met`;
        },
        { message: errorMessage, timeout },
      );
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

  async switchPage(data: TSwitchBrowserTabPage) {
    await this._currentPage.switchToNextPage(data);
  }

  getPageLogs() {
    return this._currentPage._logs;
  }

  async runNewContext(browserData: { currentBrowserName?: string; newBrowserName?: string; capabilities?: any } = {}) {
    const { currentBrowserName, newBrowserName, capabilities } = browserData;
    const config = capabilities || this._contextConfig;
    const { userAgent, isMobile, viewport } = config;

    if (isString(currentBrowserName)) {
      this._currentContext['__promodBrowserName'] = currentBrowserName;
    }

    this._currentContext = await this.server.newContext({ userAgent, isMobile, viewport });

    if (isString(newBrowserName)) {
      this._currentContext['__promodBrowserName'] = newBrowserName;
    }

    if (!this._currentPage) {
      this._currentPage = new PageWrapper(this._currentContext);
    } else {
      await this._currentPage.updateContext(this._currentContext);
    }

    this._currentContext.on('page', async (page) => {
      // @ts-ignore
      this._currentContext._pages.add(page);
    });
  }

  async getCurrentContext() {
    if (!this._currentContext) {
      await this.runNewContext();
    }

    return this._currentContext;
  }

  // TODO implement with tab - page title
  async changeContext({ index, browserName }: TSwitchBrowserTabPage) {
    const contexts = await this.server.contexts();

    if (isNumber(index) && contexts[index]) {
      this._currentContext.removeListener('page', () => {});
      this._currentContext = contexts[index];
      this._currentContext.on('page', async (page) => {
        // @ts-ignore
        this._currentContext._pages.add(page);
      });
      await this._currentPage.updateContext(this._currentContext);
    }

    if (browserName && contexts.find((item) => item['__promodBrowserName'] === browserName)) {
      this._currentContext.removeListener('page', () => {});
      this._currentContext = contexts.find((item) => item['__promodBrowserName'] === browserName);
      this._currentContext.on('page', async (page) => {
        // @ts-ignore
        this._currentContext._pages.add(page);
      });
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
    if (this._currentContext) {
      await this._currentContext.close();
    }
    const contexts = await this.server.contexts();
    for (const context of contexts) {
      await context.close();
    }
  }

  async getContexts() {
    return await this.server.contexts();
  }
}

class Browser {
  wait = waitForCondition;
  _engineDriver: PWBrowser;
  _contextWrapper: ContextWrapper;
  _contextFrame: Page | (() => Promise<Page>);
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

  static getBrowser() {
    return validateBrowserCallMethod(Browser);
  }

  currentClient() {
    return this._engineDriver;
  }

  async injectPagePreloadScript(script: string) {
    const page = await this.getCurrentPage();
    await page.addInitScript(script);
  }

  injectEngine({ context, page }: { context?: BrowserContext; page?: Page }) {
    if (context) {
      const browser = context.browser();
      this._contextWrapper = new ContextWrapper(browser);
    }
    if (page) {
      const context = page.context();
      const browser = context.browser();
      this._contextWrapper = new ContextWrapper(browser);
    }
  }

  /** @private */
  private async getWorkingContext(): Promise<Page> {
    if (isAsyncFunction(this._contextFrame)) {
      return await (this._contextFrame as () => Promise<Page>)();
    }

    return await this._contextWrapper.getCurrentPage();
  }

  /** @private */
  private async getCurrentPage() {
    return await this._contextWrapper.getCurrentPage();
  }

  async setBasicAuth(authData: { username: string; password: string }, dontThrowOnError: boolean = true) {
    try {
      const page = await this.getCurrentPage();

      await page.setExtraHTTPHeaders({
        Authorization: `Basic ${Buffer.from(`${authData.username}:${authData.password}`).toString('base64')}`,
      });
    } catch (error) {
      if (dontThrowOnError) {
        console.error(error);
      } else {
        throw error;
      }
    }
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * const currentPageScreenshot = await browser.getTabs();
   *
   * @returns {Promise<any[]>}
   */
  async getTabs() {
    promodLogger.engineLog(`[PW] Promod client interface calls method "getTabs" from wrapped API`);
    return await (await this._contextWrapper.getCurrentContext()).pages();
  }

  async runNewBrowser(browserData: { currentBrowserName?: string; newBrowserName?: string; capabilities?: any } = {}) {
    promodLogger.engineLog(
      `[PW] Promod client interface calls method "runNewBrowser" from wrapped API, args: `,
      browserData.currentBrowserName,
      browserData.newBrowserName,
      browserData.capabilities,
    );
    await this._contextWrapper.runNewContext(browserData);
  }

  async switchToBrowser(browserData: TSwitchBrowserTabPage = {}) {
    const { index, browserName, ...tabData } = browserData;

    if (isNumber(index) && (await this._contextWrapper.getContexts()).length > index) {
      return await this._contextWrapper.changeContext({ index });
    }
    if (isString(browserName)) {
      return await this._contextWrapper.changeContext({ browserName });
    }

    if (isNotEmptyObject(tabData)) {
      for (const [index] of (await this._contextWrapper.getContexts()).entries()) {
        await this._contextWrapper.changeContext({ index });
        const result = await this.switchToBrowserTab(tabData)
          .then(
            () => true,
            () => false,
          )
          .catch(() => false);
        if (result) {
          return;
        }
      }
    }

    throw new Error(`switchToBrowser(): required browser was not found`);
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
    return KeysPW;
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

  /**
   *
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = seleniumWD;
   *
   * await browser.switchToTab({ index: 2, expectedQuantity: 3 });
   *
   * @param {TSwitchBrowserTabPage} tabObject tab description
   * @return {Promise<void>}
   */
  async switchToTab(tabObject: TSwitchBrowserTabPage) {
    promodLogger.engineLog(
      `[PW] Promod client interface calls method "switchToTab" from wrapped API, args: `,
      tabObject,
    );
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
    const requiredCookie = (await ctx.cookies()).find((cookie) => cookie.name === name);

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
  private async switchToBrowserTab(tabObject: TSwitchBrowserTabPage): Promise<void> {
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
   * @param [opts={ timeout: 2500 }] timeout
   *
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * const currentPageScreenshot = await browser.takeScreenshot();
   *
   * @returns {Promise<Buffer>}
   */
  async takeScreenshot(opts = { timeout: 2500 }): Promise<Buffer> {
    promodLogger.engineLog(`[PW] Promod client interface calls method "takeScreenshot" from wrapped API`);
    return (await this._contextWrapper.getCurrentPage()).screenshot(opts).catch((e) => {
      return Buffer.from('');
    });
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
    (await this._contextWrapper.getCurrentPage()).setViewportSize({ width, height });
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
  async keyDownAndHold(key: string | string[], element?: PromodElementType) {
    promodLogger.engineLog(
      `[PW] Promod client interface calls method "keyDownAndHold" from wrapped API, args: `,
      key,
      element,
    );
    if (element) {
      ((await element.getEngineElement()) as ElementHandle).hover();
    }
    for (const k of toArray(key)) {
      await (await this.getCurrentPage()).keyboard.down(k);
      await (await this.getCurrentPage()).keyboard.down(k);
    }

    return true;
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.keyUp(browser.keyboard.PageDown)
   *
   * @param {string|string[]} key key that needs to press down
   * @return {Promise<void>}
   */
  async keyUp(key: string | string[], element?: PromodElementType) {
    promodLogger.engineLog(`[PW] Promod client interface calls method "keyUp" from wrapped API, args: `, key, element);

    if (element) {
      ((await element.getEngineElement()) as ElementHandle).hover();
    }
    for (const k of toArray(key)) {
      await (await this.getCurrentPage()).keyboard.up(k);
    }

    return true;
  }

  /**
   * @example
   * const { playwrightWD } = require('promod');
   * const { browser } = playwrightWD;
   *
   * await browser.keyDownAndUp(browser.keyboard.PageDown)
   *
   * @param {string|string[]} key key that needs to press down
   * @return {Promise<void>}
   */
  async keyDownAndUp(key: string | string[], element?: PromodElementType) {
    promodLogger.engineLog(`[PW] Promod client interface calls method "keyUp" from wrapped API, args: `, key, element);
    if (element) {
      ((await element.getEngineElement()) as Locator).focus();
    }
    for (const k of toArray(key)) {
      await (await this.getCurrentPage()).keyboard.down(k);
      await (await this.getCurrentPage()).keyboard.up(k);
    }

    return true;
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
    promodLogger.engineLog(`[PW] Promod client interface calls method "getWindomSize" from wrapped API`);
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

    (await this._contextWrapper.getCurrentPage()).goto(getUrl) as any;

    await (await this._contextWrapper.getCurrentPage())
      .waitForLoadState('domcontentloaded', { timeout: 10_000 })
      .catch(console.error);
    await (await this._contextWrapper.getCurrentPage())
      .waitForLoadState('load', { timeout: 10_000 })
      .catch(console.error);
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
  async switchToIframe(
    selector: string,
    jumpToDefaultFirst = false,
    { timeout = 30_000, message = '' }: TSwitchToIframe = {},
  ): Promise<void> {
    promodLogger.engineLog(
      `[PW] Promod client interface calls method "switchToIframe" from wrapped API, args: `,
      selector,
      jumpToDefaultFirst,
    );
    if (jumpToDefaultFirst) {
      await this.switchToDefauldIframe();
    }

    this._contextFrame = async () => {
      return await waitForCondition(
        async () => {
          const page = await this.getCurrentPage();
          const pageFrames = await page.frames();
          const frames = await asyncFilter(
            pageFrames,
            async (frame) =>
              (
                await frame
                  .frameLocator(selector)
                  .first()
                  .locator('*')
                  .all()
                  .catch(() => [])
              ).length > 0,
          );

          for (const [_index, frame] of frames.entries()) {
            const allElements = await frame
              .frameLocator(selector)
              .first()
              .locator('*')
              .all()
              .catch(() => []);

            const res = await asyncSome(allElements, async (item) => await item.isVisible());

            if (res) {
              return (await (
                await frame.frameLocator(selector).first().locator('*').first().elementHandle({ timeout: 25 })
              ).ownerFrame()) as any as Page;
            }
          }
        },
        {
          timeout,
          message: (t, e = 'without error') =>
            `switchToIframe('${selector}'): required iframe was not found, timeout ${t}, error: ${e} ${
              message ? '\n' + message : ''
            } `,
        },
      );
    };
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
    promodLogger.engineLog(`[PW] Promod client interface calls method "switchToDefauldIframe" from wrapped API`);
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
    promodLogger.engineLog(
      `[PW] Promod client interface calls method "setWindowSize" from wrapped API, args: `,
      width,
      height,
    );
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
    promodLogger.engineLog(`[PW] Promod client interface calls method "sleep" from wrapped API, args: `, time);
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
   * @returns {Promise<any>}
   */
  async executeScript(script: ExecuteScriptFn, args?: any | any[]): Promise<any> {
    promodLogger.engineLog(
      `[PW] Promod client interface calls method "executeScript" from wrapped API, args: `,
      script,
      args,
    );

    let recomposedArgs = await toNativeEngineExecuteScriptArgs(args);
    if (isArray(recomposedArgs)) {
      for (const [index, item] of Object.entries(recomposedArgs)) {
        recomposedArgs[index] = (item as any)?.elementHandle ? await (item as any)?.elementHandle() : item;
      }
    } else {
      recomposedArgs = recomposedArgs?.elementHandle ? await recomposedArgs.elementHandle() : recomposedArgs;
    }

    const result = await waitForCondition(
      async () => await (await this.getWorkingContext()).evaluate(script, recomposedArgs),
      { stopIfNoError: true, timeout: 2000, interval: 500 },
    );

    for (const item of toArray(recomposedArgs)) {
      (item as any)?.dispose && (await (item as any)?.dispose());
    }

    return result;
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
    promodLogger.engineLog(`[PW] Promod client interface calls method "back" from wrapped API`);
    (await this._contextWrapper.getCurrentPage()).goBack() as any;
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
    promodLogger.engineLog(`[PW] Promod client interface calls method "forward" from wrapped API`);
    (await this._contextWrapper.getCurrentPage()).goForward() as any;
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
    promodLogger.engineLog(`[PW] Promod client interface calls method "refresh" from wrapped API`);
    (await this._contextWrapper.getCurrentPage()).reload() as any;
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
    promodLogger.engineLog(`[PW] Promod client interface calls method "quit" from wrapped API`);
    await (await this._contextWrapper.getCurrentContext()).close();
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
    promodLogger.engineLog(`[PW] Promod client interface calls method "close" from wrapped API`);
    (await this.getCurrentPage()).close();
  }

  async scrollElementByMouseWheel(element: PromodElementType, x, y, deltaX, deltaY, duration) {
    promodLogger.engineLog(
      `[PW] Promod client interface calls method "scrollElementByMouseWheel" from wrapped API, args: `,
      element,
      x,
      y,
      deltaX,
      deltaY,
      duration,
    );
    const { x: elementX, y: elementY } = await element.getRect();

    (await this.getCurrentPage()).mouse.move(elementX + x, elementY + y);

    (await this.getCurrentPage()).mouse.wheel(deltaX, deltaY);
  }

  async scrollByMouseWheel(x, y, deltaX, deltaY, duration) {
    promodLogger.engineLog(
      `[PW] Promod client interface calls method "scrollByMouseWheel" from wrapped API, args: `,
      x,
      y,
      deltaX,
      deltaY,
      duration,
    );
    (await this.getCurrentPage()).mouse.move(x, y);

    (await this.getCurrentPage()).mouse.wheel(deltaX, deltaY);
  }

  async keyboardPressEsc() {
    await (await this.getCurrentPage()).keyboard.down('Escape');
    await (await this.getCurrentPage()).keyboard.up('Escape');
  }

  async keyboardPressEnter() {
    await (await this.getCurrentPage()).keyboard.down('Enter');
    await (await this.getCurrentPage()).keyboard.up('Enter');
  }
}

const browser = Browser.getBrowser();

export { browser, Browser };
