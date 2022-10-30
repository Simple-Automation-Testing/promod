import { toArray, isNotEmptyObject, waitForCondition, isNumber, isAsyncFunction, safeHasOwnPropery } from 'sat-utils';
import { Key } from 'selenium-webdriver';
import { ExecuteScriptFn } from '../interface';
import { toNativeEngineExecuteScriptArgs } from '../helpers/execute.script';

// import {devices} from 'playwright-core';

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

  constructor(context: BrowserContext) {
    this._context = context;
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
    await (await this._contextWrapper.getCurrentContext()).addCookies(toArray(cookies) as TCookie[]);
  }

  /**
   * switchToBrowserTab
   * @private
   */
  private async switchToBrowserTab(tabObject: IBrowserTab) {
    await this._contextWrapper.switchPage(tabObject);

    // let pages = await this.getpages();
    // if (isNumber(expectedQuantity)) {
    //   await waitForCondition(
    //     async () => {
    //       pages = await this.getpages();
    //       return pages.length === expectedQuantity;
    //     },
    //     {
    //       message: `Couldn't wait for ${expectedQuantity} tab(s) to appear. Probably you should pass expectedQuantity`,
    //       timeout,
    //     },
    //   );
    // }
    // if (pages.length > 1) {
    //   if (title) {
    //     await waitForCondition(
    //       async () => {
    //         pages = await this.getpages();
    //         for (const tab of pages) {
    //           await this.switchTo().window(tab);
    //           if ((await this.getTitle()) === title) {
    //             return true;
    //           }
    //         }
    //       },
    //       { message: `Window with ${title} title was not found during ${timeout}.`, timeout },
    //     );
    //   } else {
    //     await this.switchTo().window(pages[index]);
    //   }
    // } else {
    //   await this.switchTo().window(pages[0]);
    // }
  }

  async getTitle() {
    return (await this._contextWrapper.getCurrentPage()).title();
  }

  async getCurrentUrl() {
    return (await this._contextWrapper.getCurrentPage()).url();
  }

  async takeScreenshot() {
    return (await this._contextWrapper.getCurrentPage()).screenshot();
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

  async switchToIframe(selector: string | { name?: string; url?: string | RegExp }, jumpToDefaultFirst = false) {
    if (jumpToDefaultFirst) {
      await this.switchToDefauldIframe();
    }

    if (safeHasOwnPropery(selector, 'name') || safeHasOwnPropery(selector, 'url')) {
      this._contextFrame = (await (await this.getWorkingContext()).frame(selector)) as any as Page;
    } else {
      const currentWorkingContext = await this.getWorkingContext();
      /**
       * @info - switch to iframe context, get first top dom element and get handler of that element
       */
      this._contextFrame = (await currentWorkingContext
        .frameLocator(selector as string)
        .locator('*')
        .first()
        .elementHandle()) as any as Page;
    }
  }

  async switchToDefauldIframe() {
    this._contextFrame = null;
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

  switchTo() {
    // return this._engineDriver.switchTo();
  }

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
