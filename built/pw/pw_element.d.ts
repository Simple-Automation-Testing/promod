import type { PromodElementType, PromodElementsType } from '../interface';
import type { ElementHandle, Page } from 'playwright-core';
declare class PromodElements {
    private _driver;
    private _driverElements;
    private getParent;
    private getExecuteScriptArgs;
    private selector;
    parentSelector: string;
    constructor(selector: any, client: any, getParent?: any, getExecuteScriptArgs?: any);
    set_driver(client: Page): void;
    get(index: any): PromodElementType;
    last(): PromodElementType;
    first(): PromodElementType;
    private getElement;
    getEngineElements(): Promise<ElementHandle<Node>[]>;
    getIds(): Promise<any[]>;
    each(cb: (item: PromodElementType, index?: number) => Promise<void>): Promise<any>;
    count(): Promise<number>;
}
declare class PromodElement {
    private _driver;
    private selector;
    private _driverElement;
    private getParent;
    private getExecuteScriptArgs;
    private useParent;
    parentSelector: string;
    constructor(selector: any, client: any, getParent?: any, getExecuteScriptArgs?: any, useParent?: any);
    set_driver(client: Page): void;
    $(selector: any): PromodElementType;
    $$(selector: any): PromodElementsType;
    /**
     * @param {boolean} [withScroll] try to prevent intercept error by scoll to bottom/to
     * @returns {Promise<void>}
     */
    click(withScroll?: boolean): Promise<void>;
    getTagName(): Promise<void>;
    getCssValue(): Promise<void>;
    getAttribute(attribute: string): Promise<void>;
    getRect(): Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    isEnabled(): Promise<void>;
    isSelected(): Promise<void>;
    /**
     * @deprecated
     */
    getLocation(): Promise<void>;
    sendKeys(value: string | number): Promise<void>;
    hover(): Promise<void>;
    focus(): Promise<void>;
    clear(): Promise<void>;
    submit(): Promise<void>;
    getText(): Promise<void>;
    takeScreenshot(): Promise<void>;
    scrollIntoView(position?: 'end' | 'start' | 'center'): Promise<void>;
    private getEngineElement;
    getElement(): Promise<ElementHandle<Node>>;
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
    locator(): {
        value: string;
    };
    private isInteractionIntercepted;
}
declare const $: (selector: string | Promise<any> | ((...args: any[]) => any), root?: PromodElementType | any, ...rest: any[]) => PromodElementType;
declare const $$: (selector: string | Promise<any> | ((...args: any[]) => any), root?: PromodElementType | any, ...rest: any[]) => PromodElementsType;
export { $, $$, PromodElement, PromodElements };
