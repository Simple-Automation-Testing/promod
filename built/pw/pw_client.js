"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Browser = exports.browser = void 0;
const sat_utils_1 = require("sat-utils");
const selenium_webdriver_1 = require("selenium-webdriver");
/*
  const a = await page.$('button');
  const b = await page.evaluateHandle(a => a.parentElement, a);

  await b.asElement()?.click();
*/
function validateBrowserCallMethod(browserClass) {
    const protKeys = Object.getOwnPropertyNames(browserClass.prototype).filter((item) => item !== 'constructor');
    for (const key of protKeys) {
        const descriptor = Object.getOwnPropertyDescriptor(browserClass.prototype, key);
        if ((0, sat_utils_1.isAsyncFunction)(descriptor.value)) {
            const originalMethod = descriptor.value;
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
    constructor(context) {
        this.context = context;
    }
    async updateContext(context) {
        this.context = context;
        const contextPages = await context.pages();
        if (contextPages.length) {
            this.currentPage = contextPages[0];
        }
        else {
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
    // TODO
    async switchToNextPage() {
        const pages = await this.context.pages();
        // only one page is available for this context
        if (pages.length === 1) {
            return this.currentPage;
        }
        else {
            for (const availablePage of pages) {
                if (availablePage !== this.currentPage) {
                    this.currentPage = availablePage;
                    return this.currentPage;
                }
            }
        }
    }
}
class ContextWrapper {
    constructor(serverBrowser) {
        this.server = serverBrowser;
    }
    async runNewContext() {
        this.currentContext = await this.server.newContext();
        if (!this.currentPage) {
            this.currentPage = new PageWrapper(this.currentContext);
        }
        else {
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
        if ((0, sat_utils_1.isNumber)(index)) {
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
    constructor() {
        this.wait = sat_utils_1.waitForCondition;
        this.wait = sat_utils_1.waitForCondition;
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
    async switchToBrowser({ index, tabTitle } = {}) {
        await this._contextWrapper.changeContext({ index, tabTitle });
        // if (isNumber(index) && isArray(this._engineDrivers) && this._engineDrivers.length > index) {
        //   this._contextWrapper = this._engineDrivers[index];
        //   return;
        // }
        // if (isString(tabTitle)) {
        //   for (const driver of this._engineDrivers) {
        //     const result = await this.switchToBrowserTab({ title: tabTitle })
        //       .then(
        //         () => true,
        //         () => false,
        //       )
        //       .catch(() => false);
        //     if (result) {
        //       this._engineDriver = driver;
        //       return;
        //     }
        //   }
        // }
        // throw new Error(`switchToBrowser(): required browser was not found`);
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
        return selenium_webdriver_1.Key;
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
        // set initialTab to null for further "it" to use
        this.initialTab = null;
    }
    async switchToTab(tabObject) {
        if (!this.initialTab) {
            this.initialTab = await this.getCurrentTab();
        }
        await this.switchToBrowserTab(tabObject);
    }
    async closeAllTabsExceptInitial() { }
    async makeActionAtEveryTab(action, handles) { }
    /**
     * switchToBrowserTab
     * @private
     */
    async switchToBrowserTab(tabObject) {
        // const { index, expectedQuantity, title, timeout = 5000, tabId } = tabObject;
        // if (tabId) {
        //   return await this.switchTo().window(tabId);
        // }
        // let tabs = await this.getTabs();
        // if (isNumber(expectedQuantity)) {
        //   await waitForCondition(
        //     async () => {
        //       tabs = await this.getTabs();
        //       return tabs.length === expectedQuantity;
        //     },
        //     {
        //       message: `Couldn't wait for ${expectedQuantity} tab(s) to appear. Probably you should pass expectedQuantity`,
        //       timeout,
        //     },
        //   );
        // }
        // if (tabs.length > 1) {
        //   if (title) {
        //     await waitForCondition(
        //       async () => {
        //         tabs = await this.getTabs();
        //         for (const tab of tabs) {
        //           await this.switchTo().window(tab);
        //           if ((await this.getTitle()) === title) {
        //             return true;
        //           }
        //         }
        //       },
        //       { message: `Window with ${title} title was not found during ${timeout}.`, timeout },
        //     );
        //   } else {
        //     await this.switchTo().window(tabs[index]);
        //   }
        // } else {
        //   await this.switchTo().window(tabs[0]);
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
    async getTabs() {
        return await this._contextWrapper.getCurrentPage();
    }
    async getCurrentTab() {
        return await this._contextWrapper.getCurrentPage();
    }
    async get(url) {
        const getUrl = this.resolveUrl(url);
        return (await this._contextWrapper.getCurrentPage()).goto(getUrl);
    }
    async setWindowSize(width, height) {
        return (await this._contextWrapper.getCurrentPage()).setViewportSize({ width, height });
    }
    async sleep(time) {
        await (() => new Promise((resolve) => setTimeout(resolve, time)))();
    }
    async executeScript(script, args) {
        const recomposedArgs = await this.toPlaywirghtArgs(args);
        const res = (await this._contextWrapper.getCurrentPage()).evaluate(script, recomposedArgs);
        return res;
    }
    async executeAsyncScript(script, ...args) {
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
            if (index !== -1)
                this._engineDrivers.splice(index, 1);
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
    async toPlaywirghtArgs(args) {
        const executeScriptArgs = [];
        args = (0, sat_utils_1.toArray)(args);
        for (const item of args) {
            const resolvedItem = (0, sat_utils_1.isPromise)(item) ? await item : item;
            if (Array.isArray(resolvedItem)) {
                const arrayItems = [];
                for (const itemArr of resolvedItem) {
                    arrayItems.push(itemArr);
                }
                executeScriptArgs.push(arrayItems);
            }
            else if (resolvedItem && resolvedItem.getEngineElement) {
                executeScriptArgs.push(await resolvedItem.getEngineElement());
            }
            else if (resolvedItem && resolvedItem.getEngineElements) {
                executeScriptArgs.push(...(await resolvedItem.getEngineElements()));
            }
            else {
                executeScriptArgs.push(item);
            }
        }
        return executeScriptArgs.length ? executeScriptArgs : undefined;
    }
    resolveUrl(urlOrPath) {
        let resolved;
        if (!urlOrPath.includes('http') && this.appBaseUrl) {
            const url = this.appBaseUrl;
            const path = urlOrPath;
            if (url.endsWith('/') && path.startsWith('/')) {
                resolved = `${url.replace(/.$/u, '')}${path}`;
            }
            else if (url.endsWith('/') && !path.startsWith('/')) {
                resolved = `${url}${path}`;
            }
            else if (!url.endsWith('/') && path.startsWith('/')) {
                resolved = `${url}${path}`;
            }
            else {
                resolved = `${url}/${path}`;
            }
        }
        else if (urlOrPath === '' || urlOrPath === '/') {
            return this.baseUrl;
        }
        else {
            resolved = urlOrPath;
        }
        return resolved;
    }
}
exports.Browser = Browser;
const browser = validateBrowserCallMethod(Browser);
exports.browser = browser;
//# sourceMappingURL=pw_client.js.map