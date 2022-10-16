import { By, WebElement, WebDriver } from 'selenium-webdriver';
import type { PromodElementType, PromodElementsType } from '../interface';
declare class PromodSeleniumElements {
    private seleniumDriver;
    private selector;
    private wdElements;
    private getParent;
    private getExecuteScriptArgs;
    parentSelector: string;
    constructor(selector: any, client: any, getParent?: any, getExecuteScriptArgs?: any);
    setseleniumDriver(client: WebDriver): void;
    get(index: any): PromodElementType;
    last(): PromodElementType;
    first(): PromodElementType;
    private getElement;
    getIds(): Promise<any[]>;
    getSeleniumProtocolElementObj(): Promise<{
        'element-6066-11e4-a52e-4f735466cecf': any;
        ELEMENT: any;
    }[]>;
    each(cb: (item: PromodElementType, index?: number) => Promise<void>): Promise<any>;
    count(): Promise<number>;
}
declare class PromodSeleniumElement {
    private seleniumDriver;
    private selector;
    private wdElement;
    private getParent;
    private getExecuteScriptArgs;
    private useParent;
    parentSelector: string;
    constructor(selector: any, client: any, getParent?: any, getExecuteScriptArgs?: any, useParent?: any);
    setseleniumDriver(client: WebDriver): void;
    $(selector: any): PromodElementType;
    $$(selector: any): PromodElementsType;
    getSeleniumProtocolElementObj(): Promise<{
        'element-6066-11e4-a52e-4f735466cecf': any;
        ELEMENT: any;
    }>;
    /**
     * @param {boolean} [withScroll] try to prevent intercept error by scoll to bottom/to
     * @returns {Promise<void>}
     */
    click(withScroll?: boolean): Promise<void>;
    hover(): Promise<void>;
    focus(): Promise<void>;
    scrollIntoView(position?: 'end' | 'start' | 'center'): Promise<void>;
    getElement(): Promise<WebElement>;
    /**
     * @returns {Promise<boolean>} button is present
     * @example
     * const button = $('button')
     * const buttonIsDisplayed = await button.isDisplayed();
     */
    isDisplayed(): Promise<boolean>;
    /**
     * @returns {Promise<boolean>} button is present
     * @example
     * const button = $('button')
     * const buttonIsPresent = await button.isPresent();
     */
    isPresent(): Promise<boolean>;
    private callElementAction;
    getId(): Promise<any>;
    getEngineElement(): Promise<WebElement>;
    locator(): {
        value: string;
    };
    private isInteractionIntercepted;
}
declare const $: (selector: string | Promise<any> | By | ((...args: any[]) => any), root?: PromodElementType | any, ...rest: any[]) => PromodElementType;
declare const $$: (selector: string | Promise<any> | By | ((...args: any[]) => any), root?: PromodElementType | any, ...rest: any[]) => PromodElementsType;
export { $, $$, PromodSeleniumElement, PromodSeleniumElements, By };
