/* eslint-disable max-len */
import {
  getType,
  isUndefined,
  isObject,
  toArray,
  isString,
  isNumber,
  isFunction,
  isAsyncFunction,
  isPromise,
  lengthToIndexesArray,
  getRandomString,
} from 'sat-utils';
import { browser } from './pw_client';
import { getPositionXY, KeysSWD } from '../mappers';
import { promodLogger } from '../internals';

import type { PromodElementType, PromodElementsType } from '../interface';
import type { TCustomSelector } from '../mappers';
import type { Page, Locator, ElementHandle } from 'playwright-core';

const buildBy = (selector: any, getExecuteScriptArgs: () => any[], parent?, toMany?): any => {
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
  } else if (isPromise(selector)) {
    return selector;
  } else if (isFunction(selector) || isAsyncFunction(selector)) {
    return [selector, ...getExecuteScriptArgs()];
  } else if (isObject(selector)) {
    const item = selector as TCustomSelector;

    return [
      ([parent, entry]) => {
        const { query, text, rg, strict, toMany } = entry;
        const elements = parent ? parent.querySelectorAll(query) : document.querySelectorAll(query);

        if (!elements.length) return null;

        const filteredElements = [];

        for (const element of elements) {
          const innerText = element?.innerText?.trim() || element?.textContent?.trim() || element?.outerHTML?.trim();
          const textMatches = typeof text === 'string' && (!strict ? innerText.includes(text) : innerText === text);
          const rgMatches = rg && innerText.match(new RegExp(rg, 'gmi'));

          if (rgMatches && !toMany) {
            return element;
          } else if (textMatches && !toMany) {
            return element;
          } else if (rgMatches && toMany) {
            filteredElements.push(element);
          } else if (textMatches && toMany) {
            filteredElements.push(element);
          }
          if (!text && !rg) {
            return element;
          }
        }

        return toMany ? filteredElements : null;
      },
      [parent, { ...item, toMany }],
    ];
  }

  return selector;
};

class PromodPlaywrightElements {
  private _driver: Page;
  private _driverElements: Locator[];
  private getParent: () => Promise<PromodPlaywrightElement>;
  private getExecuteScriptArgs: () => any;
  private selector: string;
  public parentSelector: string;
  public _browserInterface: any;

  constructor(selector, client, getParent?, getExecuteScriptArgs?) {
    this._browserInterface = client;
    this.selector = selector;
    this.getParent = getParent;
    this.getExecuteScriptArgs = getExecuteScriptArgs;
  }

  /**
   * @private
   *
   * @info if index is less than zero we will get element from the end
   * @param {number} index
   * @returns {Promise<ElementHandle>}
   */
  private async getElement(index?) {
    promodLogger.engineLog(`[PW] Promod elements interface calls method "getElement" from wrapped API, args: `, index);
    const _driver = await browser['getWorkingContext']();

    const ignoreParent = isString(this.selector) && this.selector.startsWith('ignore-parent=');
    const selector = ignoreParent ? this.selector.replace('ignore-parent=', '') : this.selector;

    const getElementArgs = buildBy(selector, this.getExecuteScriptArgs);
    const shouldUserDocumentRoot = selector.toString().startsWith('xpath=//');

    let parent;

    if (this.getParent && !ignoreParent) {
      parent = (await this.getParent()) as any;
      if (!parent) {
        throw new Error(`Any element with selector ${this.selector} was not found`);
      }
      if (parent.getEngineElement) {
        parent = shouldUserDocumentRoot ? this._driver : await parent.getEngineElement();
      }
    }

    if (this.getParent && !ignoreParent && isString(selector)) {
      parent = await this.getParent();

      if (parent.getEngineElement) {
        parent = (shouldUserDocumentRoot ? _driver : await parent.getEngineElement()) as any as Locator;
      }

      // TODO improve this solution
      const items = await (shouldUserDocumentRoot ? _driver : parent).locator(getElementArgs);
      this._driverElements = await (items as Locator).all();
    } else if (isFunction(getElementArgs[0]) || isAsyncFunction(getElementArgs[0])) {
      const [queryFn, quertFnArgs] = buildBy(selector, this.getExecuteScriptArgs, parent, true);
      const elementHandles = [];
      const resolved = [];
      const callArgs = toArray(quertFnArgs);

      for (const item of callArgs) {
        // TODO refactor resolver
        const resolvedItem = await item;

        resolved.push(resolvedItem?.elementHandle ? await resolvedItem.elementHandle() : resolvedItem);
      }
      // @ts-ignore
      const handlesByFunctionSearch = await _driver.evaluateHandle(
        queryFn,
        resolved.length === 1 ? resolved[0] : resolved,
      );
      // @ts-ignore
      const availableHandlesLength = await _driver.evaluate((nodes) => nodes.length, handlesByFunctionSearch);
      for (const index of lengthToIndexesArray(availableHandlesLength)) {
        const handle = await _driver.evaluateHandle(
          // @ts-ignore
          ([nodes, itemIndex]) => nodes[itemIndex],
          [handlesByFunctionSearch, index],
        );
        elementHandles.push(await handle.asElement());
      }

      this._driverElements = elementHandles.filter(Boolean);
    } else {
      this._driverElements = await _driver.locator(buildBy(this.selector, this.getExecuteScriptArgs)).all();
    }

    if (index < 0) {
      return this._driverElements[this._driverElements.length + index];
    }

    return this._driverElements[index];
  }

  /**
   * @example
   *
   * const buttons = $$('button');
   * await buttons.get(0).click();
   *
   * @param {number} index
   * @returns {PromodElementType}
   */
  get(index): PromodElementType {
    const childElement = new PromodPlaywrightElement(
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
   * @example
   *
   * const buttons = $$('button');
   * await buttons.last().click();
   *
   * @param {number} index
   * @returns {PromodElementType}
   */
  last(): PromodElementType {
    promodLogger.engineLog(`[PW] Promod elements interface calls method "last" from wrapped API`);
    return this.get(-1) as any;
  }

  /**
   * @example
   *
   * const buttons = $$('button');
   * await buttons.first().click();
   *
   * @param {number} index
   * @returns {PromodElementType}
   */
  first(): PromodElementType {
    promodLogger.engineLog(`[PW] Promod elements interface calls method "first" from wrapped API`);
    return this.get(0) as any;
  }

  /**
   * @example
   * const buttons = $$('button');
   *
   * const nativeElements = await buttons.getEngineElements();
   *
   * @returns {Promise<ElementHandle[]>}
   */
  async getEngineElements() {
    promodLogger.engineLog(`[PW] Promod elements interface calls method "getEngineElements" from wrapped API`);
    await this.getElement();
    return this._driverElements;
  }

  /**
   * @example
   *
   * const buttons = $$('button');
   * await buttons.each(async (button) => await button.click());
   *
   * @param {(item, index) => Promise<void>} cb
   */
  async each(cb: (item: PromodElementType, index?: number) => Promise<void>): Promise<void> {
    promodLogger.engineLog(`[PW] Promod elements interface calls method "each" from wrapped API, args: `, cb);
    await this.getElement(0);

    for (let i = 0; i < this._driverElements.length; i++) {
      await cb(this.get(i), i);
    }
  }

  /**
   * @example
   * const buttons = $$('button');
   * const buttonsText = await buttons.map(async (button) => await button.getText());
   *
   * @param {(item, index) => Promise<any>} cb
   * @returns {Promise<any[]>}
   */
  async map<T>(cb: (item: PromodElementType, index?: number) => Promise<T>): Promise<T[]> {
    promodLogger.engineLog(`[PW] Promod elements interface calls method "map" from wrapped API, args: `, cb);
    await this.getElement(0);
    const res = [];

    for (let i = 0; i < this._driverElements.length; i++) {
      res.push(await cb(this.get(i), i));
    }

    return res;
  }

  /**
   * @example
   * const buttons = $$('button');
   * const isSomeButtonDisplayed = await buttons.some(async (button) => await button.isDisplayed());
   *
   * @param {(item, index) => Promise<any>} cb
   * @returns {Promise<boolean>}
   */
  async some(cb: (item: PromodElementType, index?: number) => Promise<boolean>): Promise<boolean> {
    promodLogger.engineLog(`[PW] Promod elements interface calls method "some" from wrapped API, args: `, cb);
    await this.getElement(0);

    for (let i = 0; i < this._driverElements.length; i++) {
      const res = await cb(this.get(i), i).catch(() => false);
      if (res) {
        return res;
      }
    }

    return false;
  }

  /**
   * @example
   * const buttons = $$('button');
   * const isEveryButtonDisplayed = await buttons.every(async (button) => await button.isDisplayed());
   *
   * @param {(item, index) => Promise<any>} cb
   * @returns {Promise<boolean>}
   */
  async every(cb: (item: PromodElementType, index?: number) => Promise<boolean>): Promise<boolean> {
    promodLogger.engineLog(`[PW] Promod elements interface calls method "every" from wrapped API, args: `, cb);
    await this.getElement(0);

    for (let i = 0; i < this._driverElements.length; i++) {
      const res = await cb(this.get(i), i).catch(() => false);
      if (!res) {
        return res;
      }
    }

    return true;
  }

  /**
   * @example
   * const buttons = $$('button');
   * const button = await buttons.find(async (button) => await button.getText() === 'Click me');
   *
   * @param {(item, index) => Promise<any>} cb
   * @returns {Promise<PromodElementType>}
   */
  async find(cb: (item: PromodElementType, index?: number) => Promise<boolean>): Promise<PromodElementType> {
    promodLogger.engineLog(`[PW] Promod elements interface calls method "find" from wrapped API, args: `, cb);
    await this.getElement(0);

    for (let i = 0; i < this._driverElements.length; i++) {
      const el = this.get(i);
      if (await cb(el, i)) {
        return el;
      }
    }

    throw new Error(`Element with selector ${this.selector} was not found`);
  }

  /**
   * @example
   * const buttons = $$('button');
   * const buttonsCount = await buttons.count();
   *
   * @returns {Promise<number>}
   */
  async count(): Promise<number> {
    promodLogger.engineLog(`[PW] Promod elements interface calls method "count" from wrapped API`);
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

class PromodPlaywrightElement {
  private _driver: Page;
  private _driverElement: Locator;
  private getParent: () => Promise<PromodElementType>;
  private getExecuteScriptArgs: () => any;
  private useParent: boolean;
  public selector: string;
  public parentSelector: string;
  public _browserInterface: any;

  constructor(selector, client, getParent?, getExecuteScriptArgs?, useParent?) {
    this._browserInterface = client;
    this.selector = selector;
    this.getParent = getParent;
    this.getExecuteScriptArgs = getExecuteScriptArgs;
    this.useParent = useParent;
  }

  /**
   * @private
   * @returns {Promise<ElementHandle<Node>>}
   */
  private async getElement() {
    promodLogger.engineLog(`[PW] Promod element interface calls method "getElement" from wrapped API`);
    this._driver = await browser['getWorkingContext']();

    const ignoreParent = isString(this.selector) && this.selector.startsWith('ignore-parent=');
    const selector = ignoreParent ? this.selector.replace('ignore-parent=', '') : this.selector;

    const shouldUserDocumentRoot = selector.toString().startsWith('xpath=//');

    const getElementArgs = buildBy(selector, this.getExecuteScriptArgs);

    let parent;

    if (this.getParent && !ignoreParent) {
      parent = (await this.getParent()) as any;
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
    }

    if (this.getParent && !ignoreParent && isString(selector)) {
      parent = (await this.getParent()) as any;
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
        this._driverElement = (await (shouldUserDocumentRoot ? this._driver : parent).locator(getElementArgs).all())[0];
      }
    } else if (isFunction(getElementArgs[0]) || isAsyncFunction(getElementArgs[0])) {
      const [queryFn, quertFnArgs] = buildBy(selector, this.getExecuteScriptArgs, this._driverElement, false);
      const resolved = [];
      const callArgs = toArray(quertFnArgs);

      for (const item of callArgs) {
        // TODO refactor resolver
        const resolvedItem = await item;
        resolved.push(resolvedItem?.elementHandle ? await resolvedItem.elementHandle() : resolvedItem);
      }

      const result: ElementHandle = (
        await this._driver.evaluateHandle(queryFn, resolved.length === 1 ? resolved[0] : resolved)
      ).asElement();

      let tempLocatorDataAttribute = `${getRandomString(25, { letters: true })}`;

      const locatoDataAttribute = await result.evaluate((n, item) => {
        // @ts-ignore
        if (n.dataset.promod_element_item) {
          // @ts-ignore
          return n.dataset.promod_element_item;
        } else {
          // @ts-ignore
          n.dataset.promod_element_item = `${item}`;
        }

        // @ts-ignore
        return n.dataset.promod_element_item;
      }, tempLocatorDataAttribute);

      await result.dispose();

      for (const resolvedItem of resolved) {
        if (resolvedItem?.dispose) {
          await resolvedItem.dispose();
        }
      }

      this._driverElement = (
        await this._driver.locator(`[data-promod_element_item="${locatoDataAttribute}"]`).all()
      )[0];
    } else {
      this._driverElement = (await this._driver.locator(getElementArgs).all())[0];
    }

    return this._driverElement;
  }

  /**
   * @example
   * const button = $('button');
   *
   * @param {string|Function} selector
   * @param {any[]} rest
   * @returns {PromodElementType}
   */
  $(selector, ...rest: any[]): PromodElementType {
    promodLogger.engineLog('[PW] Create new promod child element, selector: ', selector);
    const [, executeScriptArgsGetter] = getInitElementRest(selector, null, ...rest);
    const childElement = new PromodPlaywrightElement(
      selector,
      this._browserInterface,
      this.getElement.bind(this),
      executeScriptArgsGetter,
    );
    childElement.parentSelector = this.selector;
    return childElement as any;
  }

  /**
   * @example
   * const buttons = $$('button');
   *
   * @param {string|Function} selector
   * @param {any[]} rest
   * @returns {PromodElementsType}
   */
  $$(selector, ...rest: any[]): PromodElementsType {
    promodLogger.engineLog('[PW] Create new promod child elements, selector: ', selector);
    const [, executeScriptArgsGetter] = getInitElementRest(selector, null, ...rest);
    const childElements = new PromodPlaywrightElements(
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
   * await button.doubleClick();
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
   * @returns {Promise<void>}
   */
  async doubleClick(
    opts: {
      withScroll?: boolean;
      button?: 'left' | 'right' | 'middle';
      delay?: number;
      force?: boolean;
      modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;
      noWaitAfter?: boolean;
      position?: { x: number; y: number };
      allowForceIfIntercepted?: boolean;
      timeout?: number;
      trial?: boolean;
    } = { timeout: 500 },
  ) {
    promodLogger.engineLog(`[PW] Promod element interface calls method "click" from wrapped API, args: `, opts);
    if (!isObject(opts) && !isUndefined(opts)) {
      throw new TypeError(`click(); accepts only object type ${getType(opts)}`);
    }
    const { withScroll, allowForceIfIntercepted, ...pwOpts } = opts;
    await this.getElement();

    if (withScroll) {
      await this.scrollIntoView('center');
    }

    if (pwOpts.force) {
      return await this._driverElement.dblclick({ ...pwOpts, force: true });
    }

    let scrollableClickResult = await this._driverElement.dblclick(pwOpts).catch((err) => err);

    if (scrollableClickResult) {
      const { isReadyToForce } = await this.isInteractionIntercepted(scrollableClickResult);
      if (isReadyToForce && allowForceIfIntercepted) {
        return await this._driverElement.dblclick({ ...pwOpts, force: true });
      }
    }

    if (scrollableClickResult) {
      throw scrollableClickResult;
    }
  }

  /**
   * @example
   * const button = $('button');
   * await button.click();
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
   * @returns {Promise<void>}
   */
  async click(
    opts: {
      withScroll?: boolean;
      button?: 'left' | 'right' | 'middle';
      clickCount?: number;
      delay?: number;
      force?: boolean;
      modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;
      noWaitAfter?: boolean;
      position?: { x: number; y: number };
      allowForceIfIntercepted?: boolean;
      timeout?: number;
      trial?: boolean;
    } = { clickCount: 1, timeout: 500 },
  ) {
    promodLogger.engineLog(`[PW] Promod element interface calls method "click" from wrapped API, args: `, opts);
    if (!isObject(opts) && !isUndefined(opts)) {
      throw new TypeError(`click(); accepts only object type ${getType(opts)}`);
    }
    const { withScroll, allowForceIfIntercepted, ...pwOpts } = opts;
    await this.getElement();

    if (withScroll) {
      await this.scrollIntoView('center');
    }

    if (pwOpts.force) {
      return await this._driverElement.click({ ...pwOpts, force: true });
    }

    let scrollableClickResult = await this._driverElement.click(pwOpts).catch((err) => err);

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

  /**
   *
   * @example
   * const button = $('button');
   * const tag = await button.getTagName();
   *
   * @returns {Promise<string>}
   */
  async getTagName() {
    promodLogger.engineLog(`[PW] Promod element interface calls method "getTagName" from wrapped API`);
    await this.getElement();
    return await this._driverElement.evaluate((item) => item.nodeName.toLowerCase());
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
   * @example works with Enter, need improve for another Keys
   *
   * @param value
   */
  async sendKeys(value: string | number, asFill?: boolean) {
    promodLogger.engineLog(`[PW] Promod element interface calls method "sendKeys" from wrapped API, args: `, value);
    if (!isString(value) && !isNumber(value)) {
      throw new TypeError(`sendKeys(); accepts only string or number value type ${getType(value)}`);
    }
    await this.getElement();

    if (asFill) {
      return this._driverElement.fill(value.toString());
    }

    const stringValue = value.toString();
    const seleniumKeysAlignment = Object.values(KeysSWD);

    for (const char of stringValue.split('')) {
      if (seleniumKeysAlignment.includes(char)) {
        // TODO - this needs to be done in a better way
        await this.click();
        await browser.keyDownAndUp(Object.keys(KeysSWD).find((k) => KeysSWD[k] === char));
      } else {
        await this._driverElement.pressSequentially(char, { delay: 7 });
      }
    }
  }

  /**
   * @example
   * const button = $('button');
   * await button.hover();
   *
   * @param {object} [opts] clickOpts
   * @param {boolean} [opts.force] force
   * @param {Array<'Alt' | 'Control' | 'Meta' | 'Shift'>} [opts.modifiers] modifiers
   * @param {boolean} [opts.noWaitAfter] noWaitAfter
   * @param {{ x: number; y: number }} [opts.position] position
   * @param {number} [opts.timeout] timeout
   * @param {boolean} [opts.trial] trial
   * @returns {Promise<void>}
   */
  async hover(
    opts: {
      force?: boolean;
      modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;
      noWaitAfter?: boolean;
      position?: { x: number; y: number };
      timeout?: number;
      trial?: boolean;
    } = { force: true, timeout: 500 },
  ) {
    promodLogger.engineLog(`[PW] Promod element interface calls method "hover" from wrapped API`);
    await this.getElement();
    await this._driverElement.hover(opts);
  }

  /**
   * @example
   * const button = $('button')
   * await button.clickByElementCoordinate('center-top')
   *
   * @param {string} position
   * @returns {Promise<void>}
   */
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

    await (await browser['getCurrentPage']()).mouse.click(x, y);
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
      `Promod element interface calls method "clickByElementCoordinate" from wrapped API, args: `,
      position,
    );
    await this.getElement();
    const { x, y, width, height } = await this._driverElement.evaluate((el) => el.getBoundingClientRect());

    return getPositionXY(position, { x, y, width, height });
  }

  async focus() {
    promodLogger.engineLog(`[PW] Promod element interface calls method "focus" from wrapped API`);
    await this.getElement();
    await this._driverElement.focus();
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
  async pressEnter(focus: boolean = true) {
    promodLogger.engineLog(`[PW] Promod element interface calls method "pressEnter" from wrapped API, args: `, focus);
    await this.getElement();
    if (focus) {
      await this._driverElement.focus();
    }
    await this._driver.keyboard.press('Enter');
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
  async clearViaBackspace(repeat: number = 1, focus = true) {
    promodLogger.engineLog(
      `Promod element interface calls method "clearViaBackspace" from wrapped API, args: `,
      repeat,
      focus,
    );
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
      const opts = await this._driverElement.locator('option').all();
      for (const opt of opts) {
        const content = (await opt.textContent()).trim();
        // @ts-ignore
        const res = strictTextOptionEqual ? content === value.trim() : content.includes(value);
        if (res) {
          return this._driverElement.selectOption(content);
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
    return await this._driverElement.innerText();
  }

  /**
   * @returns {Promise<Buffer>}
   */
  async takeScreenshot() {
    await this.getElement();
    return await this._driverElement.screenshot();
  }

  /**
   *
   * @param {'end' | 'start' | 'center' | 'nearest'} [position] scroll position
   * @returns {Promise<void>}
   */
  async scrollIntoView(position?: 'end' | 'start' | 'center' | 'nearest') {
    await this.getElement();
    await browser.executeScript(
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

  async getEngineElement() {
    await this.getElement();
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
      .catch((error) => {
        promodLogger.engineLog(
          `Promod element interface gets error after method "isDisplayed" from wrapped API, error: `,
          error,
        );

        return false;
      });
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

  private async isInteractionIntercepted(err) {
    const strErr: string = err.toString();

    return {
      isReadyToForce: strErr.includes('element is visible, enabled and stable'),
    };
  }
}

function getInitElementRest(
  selector: string | TCustomSelector | ((...args: any[]) => any) | Promise<any>,
  root?: PromodElementType,
  ...rest: any[]
) {
  let getParent = null;
  let getExecuteScriptArgs = null;

  if (isFunction(selector) || isPromise(selector)) {
    getExecuteScriptArgs = function getExecuteScriptArgs() {
      const localRest = rest.map((item) => (item && item.getEngineElement ? item.getEngineElement() : item));
      const rootPromiseIfRequired = root && root.getEngineElement ? root.getEngineElement() : root;
      if (rootPromiseIfRequired) {
        return [rootPromiseIfRequired, ...localRest];
      }
      return localRest;
    };
  } else if (root && root instanceof PromodPlaywrightElement) {
    getParent = function getParent() {
      return root;
    };
  }

  return [getParent, getExecuteScriptArgs];
}

const $ = (
  selector: string | TCustomSelector | ((...args: any[]) => any) | Promise<any>,
  root?: PromodElementType | any,
  ...rest: any[]
): PromodElementType => {
  const restArgs = getInitElementRest(selector, root, ...rest);

  return new PromodPlaywrightElement(selector, browser, ...restArgs) as any;
};

const $$ = (
  selector: string | TCustomSelector | ((...args: any[]) => any) | Promise<any>,
  root?: PromodElementType | any,
  ...rest: any[]
): PromodElementsType => {
  const restArgs = getInitElementRest(selector, root, ...rest);

  return new PromodPlaywrightElements(selector, browser, ...restArgs) as any;
};

function preBindBrowserInstance(browserThaNeedsToBeBinded) {
  const $ = (
    selector: string | TCustomSelector | ((...args: any[]) => any) | Promise<any>,
    root?: PromodElementType | any,
    ...rest: any[]
  ): PromodElementType => {
    const restArgs = getInitElementRest(selector, root, ...rest);

    return new PromodPlaywrightElement(selector, browserThaNeedsToBeBinded, ...restArgs) as any;
  };

  const $$ = (
    selector: string | TCustomSelector | ((...args: any[]) => any) | Promise<any>,
    root?: PromodElementType | any,
    ...rest: any[]
  ): PromodElementsType => {
    const restArgs = getInitElementRest(selector, root, ...rest);

    return new PromodPlaywrightElements(selector, browserThaNeedsToBeBinded, ...restArgs) as any;
  };

  return {
    $,
    $$,
    browser: browserThaNeedsToBeBinded,
  };
}

export { $, $$, PromodPlaywrightElement, PromodPlaywrightElements, preBindBrowserInstance };
