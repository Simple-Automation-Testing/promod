/* eslint-disable max-len */
import { Key } from 'selenium-webdriver';
import { toArray, isString, isNumber, isFunction, isAsyncFunction, isPromise, lengthToIndexesArray } from 'sat-utils';
import { browser } from './pw_client';

import type { PromodElementType, PromodElementsType } from '../interface';
import type { ElementHandle, Page } from 'playwright-core';

const buildBy = (selector: any, getExecuteScriptArgs?: () => any[]): any => {
  getExecuteScriptArgs = isFunction(getExecuteScriptArgs) ? getExecuteScriptArgs : () => [];

  if (isString(selector) && (selector as string).includes('xpath=')) {
    const sel = selector as string;
    if (sel.startsWith('xpath=//')) {
      return sel.replace('xpath=', '');
    }
    if (sel.startsWith('xpath=.') && !sel.includes('|.')) {
      return sel.replace('xpath=.', '');
    }
    if (sel.startsWith('xpath=.') && sel.includes('|.')) {
      return sel.replace('xpath=.', '').replace(/\|\./gi, '|');
    }
  } else if (isString(selector) && (selector as string).includes('js=')) {
    return [(selector as string).replace('js=', ''), ...getExecuteScriptArgs()];
  } else if (isPromise(selector)) {
    return selector;
  } else if (isFunction(selector)) {
    return [selector, ...getExecuteScriptArgs()];
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
    this._driver = await browser.getWorkingContext();

    const getElementArgs = buildBy(this.selector, this.getExecuteScriptArgs);
    const shouldUserDocumentRoot = this.selector.toString().startsWith('xpath=//');

    if (this.getParent) {
      let parent = await this.getParent();
      // @ts-ignore
      if (parent.getEngineElement) {
        // @ts-ignore
        parent = shouldUserDocumentRoot ? this._driver : await parent.getEngineElement();
      }

      // TODO improve this solution
      this._driverElements = (await (shouldUserDocumentRoot ? this._driver : parent).$$(
        getElementArgs,
      )) as any as ElementHandle[];
    } else if (isFunction(getElementArgs[0]) || isAsyncFunction(getElementArgs[0])) {
      const elementHandles = [];
      const resolved = [];
      const callArgs = toArray(getElementArgs[1]);

      for (const item of callArgs) {
        // TODO refactor resolver
        resolved.push(await item);
      }
      // @ts-ignore
      const handlesByFunctionSearch = await this._driver.evaluateHandle(
        getElementArgs[0],
        resolved.length === 1 ? resolved[0] : resolved,
      );
      // @ts-ignore
      const availableHandlesLength = await this._driver.evaluate((nodes) => nodes.length, handlesByFunctionSearch);
      for (const index of lengthToIndexesArray(availableHandlesLength)) {
        const handle = await this._driver.evaluateHandle(
          // @ts-ignore
          ([nodes, itemIndex]) => nodes[itemIndex],
          [handlesByFunctionSearch, index],
        );
        elementHandles.push(await handle.asElement());
      }

      this._driverElements = elementHandles.filter(Boolean);
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
  private _driverElement: ElementHandle;
  private getParent: () => Promise<PromodElementType>;
  private getExecuteScriptArgs: () => any;
  private useParent: boolean;
  public selector: string;
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

  async getTagName() {
    await this.getElement();
    return this._driver.evaluate((item) => item.nodeName.toLowerCase(), this._driverElement);
  }

  async getCssValue() {}

  async getAttribute(attribute: string) {
    await this.getElement();
    return this._driverElement.getAttribute(attribute);
  }

  async getRect() {
    await this.getElement();
    return this._driverElement.boundingBox();
  }

  async isEnabled() {
    await this.getElement();
    return this._driverElement.isEnabled();
  }

  async isSelected() {
    await this.getElement();
    return this._driverElement.isChecked();
  }

  /**
   * @deprecated
   */
  async getLocation() {
    // await this.getElement();
    // await this._driverElement();
  }

  /**
   * @example works with Enter, need improve for another Keys
   *
   * @param value
   */
  async sendKeys(value: string | number) {
    if (!isString(value) && !isNumber(value)) {
      throw new TypeError('sendKeys accepts only string or number value type');
    }
    await this.getElement();
    const stringValue = value.toString();
    const seleniumEnter = Key.ENTER;

    if (stringValue.includes(seleniumEnter)) {
      const splitedValues = stringValue.split(seleniumEnter);
      for (const [index, valueItem] of splitedValues.entries()) {
        await this._driverElement.type(valueItem, { delay: 25 });
        if (index !== splitedValues.length - 1) await this.pressEnter();
      }
    } else {
      await this._driverElement.type(stringValue, { delay: 25 });
    }
  }

  async hover() {
    await this.getElement();
    await this._driverElement.hover();
  }

  async focus() {
    await this.getElement();
    await this._driverElement.focus();
  }

  async pressEnter(focus: boolean = true) {
    await this.getElement();
    if (focus) {
      await this._driverElement.focus();
    }
    await this._driver.keyboard.press('Enter');
  }

  async clearViaBackspace(repeat: number = 1, focus = true) {
    await this.getElement();
    if (focus) {
      await this._driverElement.focus();
    }
    for (const _act of lengthToIndexesArray(repeat)) {
      await this._driver.keyboard.press('Backspace', { delay: 25 });
    }
  }

  async selectOption(
    value:
      | string
      | {
          /**
           * Matches by `option.value`. Optional.
           */
          value?: string;

          /**
           * Matches by `option.label`. Optional.
           */
          label?: string;

          /**
           * Matches by the index. Optional.
           */
          index?: number;
        },
    strictTextOptionEqual?: boolean,
  ) {
    await this.getElement();
    if (isString(value)) {
      const opts = await this._driverElement.$$('option');
      for (const opt of opts) {
        const content = (await opt.textContent()).trim();
        // @ts-ignore
        const res = strictTextOptionEqual ? content === value.trim() : content.includes(value);
        if (res) {
          return this._driverElement.selectOption(opt);
        }
      }

      // TODO add promod errors
      throw new Error(`Option with text ${value} was not found`);
    }

    return this._driverElement.selectOption(value);
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
    return await this._driverElement.textContent();
  }

  async takeScreenshot() {
    await this.getElement();
    return await this._driverElement.screenshot();
  }

  async scrollIntoView(position?: 'end' | 'start' | 'center') {
    await this.getElement();
    await this._driver.evaluateHandle(
      ([elem, scrollPosition]) => {
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
      [await this.getEngineElement(), position],
    );
  }

  private async getEngineElement() {
    await this.getElement();
    return this._driverElement;
  }

  async getElement() {
    this._driver = await browser.getWorkingContext();
    const getElementArgs = buildBy(this.selector, this.getExecuteScriptArgs);
    const shouldUserDocumentRoot = this.selector.toString().startsWith('xpath=//');

    if (this.getParent) {
      let parent = (await this.getParent()) as any;
      if (!parent) {
        throw new Error(
          this.useParent
            ? `Any element with selector ${this.selector} was not found`
            : `Parent element with selector ${this.parentSelector} was not found`,
        );
      }
      if (parent.getEngineElement) {
        parent = shouldUserDocumentRoot ? this._driver : await parent.getEngineElement();
      }

      if (this.useParent) {
        this._driverElement = parent;
      } else {
        const element = await (shouldUserDocumentRoot ? this._driver : parent).$(getElementArgs);
        this._driverElement = element ? await element.asElement() : element;
      }
    } else if (isFunction(getElementArgs[0]) || isAsyncFunction(getElementArgs[0])) {
      const resolved = [];
      const callArgs = toArray(getElementArgs[1]);

      for (const item of callArgs) {
        // TODO refactor resolver
        resolved.push(await item);
      }
      this._driverElement = (
        await this._driver.evaluateHandle(getElementArgs[0], resolved.length === 1 ? resolved[0] : resolved)
      ).asElement();
    } else {
      this._driverElement = await (await this._driver.$(getElementArgs)).asElement();
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
      .then(() => Boolean(this._driverElement))
      .catch(() => false);
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
      const localRest = rest.map((item) => (item && item.getEngineElement ? item.getEngineElement() : item));
      const rootPromiseIfRequired = root && root.getEngineElement ? root.getEngineElement() : root;
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
