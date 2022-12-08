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
import { By, WebElement, WebDriver, Key } from 'selenium-webdriver';
import { browser } from './swd_client';
import { buildBy } from './swd_alignment';
import { getPositionXY } from '../mappers';

import type { PromodElementType, PromodElementsType } from '../interface';

// TODO figure out is this still relevant
function toSeleniumProtocolElement(webElId) {
  const elementObj = {
    'element-6066-11e4-a52e-4f735466cecf': webElId,
    ELEMENT: webElId,
  };
  return elementObj;
}

const SELENIUM_API_METHODS = [
  'sendKeys',
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
  'getLocation',
];

class PromodSeleniumElements {
  private _driver: WebDriver;
  private selector: string;
  private _driverElements: WebElement[];
  private getParent: () => Promise<PromodSeleniumElement & WebElement>;
  private getExecuteScriptArgs: () => any;
  public parentSelector: string;

  constructor(selector, client, getParent?, getExecuteScriptArgs?) {
    this._driver = client;
    this.selector = selector;
    this.getParent = getParent;
    this.getExecuteScriptArgs = getExecuteScriptArgs;
  }

  setseleniumDriver(client: WebDriver) {
    this._driver = client;
  }

  get(index): PromodElementType {
    const childElement = new PromodSeleniumElement(
      this.selector,
      this._driver,
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
    this._driver = browser.currentClient();

    if (this.getParent) {
      let parent = await this.getParent();

      if (parent.getEngineElement) {
        // @ts-ignore
        parent = await parent.getEngineElement();
      }

      this._driverElements = await parent.findElements(buildBy(this.selector, this.getExecuteScriptArgs));
    } else {
      this._driverElements = await this._driver.findElements(buildBy(this.selector, this.getExecuteScriptArgs));
    }

    if (index < 0) {
      return this._driverElements[this._driverElements.length + index];
    }

    return this._driverElements[index];
  }

  last(): PromodElementType {
    return this.get(-1) as any;
  }

  first(): PromodElementType {
    return this.get(0) as any;
  }

  async getIds() {
    await this.getElement();
    // @ts-ignore
    return this._driverElements.map((item) => item.id_);
  }

  async getEngineElements() {
    await this.getElement(0);

    return this._driverElements;
  }

  async each(cb: (item: PromodElementType, index?: number) => Promise<void>): Promise<any> {
    await this.getElement(0);

    for (let i = 0; i < this._driverElements.length; i++) {
      await cb(this.get(i), i);
    }
  }

  async map<T>(cb: (item: PromodElementType, index?: number) => Promise<T>): Promise<T[]> {
    await this.getElement(0);
    const res = [];

    for (let i = 0; i < this._driverElements.length; i++) {
      res.push(await cb(this.get(i), i));
    }

    return res;
  }

  async find(cb: (item: PromodElementType, index?: number) => Promise<boolean>): Promise<PromodElementType> {
    await this.getElement(0);

    for (let i = 0; i < this._driverElements.length; i++) {
      const el = this.get(i);
      if (await cb(el, i)) {
        return el;
      }
    }
  }

  async count(): Promise<number> {
    return this.getElement()
      .then(() => this._driverElements.length)
      .catch(() => 0);
  }
}

class PromodSeleniumElement {
  private _driver: WebDriver;
  private selector: string;
  private _driverElement: WebElement;
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

    const self = this;

    SELENIUM_API_METHODS.forEach(function (methodName) {
      self[methodName] = (...args: any[]) => {
        const action = () => self._driverElement[methodName].call(self._driverElement, ...args);

        return self.callElementAction(action);
      };
    });
  }

  setseleniumDriver(client: WebDriver) {
    this._driver = client;
  }

  $(selector): PromodElementType {
    const childElement = new PromodSeleniumElement(selector, this._driver, this.getElement.bind(this));
    childElement.parentSelector = this.selector;
    return childElement as any;
  }

  $$(selector): PromodElementsType {
    const childElements = new PromodSeleniumElements(selector, this._driver, this.getElement.bind(this));
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
      const { isIntercepted, isReadyToForce } = await this.isInteractionIntercepted(scrollableClickResult);
      if (isIntercepted && isReadyToForce && allowForceIfIntercepted) {
        scrollableClickResult = await this.clickByElementCoordinate('left-top').catch((err) => err);
      }
    }

    if (scrollableClickResult) {
      throw scrollableClickResult;
    }
  }

  async hover() {
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
    await this.getElement();
    const { x, y, width, height } = await this._driverElement.getRect();

    return getPositionXY(position, { x, y, width, height });
  }

  async focus() {
    await browser
      .currentClient()
      .actions()
      .move({ origin: await this.getEngineElement() })
      .press()
      .perform();
  }

  async scrollIntoView(position?: 'end' | 'start' | 'center') {
    await this.getElement();
    await this._driver.executeScript(
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

  async getElement() {
    this._driver = browser.currentClient();
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
        parent = await parent.getEngineElement();
      }

      if (this.useParent) {
        this._driverElement = parent;
      } else {
        this._driverElement = await parent.findElement(buildBy(this.selector, this.getExecuteScriptArgs));
      }
    } else {
      this._driverElement = await this._driver.findElement(buildBy(this.selector, this.getExecuteScriptArgs));
    }

    return this._driverElement;
  }

  /**
   * @example
   * const button = $('button')
   * await button.isDisplayed() // boolean - true|false
   *
   * @returns {Promise<boolean>} button is present
   */
  async isDisplayed() {
    return this.getElement()
      .then(() => this._driverElement.isDisplayed())
      .catch(() => false);
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
    return this.getElement()
      .then(() => true)
      .catch(() => false);
  }

  private async callElementAction(action) {
    await this.getElement();

    return action();
  }

  async getId() {
    await this.getElement();
    // @ts-ignore
    return this._driverElement.id_;
  }

  async getEngineElement() {
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
      isReadyToForce: (await this.isDisplayed()) && (await this._driverElement.isEnabled()),
      isIntercepted: strErr.includes('element click intercepted'),
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
      return [rootPromiseIfRequired, ...localRest];
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

  return new PromodSeleniumElement(selector, null, ...restArgs) as any;
};

const $$ = (
  selector: string | By | ((...args: any[]) => any) | Promise<any>,
  root?: PromodElementType | any,
  ...rest: any[]
): PromodElementsType => {
  const restArgs = getInitElementRest(selector, root, ...rest);

  return new PromodSeleniumElements(selector, null, ...restArgs) as any;
};

export { $, $$, PromodSeleniumElement, PromodSeleniumElements, By };
