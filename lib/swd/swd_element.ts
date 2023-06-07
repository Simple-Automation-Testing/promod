/* eslint-disable max-len */
import {
  isUndefined,
  getType,
  safeHasOwnPropery,
  isString,
  isFunction,
  isPromise,
  isObject,
  lengthToIndexesArray,
} from 'sat-utils';
import { By, WebElement, Key } from 'selenium-webdriver';
import { browser } from './swd_client';
import { buildBy } from './swd_alignment';
import { getPositionXY } from '../mappers';
import { promodLogger } from '../internals';

import type { PromodElementType, PromodElementsType } from '../interface';

const SELENIUM_API_METHODS = [
  'getTagName',
  'getCssValue',
  'getAttribute',
  'getText',
  'getRect',
  'isEnabled',
  'isSelected',
  'submit',
  'clear',
  'getId',
  'takeScreenshot',
];

class PromodSeleniumElements {
  private selector: string;
  private _driverElements: WebElement[];
  private getParent: () => Promise<PromodSeleniumElement & WebElement>;
  private getExecuteScriptArgs: () => any;
  public _browserInterface: any;
  public parentSelector: string;

  constructor(selector, client = browser, getParent?, getExecuteScriptArgs?) {
    this._browserInterface = client;
    this.selector = selector;
    this.getParent = getParent;
    this.getExecuteScriptArgs = getExecuteScriptArgs;
  }

  get(index): PromodElementType {
    promodLogger.engineLog(`[SWD] Promod elements interface calls method "get" from wrapped API, args: `, index);
    const childElement = new PromodSeleniumElement(
      this.selector,
      this._browserInterface,
      this.getElement.bind(this, index),
      null,
      true,
    );
    if (this.parentSelector) {
      childElement.parentSelector = this.parentSelector || this.selector;
    }
    return childElement as any;
  }

  /**
   *
   * @info if index is less than zero we will get element from the end
   * @param {number} index
   * @returns
   */
  private async getElement(index?) {
    promodLogger.engineLog(`[SWD] Promod elements interface calls method "getElement" from wrapped API, args: `, index);
    const _driver = this._browserInterface.currentClient();

    const ignoreParent = isString(this.selector) && this.selector.startsWith('ignore-parent=');
    const selector = ignoreParent ? this.selector.replace('ignore-parent=', '') : this.selector;

    if (this.getParent && !ignoreParent && isString(selector)) {
      let parent = await this.getParent();

      if (parent.getEngineElement) {
        // @ts-ignore
        parent = await parent.getEngineElement();
      }

      this._driverElements = await parent.findElements(buildBy(selector, this.getExecuteScriptArgs));
    } else {
      this._driverElements = await _driver.findElements(buildBy(selector, this.getExecuteScriptArgs));
    }

    if (index < 0) {
      return this._driverElements[this._driverElements.length + index];
    }

    return this._driverElements[index];
  }

  last(): PromodElementType {
    promodLogger.engineLog(`[SWD] Promod elements interface calls method "last" from wrapped API`);
    return this.get(-1) as any;
  }

  first(): PromodElementType {
    promodLogger.engineLog(`[SWD] Promod elements interface calls method "first" from wrapped API`);
    return this.get(0) as any;
  }

  async getIds() {
    await this.getElement();
    // @ts-ignore
    return this._driverElements.map((item) => item.id_);
  }

  async getEngineElements() {
    promodLogger.engineLog(`[SWD] Promod elements interface calls method "getEngineElements" from wrapped API`);
    await this.getElement(0);

    return this._driverElements;
  }

  async each(cb: (item: PromodElementType, index?: number) => Promise<void>): Promise<any> {
    promodLogger.engineLog(`[SWD] Promod elements interface calls method "each" from wrapped API, args: `, cb);
    await this.getElement(0);

    for (let i = 0; i < this._driverElements.length; i++) {
      await cb(this.get(i), i);
    }
  }

  async map<T>(cb: (item: PromodElementType, index?: number) => Promise<T>): Promise<T[]> {
    promodLogger.engineLog(`[SWD] Promod elements interface calls method "map" from wrapped API, args: `, cb);
    await this.getElement(0);
    const res = [];

    for (let i = 0; i < this._driverElements.length; i++) {
      res.push(await cb(this.get(i), i));
    }

    return res;
  }

  async find(cb: (item: PromodElementType, index?: number) => Promise<boolean>): Promise<PromodElementType> {
    promodLogger.engineLog(`[SWD] Promod elements interface calls method "find" from wrapped API, args: `, cb);
    await this.getElement(0);

    for (let i = 0; i < this._driverElements.length; i++) {
      const el = this.get(i);
      if (await cb(el, i)) {
        return el;
      }
    }
  }

  async count(): Promise<number> {
    promodLogger.engineLog(`[SWD] Promod elements interface calls method "count" from wrapped API`);
    return this.getElement()
      .then(() => this._driverElements.length)
      .catch((error) => {
        promodLogger.engineLog(
          `Promod elements interface gets error after method "count" from wrapped API, error: `,
          error,
        );

        return 0;
      });
  }
}

class PromodSeleniumElement {
  private selector: string;
  private _driverElement: WebElement;
  private getParent: () => Promise<PromodElementType>;
  private getExecuteScriptArgs: () => any;
  private useParent: boolean;
  public _browserInterface: any;
  public parentSelector: string;

  constructor(selector, client = browser, getParent?, getExecuteScriptArgs?, useParent?) {
    this._browserInterface = client;
    this.selector = selector;
    this.getParent = getParent;
    this.getExecuteScriptArgs = getExecuteScriptArgs;
    this.useParent = useParent;

    const self = this;

    SELENIUM_API_METHODS.forEach(function (methodName) {
      self[methodName] = (...args: any[]) => {
        promodLogger.engineLog(
          `Promod element interface calls method "${methodName}" from selenium native API, args: `,
          ...args,
        );
        const action = () => self._driverElement[methodName].call(self._driverElement, ...args);

        return self.callElementAction(action);
      };
    });
  }

  async getElement() {
    promodLogger.engineLog(`[SWD] Promod element interface calls method "getElement" from wrapped API`);
    const _driver = (this._browserInterface || browser).currentClient();

    const ignoreParent = isString(this.selector) && this.selector.startsWith('ignore-parent=');
    const selector = ignoreParent ? this.selector.replace('ignore-parent=', '') : this.selector;

    /**
     * !@info
     * selector should be a string type to proceed inside if block
     */
    if (this.getParent && !ignoreParent && isString(selector)) {
      let parent = (await this.getParent()) as any;
      if (!parent) {
        throw new Error(
          this.useParent
            ? `Any element with selector ${this.selector} was not found`
            : `Parent element with selector ${this.parentSelector} was not found`,
        );
      }
      if (parent.getEngineElement) {
        parent = await parent.getEngineElement();
      }

      if (this.useParent) {
        this._driverElement = parent;
      } else {
        this._driverElement = await parent.findElement(buildBy(selector, this.getExecuteScriptArgs));
      }
    } else {
      this._driverElement = await _driver.findElement(buildBy(selector, this.getExecuteScriptArgs));
    }

    return this._driverElement;
  }

  $(selector, ...rest): PromodElementType {
    promodLogger.engineLog('[SWD] Create new promod child element, selector: ', selector);
    const [, executeScriptArgsGetter] = getInitElementRest(selector, null, ...rest);
    const childElement = new PromodSeleniumElement(
      selector,
      this._browserInterface,
      this.getElement.bind(this),
      executeScriptArgsGetter,
    );
    childElement.parentSelector = this.selector;
    return childElement as any;
  }

  $$(selector, ...rest): PromodElementsType {
    promodLogger.engineLog('[SWD] Create new promod child elements, selector: ', selector);
    const [, executeScriptArgsGetter] = getInitElementRest(selector, null, ...rest);
    const childElements = new PromodSeleniumElements(
      selector,
      this._browserInterface,
      this.getElement.bind(this),
      executeScriptArgsGetter,
    );
    childElements.parentSelector = this.selector;
    return childElements as any;
  }

  /**
   * @example
   * const button = $('button');
   * await button.click(); // regular click
   * await button.click({ withScroll: true }); // first element will be scrolled to view port and then regular click
   * await button.click({ allowForceIfIntercepted: true }); // if regular click is intercepted by another element, click will be re-executed by element x,y center coordinates
   *
   * @param {object} [opts] clickOpts
   * @param {boolean} [opts.withScroll] withScroll
   * @param {'left' | 'right' | 'middle'} [opts.button] button
   * @param {number} [opts.clickCount] clickCount
   * @param {number} [opts.delay] delay
   * @param {boolean} [opts.force] force
   * @param {Array<'Alt' | 'Control' | 'Meta' | 'Shift'>} [opts.modifiers] modifiers
   * @param {boolean} [opts.noWaitAfter] noWaitAfter
   * @param {{ x: number; y: number }} [opts.position] position
   * @param {number} [opts.timeout] timeout
   * @param {boolean} [opts.trial] trial
   * @param {boolean} [opts.allowForceIfIntercepted] allowForceIfIntercepted
   * @returns {Promise<void>}
   */
  async click(
    opts: {
      withScroll?: boolean;
      allowForceIfIntercepted?: boolean;
      button?: 'left' | 'right' | 'middle';
      clickCount?: number;
      delay?: number;
      force?: boolean;
      modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;
      noWaitAfter?: boolean;
      position?: { x: number; y: number };
      timeout?: number;
      trial?: boolean;
    } = { clickCount: 1 },
  ) {
    promodLogger.engineLog(`[SWD] Promod element interface calls method "click" from wrapped API, args: `, opts);
    if (!isObject(opts) && !isUndefined(opts)) {
      throw new TypeError(`click(); accepts only object type ${getType(opts)}`);
    }

    const { withScroll, allowForceIfIntercepted } = opts;

    await this.getElement();

    if (withScroll) {
      await this.scrollIntoView('center');
    }

    if (opts.force) {
      return await this.clickByElementCoordinate();
    }

    let scrollableClickResult = await this._driverElement.click().catch((err) => err);

    if (scrollableClickResult) {
      const { isReadyToForce } = await this.isInteractionIntercepted(scrollableClickResult);
      if (isReadyToForce && allowForceIfIntercepted) {
        scrollableClickResult = await this.clickByElementCoordinate('left-top').catch((err) => err);
      }
    }

    if (scrollableClickResult) {
      throw scrollableClickResult;
    }
  }

  async sendKeys(value, asFill) {
    promodLogger.engineLog(`[SWD] Promod element interface calls method "sendKeys" from wrapped API, args: `, value);
    await this.getElement();
    await this._driverElement.sendKeys(value);
  }

  async hover() {
    promodLogger.engineLog(`[SWD] Promod element interface calls method "hover" from wrapped API`);
    await browser
      .currentClient()
      .actions()
      .move({ origin: await this.getEngineElement() })
      .perform();
  }

  async clickByElementCoordinate(
    position:
      | 'center'
      | 'center-top'
      | 'center-bottom'
      | 'center-right'
      | 'center-left'
      | 'right-top'
      | 'right-bottom'
      | 'left-top'
      | 'left-bottom' = 'center',
  ) {
    promodLogger.engineLog(
      `Promod element interface calls method "clickByElementCoordinate" from wrapped API, args: `,
      position,
    );
    const { x, y } = await this.getElementCoordinates(position);

    await browser
      .currentClient()
      .actions()
      .move({ x: Math.round(x), y: Math.round(y) })
      .click()
      .perform();
  }

  async getElementCoordinates(
    position:
      | 'center'
      | 'center-top'
      | 'center-bottom'
      | 'center-right'
      | 'center-left'
      | 'right-top'
      | 'right-bottom'
      | 'left-top'
      | 'left-bottom' = 'center',
  ) {
    promodLogger.engineLog(
      `Promod element interface calls method "getElementCoordinates" from wrapped API, args: `,
      position,
    );
    await this.getElement();
    const { x, y, width, height } = await this._driverElement.getRect();

    return getPositionXY(position, { x, y, width, height });
  }

  async focus() {
    promodLogger.engineLog(`[SWD] Promod element interface calls method "focus" from wrapped API`);
    await browser
      .currentClient()
      .actions()
      .move({ origin: await this.getEngineElement() })
      .press()
      .perform();
  }

  async scrollIntoView(position?: 'end' | 'start' | 'center') {
    promodLogger.engineLog(
      `[SWD] Promod element interface calls method "scrollIntoView" from wrapped API, args: `,
      position,
    );
    await this.getElement();
    await this._browserInterface.executeScript(
      ([elem, scrollPosition]) => {
        let position;

        const scrollBlock = ['end', 'start', 'center', 'nearest'];
        if (scrollBlock.includes(scrollPosition)) {
          position = { block: scrollPosition };
        }
        elem.scrollIntoView(position || true);
      },
      [await this.getEngineElement(), position],
    );
  }

  /**
   * @example
   * const button = $('button')
   * await button.isDisplayed() // boolean - true|false
   *
   * @returns {Promise<boolean>} button is present
   */
  async isDisplayed() {
    promodLogger.engineLog(`[SWD] Promod element interface calls method "isDisplayed" from wrapped API`);
    return this.getElement()
      .then(() => this._driverElement.isDisplayed())
      .catch((error) => {
        promodLogger.engineLog(
          `Promod element interface gets error after method "isDisplayed" from wrapped API, error: `,
          error,
        );

        return false;
      });
  }

  /**
   * @example
   * const txt = '123';
   * const inpt = $('input');
   * await inpt.sendKeys(txt);
   * await inpt.clearViaBackspace(txt.length, true);
   *
   * @param {number} repeat how many times execute back space
   * @param {boolean} [focus] should element got focus event before execute back space
   *
   * @returns {Promise<void>}
   */
  async clearViaBackspace(repeat: number = 1, focus?: boolean) {
    promodLogger.engineLog(
      `Promod element interface calls method "clearViaBackspace" from wrapped API, args: `,
      repeat,
      focus,
    );
    await this.getElement();
    if (focus) {
      await this.click({ withScroll: true });
    }
    for (const _act of lengthToIndexesArray(repeat)) {
      await this._driverElement.sendKeys(Key.BACK_SPACE);
    }
  }

  /**
   * @example
   * const txt = '123';
   * const inpt = $('input');
   * await inpt.sendKeys(txt);
   * await inpt.pressEnter(true);
   *
   * @param {boolean} [focus] should element got focus event before execute enter
   *
   * @returns {Promise<void>}
   */
  async pressEnter(focus?: boolean) {
    promodLogger.engineLog(`[SWD] Promod element interface calls method "pressEnter" from wrapped API, args: `, focus);
    await this.getElement();
    if (focus) {
      await this.click({ withScroll: true });
    }
    await this._driverElement.sendKeys(Key.ENTER);
  }

  // select specific
  async selectOption(
    optValue:
      | {
          value?: string;
          label?: string;
          index?: number;
        }
      | string,
  ) {
    promodLogger.engineLog(
      `[SWD] Promod element interface calls method "selectOption" from wrapped API, args: `,
      optValue,
    );
    await this.getElement();
    // open options list
    await this.click({ withScroll: true });

    if (isString(optValue)) {
      return this.$$('option').each(async (opt) => {
        const text = await opt.getText();
        if (text.trim() === (optValue as string).trim()) {
          await opt.click();
        }
      });
    }
    if (isObject(optValue) && safeHasOwnPropery(optValue, 'value')) {
      return this.$$('option').each(async (opt) => {
        const text = await opt.getAttribute('value');
        if (text.trim() === (optValue['value'] as string).trim()) {
          await opt.click();
        }
      });
    }
    if (isObject(optValue) && safeHasOwnPropery(optValue, 'label')) {
      return this.$$('option').each(async (opt) => {
        const text = await opt.getAttribute('label');
        if (text.trim() === (optValue['label'] as string).trim()) {
          await opt.click();
        }
      });
    }
    if (isObject(optValue) && safeHasOwnPropery(optValue, 'index')) {
      return this.$$('option').each(async (opt) => {
        const text = await opt.getAttribute('index');
        if (text.trim() === (optValue['index'] as string).toString().trim()) {
          await opt.click();
        }
      });
    }
  }

  /**
   * @example
   * const button = $('button')
   * const buttonIsPresent = await button.isPresent();
   *
   * @returns {Promise<boolean>} button is present
   */
  async isPresent() {
    promodLogger.engineLog(`[SWD] Promod element interface calls method "isPresent" from wrapped API`);
    return this.getElement()
      .then(() => true)
      .catch((error) => {
        promodLogger.engineLog(
          `Promod element interface gets error after method "isPresent" from wrapped API, error: `,
          error,
        );
        return false;
      });
  }

  private async callElementAction(action) {
    await this.getElement();

    return action();
  }

  async getId() {
    promodLogger.engineLog(`[SWD] Promod element interface calls method "getId" from wrapped API`);
    await this.getElement();
    // @ts-ignore
    return this._driverElement.id_;
  }

  async getEngineElement() {
    promodLogger.engineLog(`[SWD] Promod element interface calls method "getEngineElement" from wrapped API`);
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

  private async isInteractionIntercepted(err) {
    const strErr: string = err.toString();

    return {
      isReadyToForce:
        (await this.isDisplayed()) &&
        (await this._driverElement.isEnabled()) &&
        strErr.includes('element click intercepted'),
    };
  }
}

function getInitElementRest(
  selector: string | By | ((...args: any[]) => any) | Promise<any>,
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

      if (rootPromiseIfRequired) {
        return [rootPromiseIfRequired, ...localRest];
      }

      return localRest;
    };
  } else if (root && root instanceof PromodSeleniumElement) {
    getParent = function getParent() {
      return root;
    };
  }

  return [getParent, getExecuteScriptArgs];
}

const $ = (
  selector: string | By | ((...args: any[]) => any) | Promise<any>,
  root?: PromodElementType | any,
  ...rest: any[]
): PromodElementType => {
  const restArgs = getInitElementRest(selector, root, ...rest);
  promodLogger.engineLog('Create new Promod element interface, args: ', ...restArgs);

  return new PromodSeleniumElement(selector, browser, ...restArgs) as any;
};

const $$ = (
  selector: string | By | ((...args: any[]) => any) | Promise<any>,
  root?: PromodElementType | any,
  ...rest: any[]
): PromodElementsType => {
  const restArgs = getInitElementRest(selector, root, ...rest);
  promodLogger.engineLog('Create new Promod element interfaces, args: ', ...restArgs);

  return new PromodSeleniumElements(selector, browser, ...restArgs) as any;
};

function preBindBrowserInstance(browserThaNeedsToBeBinded) {
  const $$ = (
    selector: string | By | ((...args: any[]) => any) | Promise<any>,
    root?: PromodElementType | any,
    ...rest: any[]
  ): PromodElementsType => {
    const restArgs = getInitElementRest(selector, root, ...rest);

    const collection = new PromodSeleniumElements(selector, browserThaNeedsToBeBinded, ...restArgs) as any;

    return collection;
  };

  const $ = (
    selector: string | By | ((...args: any[]) => any) | Promise<any>,
    root?: PromodElementType | any,
    ...rest: any[]
  ): PromodElementType => {
    const restArgs = getInitElementRest(selector, root, ...rest);

    const element = new PromodSeleniumElement(selector, browserThaNeedsToBeBinded, ...restArgs) as any;

    return element;
  };
  return {
    browser: browserThaNeedsToBeBinded,
    $$,
    $,
  };
}

export { $, $$, PromodSeleniumElement, PromodSeleniumElements, By, preBindBrowserInstance };
