import { toArray, isNotEmptyObject, waitForCondition, isNumber, isAsyncFunction, safeHasOwnPropery } from 'sat-utils';
import { Key } from 'selenium-webdriver';
import { ExecuteScriptFn } from '../interface';
import { toNativeEngineExecuteScriptArgs } from '../helpers/execute.script';
import { Locator } from 'playwright-core';
// import {devices} from 'playwright-core';
import { KeysPW } from '../mappers';

import type { BrowserServer, Browser as PWBrowser, BrowserContext, Page } from 'playwright-core';

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

  public _logs: any[];

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
          this._logs.push(await arg.jsonValue());
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
  public server: PWBrowser;

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

type TCookie = {
  name: string;
  value: string;
  url?: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
};

class Browser {
  public wait = waitForCondition;
  public _engineDriver: PWBrowser;
  public _contextWrapper: ContextWrapper;
  public _contextFrame: Page;
  public _contextFrameHolder: Locator;

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

  set setCreateNewDriver(driverCreator) {
    this._createNewDriver = driverCreator;
  }

  setClient({ driver, server, config }) {
    this._engineDriver = driver;
    this._contextWrapper = new ContextWrapper(driver, config);
    this._server = server;
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

  /** @private */
  public async returnToInitialTab() {
    // there was no switching in test
    if (!this.initialTab) {
      return;
    }
    await this.closeAllpagesExceptInitial();
    // set initialTab to null for further "it" to use
    this.initialTab = null;
  }

  async openNewTab(url = 'data:,') {
    return (await this._contextWrapper.getCurrentPage()).evaluate((openUrl) => window.open(openUrl, '_blank'), url);
  }

  public async switchToTab(tabObject: IBrowserTab) {
    if (!this.initialTab) {
      this.initialTab = await this.getCurrentTab();
    }
    await this.switchToBrowserTab(tabObject);
  }

  private async closeAllpagesExceptInitial() {}

  public async makeActionAtEveryTab(action: (...args: any) => Promise<any>, handles?: string[]) {}

  public async setCookies(cookies: TCookie | TCookie[]) {
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

  public async getCookies() {
    return await (await this._contextWrapper.getCurrentContext()).cookies();
  }

  /**
   * @info https://github.com/microsoft/playwright/issues/10143
   * @param {string} name cookie name
   * @returns {Promise<void>}
   */
  public async deleteCookie(name: string) {
    const ctx = await this._contextWrapper.getCurrentContext();
    const filteredCookies = (await ctx.cookies()).filter((cookie) => cookie.name !== name);

    await ctx.clearCookies();
    await ctx.addCookies(filteredCookies);
  }

  public async getCookieByName(name: string) {
    const ctx = await this._contextWrapper.getCurrentContext();
    const requiredCookie = (await ctx.cookies()).find((cookie) => cookie.name !== name);

    return requiredCookie;
  }

  public async deleteAllCookies() {
    await (await this._contextWrapper.getCurrentContext()).clearCookies();
  }

  /**
   * switchToBrowserTab
   * @private
   */
  private async switchToBrowserTab(tabObject: IBrowserTab) {
    await this._contextWrapper.switchPage(tabObject);
  }

  async getTitle() {
    return (await this._contextWrapper.getCurrentPage()).title();
  }

  async getTabsCount() {
    return (await this._contextWrapper.getCurrentContext()).pages().length;
  }

  async getCurrentUrl() {
    return (await this._contextWrapper.getCurrentPage()).url();
  }

  /**
   * @returns {Promise<Buffer>}
   */
  async takeScreenshot() {
    return (await this._contextWrapper.getCurrentPage()).screenshot();
  }

  async maximize() {
    /**
     * @info it is workaround implementation for maximization of the browser page
     */
    const { width, height } = await (
      await this._contextWrapper.getCurrentPage()
    ).evaluate(() => {
      const { width, height } = window.screen;
      return { width: width + 500, height: height + 500 };
    });

    return (await this._contextWrapper.getCurrentPage()).setViewportSize({ width, height });
  }

  async getBrowserLogs() {
    try {
      return this._contextWrapper.getPageLogs();
      // @ts-ignore
    } catch (e) {
      return 'Comman was failed ' + e.toString();
    }
  }

  get keyboard() {
    return KeysPW;
  }

  async keyDownAndHold(key: string) {
    await (await this.getCurrentPage()).keyboard.down(key);
  }

  async keyUp(key: string) {
    await (await this.getCurrentPage()).keyboard.up(key);
  }

  async getWindomSize(): Promise<{ height: number; width: number }> {
    return await (
      await this._contextWrapper.getCurrentPage()
    ).evaluate(() => ({ height: window.outerHeight, width: window.outerWidth }));
  }

  async tabTitle() {
    return (await this._contextWrapper.getCurrentPage()).title();
  }

  async getpages() {
    return await this._contextWrapper.getCurrentPage();
  }

  async getCurrentTab() {
    return await this._contextWrapper.getCurrentPage();
  }

  async get(url: string) {
    const getUrl = this.resolveUrl(url);

    return (await this._contextWrapper.getCurrentPage()).goto(getUrl);
  }

  async switchToIframe(selector: string, jumpToDefaultFirst = false) {
    if (jumpToDefaultFirst) {
      await this.switchToDefauldIframe();
    }

    const currentWorkingContext = this._contextFrameHolder ? this._contextFrameHolder : await this.getWorkingContext();

    const requiredFrame = await currentWorkingContext.frameLocator(selector).locator('*').first();
    this._contextFrameHolder = requiredFrame;

    this._contextFrame = (await requiredFrame.elementHandle()) as any as Page;
  }

  async switchToDefauldIframe() {
    this._contextFrame = null;
    this._contextFrameHolder = null;
  }

  async setWindowSize(width: number, height: number) {
    return (await this._contextWrapper.getCurrentPage()).setViewportSize({ width, height });
  }

  async sleep(time: number) {
    await (() => new Promise((resolve) => setTimeout(resolve, time)))();
  }

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

  async back() {
    return (await this._contextWrapper.getCurrentPage()).goBack();
  }

  async forward() {
    return (await this._contextWrapper.getCurrentPage()).goForward();
  }

  async refresh() {
    return (await this._contextWrapper.getCurrentPage()).reload();
  }

  /** @deprecated */
  switchTo() {}

  async quit() {
    if (this._engineDrivers && this._engineDrivers.length) {
      const index = this._engineDrivers.findIndex((driver) => driver === this._engineDriver);
      if (index !== -1) this._engineDrivers.splice(index, 1);
    }

    await (await this._contextWrapper.getCurrentContext()).close();
    this._engineDriver = null;
  }

  async quitAll() {
    await this._contextWrapper.closeAllContexts();
    await this._engineDriver.close();
    if (this._server) {
      await this._server.close();
    }
  }

  async close() {
    await this._engineDriver.close();
  }

  private resolveUrl(urlOrPath: string) {
    let resolved;

    if (!urlOrPath.includes('http') && this.appBaseUrl) {
      const url = this.appBaseUrl;
      const path = urlOrPath;

      if (url.endsWith('/') && path.startsWith('/')) {
        resolved = `${url.replace(/.$/u, '')}${path}`;
      } else if (url.endsWith('/') && !path.startsWith('/')) {
        resolved = `${url}${path}`;
      } else if (!url.endsWith('/') && path.startsWith('/')) {
        resolved = `${url}${path}`;
      } else {
        resolved = `${url}/${path}`;
      }
    } else if (urlOrPath === '' || urlOrPath === '/') {
      return this.baseUrl;
    } else {
      resolved = urlOrPath;
    }

    return resolved;
  }
}

const browser = validateBrowserCallMethod(Browser);

export { browser, Browser };
