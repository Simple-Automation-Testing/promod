import { waitForCondition } from 'sat-utils';
import { WebDriver } from 'selenium-webdriver';
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
    getTabs(): Promise<any>;
    getCurrentTab(): Promise<any>;
    get(url: string): Promise<any>;
    setWindowSize(width: number, height: number): Promise<any>;
    sleep(time: number): Promise<void>;
    manage(): any;
    executeScript(script: any, ...args: any[]): Promise<any>;
    executeAsyncScript(script: any, ...args: any[]): Promise<any>;
    navigate(): any;
    switchTo(): any;
    quit(): Promise<void>;
    quitAll(): Promise<void>;
    close(): Promise<void>;
    actions(): any;
    private toSeleniumArgs;
    private getSeleniumProtocolElement;
    private resolveUrl;
}
declare const browser: Browser;
export { browser, Browser };
