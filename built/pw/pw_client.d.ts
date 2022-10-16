import { waitForCondition } from 'sat-utils';
import type { Browser as PWBrowser } from 'playwright';
interface IBrowserTab {
    index?: number;
    tabId?: string;
    expectedQuantity?: number;
    title?: string;
    timeout?: number;
}
declare class ContextWrapper {
    server: PWBrowser;
    private currentContext;
    private currentPage;
    constructor(serverBrowser: PWBrowser);
    runNewContext(): Promise<void>;
    getCurrentContext(): Promise<BrowserContext>;
    changeContext({ index, tabTitle }: {
        index: any;
        tabTitle: any;
    }): Promise<void>;
    getCurrentPage(): Promise<Page>;
    closeAllContexts(): Promise<void>;
}
declare class Browser {
    wait: typeof waitForCondition;
    _engineDriver: PWBrowser;
    _contextWrapper: ContextWrapper;
    private _pageWrapper;
    private _server;
    private appBaseUrl;
    private initialTab;
    private _engineDrivers;
    private _createNewDriver;
    constructor();
    currentClient(): PWBrowser;
    getCurrentPage(): Promise<Page>;
    runNewBrowser(): Promise<void>;
    switchToBrowser({ index, tabTitle }?: {
        index?: number;
        tabTitle?: string;
    }): Promise<void>;
    set setCreateNewDriver(driverCreator: any);
    setClient({ driver, server }: {
        driver: any;
        server: any;
    }): void;
    get Key(): any;
    get baseUrl(): string;
    set baseUrl(url: string);
    returnToInitialTab(): Promise<void>;
    switchToTab(tabObject: IBrowserTab): Promise<void>;
    private closeAllTabsExceptInitial;
    makeActionAtEveryTab(action: (...args: any) => Promise<any>, handles?: string[]): Promise<void>;
    /**
     * switchToBrowserTab
     * @private
     */
    private switchToBrowserTab;
    getTitle(): Promise<any>;
    getCurrentUrl(): Promise<any>;
    takeScreenshot(): Promise<any>;
    refresh(): Promise<any>;
    tabTitle(): Promise<any>;
    getTabs(): Promise<Page>;
    getCurrentTab(): Promise<Page>;
    get(url: string): Promise<any>;
    setWindowSize(width: number, height: number): Promise<any>;
    sleep(time: number): Promise<void>;
    executeScript(script: any, ...args: any[]): Promise<any>;
    executeAsyncScript(script: any, ...args: any[]): Promise<any>;
    navigate(): void;
    switchTo(): void;
    quit(): Promise<void>;
    quitAll(): Promise<void>;
    close(): Promise<void>;
    private toPlaywirghtArgs;
    private resolveUrl;
}
declare const browser: Browser;
export { browser, Browser };
