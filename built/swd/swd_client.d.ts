import { waitForCondition } from 'sat-utils';
import { WebDriver } from 'selenium-webdriver';
import type { ExecuteScriptFn } from '../interface';
interface IBrowserTab {
    index?: number;
    tabId?: string;
    expectedQuantity?: number;
    title?: string;
    timeout?: number;
}
declare class Browser {
    wait: typeof waitForCondition;
    seleniumDriver: WebDriver;
    private appBaseUrl;
    private initialTab;
    private drivers;
    private _createNewDriver;
    constructor();
    currentClient(): WebDriver;
    runNewBrowser(): Promise<void>;
    switchToBrowser({ index, tabTitle }?: {
        index?: number;
        tabTitle?: string;
    }): Promise<void>;
    set setCreateNewDriver(driverCreator: any);
    setClient(client: any): void;
    get Key(): import("selenium-webdriver/lib/input").IKey;
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
    getTitle(): Promise<string>;
    getCurrentUrl(): Promise<string>;
    takeScreenshot(): Promise<string>;
    tabTitle(): Promise<string>;
    getTabs(): Promise<string[]>;
    getCurrentTab(): Promise<string>;
    get(url: string): Promise<void>;
    setWindowSize(width: number, height: number): Promise<import("selenium-webdriver").IRectangle>;
    sleep(time: number): Promise<void>;
    manage(): import("selenium-webdriver").Options;
    executeScript(script: ExecuteScriptFn, args: any[]): Promise<any>;
    executeAsyncScript(script: ExecuteScriptFn | string, args: any[]): Promise<any>;
    back(): Promise<void>;
    forward(): Promise<void>;
    refresh(): Promise<void>;
    switchTo(): import("selenium-webdriver").TargetLocator;
    quit(): Promise<void>;
    quitAll(): Promise<void>;
    close(): Promise<void>;
    actions(): import("selenium-webdriver").Actions;
    private toSeleniumArgs;
    private getSeleniumProtocolElement;
    private resolveUrl;
}
declare const browser: Browser;
export { browser, Browser };
