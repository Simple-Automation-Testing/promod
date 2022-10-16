import {
  isEmptyObject,
  isNotEmptyObject,
  toArray,
  isPromise,
  waitForCondition,
  isNumber,
  isAsyncFunction,
} from 'sat-utils';
import { Key } from 'selenium-webdriver';
import type { BrowserServer, Browser as PWBrowser, BrowserContext, Page } from 'playwright-core';
import { ExecuteScriptFn } from '../interface';

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
  private context: BrowserContext;
  private currentPage: Page;
  private initialPage: Page;

  constructor(context: BrowserContext) {
    this.context = context;
  }

  async updateContext(context: BrowserContext) {
    this.context = context;
    const contextPages = await context.pages();

    if (contextPages.length) {
      this.currentPage = contextPages[0];
    } else {
      this.currentPage = await this.context.newPage();
    }
  }

  async getCurrentPage() {
    if (!this.currentPage) {
      const page = await this.context.newPage();
      this.currentPage = page;
      this.initialPage = page;
    }

    return this.currentPage;
  }

  async switchToNextPage(data: IBrowserTab = {}) {
    if (isNotEmptyObject(data)) {
      const { index, expectedQuantity, title, timeout } = data;

      let pages;
      if (isNumber(expectedQuantity)) {
        await waitForCondition(
          async () => {
            pages = await this.context.pages();
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
              pages = await this.context.pages();
              for (const tab of pages) {
                if ((await tab.title()) === title) {
                  this.currentPage = tab;
                  return true;
                }
              }
            },
            { message: `Window with ${title} title was not found during ${timeout}.`, timeout },
          );
        } else {
          this.currentPage = pages[index];
        }
      } else {
        this.currentPage = pages[0];
      }
    } else {
      const pages = await this.context.pages();
      if (pages.length === 1) {
        return this.currentPage;
      } else {
        for (const availablePage of pages) {
          if (availablePage !== this.currentPage) {
            this.currentPage = availablePage;

            return this.currentPage;
          }
        }
      }
    }
  }
}

class ContextWrapper {
  public server: PWBrowser;
  private currentContext: BrowserContext;
  private currentPage: PageWrapper;

  constructor(serverBrowser: PWBrowser) {
    this.server = serverBrowser;
  }

  async switchPage(data: IBrowserTab) {
    await this.currentPage.switchToNextPage(data);
  }

  async runNewContext() {
    this.currentContext = await this.server.newContext();

    if (!this.currentPage) {
      this.currentPage = new PageWrapper(this.currentContext);
    } else {
      await this.currentPage.updateContext(this.currentContext);
    }
  }

  async getCurrentContext() {
    if (!this.currentContext) {
      await this.runNewContext();
    }
    return this.currentContext;
  }

  // TODO implement with tab - page title
  async changeContext({ index, tabTitle }) {
    if (isNumber(index)) {
      const contexts = await this.server.contexts();
      this.currentContext = contexts[index];
      await this.currentPage.updateContext(this.currentContext);
    }
  }

  async getCurrentPage() {
    await this.getCurrentContext();

    if (!this.currentPage) {
      this.currentPage = new PageWrapper(this.currentContext);
    }

    return this.currentPage.getCurrentPage();
  }

  async closeAllContexts() {
    await this.currentContext.close();
    const contexts = await this.server.contexts();
    for (const context of contexts) {
      await context.close();
    }
  }
}

class Browser {
  public wait = waitForCondition;
  public _engineDriver: PWBrowser;
  public _contextWrapper: ContextWrapper;
  private _pageWrapper: PageWrapper;
  private _server: BrowserServer;

  private appBaseUrl: string;
  private initialTab: any;
  private _engineDrivers: PWBrowser[];
  private _createNewDriver: () => Promise<PWBrowser>;

  constructor() {
    this.wait = waitForCondition;
  }

  currentClient() {
    return this._engineDriver;
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

  setClient({ driver, server }) {
    this._engineDriver = driver;
    this._contextWrapper = new ContextWrapper(driver);
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

  public async returnToInitialTab() {
    // there was no switching in test
    if (!this.initialTab) {
      return;
    }
    await this.closeAllpagesExceptInitial();
    // set initialTab to null for further "it" to use
    this.initialTab = null;
  }

  public async switchToTab(tabObject: IBrowserTab) {
    if (!this.initialTab) {
      this.initialTab = await this.getCurrentTab();
    }
    await this.switchToBrowserTab(tabObject);
  }

  private async closeAllpagesExceptInitial() {}

  public async makeActionAtEveryTab(action: (...args: any) => Promise<any>, handles?: string[]) {}

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

  async setWindowSize(width: number, height: number) {
    return (await this._contextWrapper.getCurrentPage()).setViewportSize({ width, height });
  }

  async sleep(time: number) {
    await (() => new Promise((resolve) => setTimeout(resolve, time)))();
  }

  async executeScript(script: ExecuteScriptFn, args?: any[]): Promise<any> {
    const recomposedArgs = await this.toPlaywirghtArgs(args);

    const res = (await this._contextWrapper.getCurrentPage()).evaluate(script, recomposedArgs);
    return res;
  }

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

  private async toPlaywirghtArgs(args) {
    const executeScriptArgs = [];
    args = toArray(args);

    for (const item of args) {
      const resolvedItem = isPromise(item) ? await item : item;

      if (Array.isArray(resolvedItem)) {
        const arrayItems = [];

        for (const itemArr of resolvedItem) {
          arrayItems.push(itemArr);
        }
        executeScriptArgs.push(arrayItems);
      } else if (resolvedItem && resolvedItem.getEngineElement) {
        executeScriptArgs.push(await resolvedItem.getEngineElement());
      } else if (resolvedItem && resolvedItem.getEngineElements) {
        executeScriptArgs.push(...(await resolvedItem.getEngineElements()));
      } else {
        executeScriptArgs.push(item);
      }
    }

    return executeScriptArgs.length ? executeScriptArgs : undefined;
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
