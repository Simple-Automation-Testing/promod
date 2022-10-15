/* eslint-disable max-len */
import { isString, isFunction, isAsyncFunction, isPromise } from 'sat-utils';
import { ElementHandle, Page } from 'playwright';
import { browser } from './pw_client';

const buildBy = (selector: any, getExecuteScriptArgs?: () => any[]): any => {
  getExecuteScriptArgs = isFunction(getExecuteScriptArgs) ? getExecuteScriptArgs : () => [];

  if (isString(selector) && (selector as string).includes('xpath=')) {
    return (selector as string).replace('xpath=', '');
  } else if (isString(selector) && (selector as string).includes('js=')) {
    return [(selector as string).replace('js=', ''), ...getExecuteScriptArgs()];
  } else if (isPromise(selector)) {
    return selector;
  } else if (isFunction(selector)) {
    return [selector, getExecuteScriptArgs()];
  }

  return selector;
};

class PromodElements {
  private _driver: Page;
  private _driverElements: ElementHandle[];
  private getParent: () => Promise<PromodElement>;
  private getExecuteScriptArgs: () => any;
  private selector: string;
  public parentSelector: string;

  constructor(selector, client, getParent?, getExecuteScriptArgs?) {
    this._driver = client;
    this.selector = selector;
    this.getParent = getParent;
    this.getExecuteScriptArgs = getExecuteScriptArgs;
  }

  set_driver(client: Page) {
    this._driver = client;
  }

  get(index): PromodElementType {
    const childElement = new PromodElement(this.selector, this._driver, this.getElement.bind(this, index), null, true);
    if (this.parentSelector) {
      childElement.parentSelector = this.parentSelector || this.selector;
    }
    return childElement as any;
  }

  last(): PromodElementType {
    return this.get(-1) as any;
  }

  first(): PromodElementType {
    return this.get(0) as any;
  }

  private async getElement(index?) {
    this._driver = await browser.getCurrentPage();

    if (this.getParent) {
      let parent = await this.getParent();

      if (parent.getWrappedElement) {
        // @ts-ignore
        parent = await parent.getWrappedElement();
      }

      // TODO improve this solution
      this._driverElements = (await parent.$$(
        buildBy(this.selector, this.getExecuteScriptArgs),
      )) as any as ElementHandle[];
    } else {
      this._driverElements = await this._driver.$$(buildBy(this.selector, this.getExecuteScriptArgs));
    }

    if (index === -1) {
      return this._driverElements[this._driverElements.length - 1];
    }

    return this._driverElements[index];
  }

  async getEngineElements() {
    await this.getElement();
    return this._driverElements;
  }

  async getIds() {
    await this.getElement();
    // @ts-ignore
    return this._driverElements.map((item) => item.id_);
  }

  async each(cb: (item: PromodElementType, index?: number) => Promise<void>): Promise<any> {
    await this.getElement(0);

    for (let i = 0; i < this._driverElements.length; i++) {
      await cb(this.get(i), i);
    }
  }

  async count(): Promise<number> {
    return this.getElement()
      .then(() => this._driverElements.length)
      .catch(() => 0);
  }
}

class PromodElement {
  private _driver: Page;
  private selector: string;
  private _driverElement: ElementHandle;
  private getParent: () => Promise<PromodElementType>;
  private getExecuteScriptArgs: () => any;
  private useParent: boolean;
  public parentSelector: string;

  constructor(selector, client, getParent?, getExecuteScriptArgs?, useParent?) {
    this._driver = client;
    this.selector = selector;
    this.getParent = getParent;
    this.getExecuteScriptArgs = getExecuteScriptArgs;
    this.useParent = useParent;
  }

  set_driver(client: Page) {
    this._driver = client;
  }

  $(selector): PromodElementType {
    const childElement = new PromodElement(selector, this._driver, this.getElement.bind(this));
    childElement.parentSelector = this.selector;
    return childElement as any;
  }

  $$(selector): PromodElementsType {
    const childElements = new PromodElements(selector, this._driver, this.getElement.bind(this));
    childElements.parentSelector = this.selector;
    return childElements as any;
  }

  /**
   * @param {boolean} [withScroll] try to prevent intercept error by scoll to bottom/to
   * @returns {Promise<void>}
   */
  async click(withScroll?: boolean) {
    await this.getElement();
    if (withScroll) {
      const scrollableClickResult = await this._driverElement
        .click()
        .catch((err) =>
          this.isInteractionIntercepted(err)
            ? this.scrollIntoView('center').then(() => this._driverElement.click())
            : err,
        )
        .catch((err) =>
          this.isInteractionIntercepted(err)
            ? this.scrollIntoView('start').then(() => this._driverElement.click())
            : err,
        )
        .catch((err) =>
          this.isInteractionIntercepted(err) ? this.scrollIntoView('end').then(() => this._driverElement.click()) : err,
        )
        .then((err) => err)
        .catch((err) => err);

      if (scrollableClickResult) {
        throw scrollableClickResult;
      }
    } else {
      return this._driverElement.click();
    }
  }

  // TODO implement
  async getTagName() {}
  async getCssValue() {}
  async getAttribute() {}
  async getRect() {}
  async isEnabled() {}
  async isSelected() {}
  async getLocation() {}

  async sendKeys(value: string | number) {
    await this.getElement();
    await this._driverElement.type(value.toString());
  }

  async hover() {
    await this.getElement();
    await this._driverElement.hover();
  }

  async focus() {
    await this.getElement();
    await this._driverElement.focus();
  }

  async clear() {
    await this.getElement();
    // fill clear input value first and then set new value - empty string
    await this._driverElement.fill('');
  }

  async submit() {
    await this.getElement();
    await this._driverElement.click();
  }

  async getText() {
    await this.getElement();
    await this._driverElement.textContent();
  }

  async takeScreenshot() {
    await this.getElement();
    await this._driverElement.screenshot();
  }

  async scrollIntoView(position?: 'end' | 'start' | 'center') {
    await this.getElement();
    await this._driver.evaluateHandle(
      (arg) => {
        const [elem, scrollPosition] = arg;
        let position = true;

        const scrollBlock = ['end', 'start', 'center', 'nearest'];
        // @ts-ignore
        if (scrollBlock.includes(scrollPosition)) {
          // @ts-ignore
          position = { block: scrollPosition };
        }
        // @ts-ignore
        elem.scrollIntoView(position);
      },
      [await this.getWrappedElement(), position],
    );
  }

  private async getEngineElement() {
    await this.getElement();
    return this._driverElement;
  }

  async getElement() {
    this._driver = await browser.getCurrentPage();
    const getElementArgs = buildBy(this.selector, this.getExecuteScriptArgs);

    if (this.getParent) {
      let parent = (await this.getParent()) as any;
      if (!parent) {
        throw new Error(
          this.useParent
            ? `Any element with selector ${this.selector} was not found`
            : `Parent element with selector ${this.parentSelector} was not found`,
        );
      }
      if (parent.getWrappedElement) {
        parent = await parent.getWrappedElement();
      }

      if (this.useParent) {
        this._driverElement = parent;
      } else {
        this._driverElement = await parent.$(getElementArgs);
      }
    } else if (isFunction(getElementArgs[0]) || isAsyncFunction(getElementArgs[0])) {
      this._driverElement = await this._driver.evaluateHandle(getElementArgs[0], getElementArgs[1]);
    } else {
      this._driverElement = await this._driver.$(getElementArgs);
    }

    return this._driverElement;
  }

  /**
   * @returns {Promise<boolean>} button is present
   * @example
   * const button = $('button')
   * const buttonIsDisplayed = await button.isDisplayed();
   */
  async isDisplayed() {
    return this.getElement()
      .then(() => this._driverElement.isVisible())
      .catch(() => false);
  }

  /**
   * @returns {Promise<boolean>} button is present
   * @example
   * const button = $('button')
   * const buttonIsPresent = await button.isPresent();
   */
  async isPresent() {
    return this.getElement()
      .then(() => this._driverElement.isVisible())
      .catch(() => false);
  }

  async getWrappedElement() {
    await this.getElement();

    return this._driverElement;
  }

  locator() {
    let locatorValue = '';
    if (this.parentSelector) {
      locatorValue += ` Parent: ${this.parentSelector} `;
    }
    return { value: `${locatorValue}${this.selector}` };
  }

  private isInteractionIntercepted(err) {
    return err.toString().includes('element click intercepted');
  }
}

function getInitElementRest(
  selector: string | ((...args: any[]) => any) | Promise<any>,
  root?: PromodElementType,
  ...rest: any[]
) {
  let getParent = null;
  let getExecuteScriptArgs = null;

  /**
   * @info
   * in case if selector is string with "js=" marker or selector is a function
   */

  if (
    (isString(selector) && (selector as string).indexOf('js=') === 0) ||
    isFunction(selector) ||
    isPromise(selector)
  ) {
    getExecuteScriptArgs = function getExecuteScriptArgs() {
      const localRest = rest.map((item) => (item && item.getWrappedElement ? item.getWrappedElement() : item));
      const rootPromiseIfRequired = root && root.getWrappedElement ? root.getWrappedElement() : root;
      return [rootPromiseIfRequired, ...localRest];
    };
  } else if (root && root instanceof PromodElement) {
    getParent = function getParent() {
      return root;
    };
  }

  return [getParent, getExecuteScriptArgs];
}

const $ = (
  selector: string | ((...args: any[]) => any) | Promise<any>,
  root?: PromodElementType | any,
  ...rest: any[]
): PromodElementType => {
  const restArgs = getInitElementRest(selector, root, ...rest);

  return new PromodElement(selector, null, ...restArgs) as any;
};

const $$ = (
  selector: string | ((...args: any[]) => any) | Promise<any>,
  root?: PromodElementType | any,
  ...rest: any[]
): PromodElementsType => {
  const restArgs = getInitElementRest(selector, root, ...rest);

  return new PromodElements(selector, null, ...restArgs) as any;
};

export { $, $$, PromodElement, PromodElements };

export interface PromodElementsType {
  _driverElements: ElementHandle[];

  get(index: number): PromodElementType;

  last(): PromodElementType;

  first(): PromodElementType;

  each(cb: (item: PromodElementType, index?: number) => Promise<void>): Promise<void>;

  count(): Promise<number>;
}

export interface PromodElementType {
  _driverElement: ElementHandle;

  getId(): Promise<string>;

  click(withScroll?: boolean): Promise<void>;

  hover(): Promise<void>;

  focus(): Promise<void>;

  sendKeys(...keys: Array<string | number | Promise<string | number>>): Promise<void>;

  getTagName(): Promise<string>;

  getCssValue(cssStyleProperty: string): Promise<string>;

  getAttribute(attributeName: string): Promise<string>;

  getText(): Promise<string>;

  getSize(): Promise<{
    width: number;
    height: number;
  }>;

  getRect(): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;

  getLocation(): Promise<{
    x: number;
    y: number;
  }>;

  $(selector: string | ((...args: any[]) => any) | Promise<any>): PromodElementType;
  $$(selector: string | ((...args: any[]) => any) | Promise<any>): PromodElementsType;

  isEnabled(): Promise<boolean>;

  isSelected(): Promise<boolean>;

  isPresent(): Promise<boolean>;

  submit(): Promise<void>;

  clear(): Promise<void>;

  isDisplayed(): Promise<boolean>;

  takeScreenshot(opt_scroll?: boolean): Promise<string>;

  getWrappedElement(): Promise<ElementHandle>;

  scrollIntoView(position?: boolean | string): Promise<void>;
}
