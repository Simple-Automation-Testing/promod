/* eslint-disable max-len */
import { safeHasOwnPropery, isString, isFunction, isPromise, isObject, lengthToIndexesArray } from 'sat-utils';
import { By, WebElement, WebDriver, Key } from 'selenium-webdriver';
import { browser } from './swd_client';
import { buildBy } from './swd_alignment';
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

  last(): PromodElementType {
    return this.get(-1) as any;
  }

  first(): PromodElementType {
    return this.get(0) as any;
  }

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

    if (index === -1) {
      return this._driverElements[this._driverElements.length - 1];
    }

    return this._driverElements[index];
  }

  async getIds() {
    await this.getElement();
    // @ts-ignore
    return this._driverElements.map((item) => item.id_);
  }

  /** @private */
  private async getEngineElements() {
    await this.getElement(0);

    return this._driverElements;
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

  async hover() {
    await browser
      .currentClient()
      .actions()
      .move({ origin: await this.getEngineElement() })
      .perform();
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
      `
      let position = true;

      const scrollBlock = ['end', 'start', 'center', 'nearest']
      if(scrollBlock.includes(arguments[1])) {
        position = {block: arguments[1]}
      }
      arguments[0].scrollIntoView(position)
    `,
      this.getEngineElement(),
      position,
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
   * @returns {Promise<boolean>} button is present
   * @example
   * const button = $('button')
   * const buttonIsDisplayed = await button.isDisplayed();
   */
  async isDisplayed() {
    return this.getElement()
      .then(() => this._driverElement.isDisplayed())
      .catch(() => false);
  }

  async clearViaBackspace(repeat: number = 1) {
    await this.getElement();
    await this._driverElement.click();
    for (const _act of lengthToIndexesArray(repeat)) {
      await this._driverElement.sendKeys(Key.BACK_SPACE);
    }
  }

  async pressEnter() {
    await this.getElement();
    await this._driverElement.click();
    await this._driverElement.sendKeys(Key.ENTER);
  }

  // select specific
  async selectOption(
    optValue:
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
  ) {
    await this.getElement();
    // open options list
    await this.click();

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

    // return this._driverElement.sendKeys(value);
  }

  /**
   * @returns {Promise<boolean>} button is present
   * @example
   * const button = $('button')
   * const buttonIsPresent = await button.isPresent();
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

  private isInteractionIntercepted(err) {
    return err.toString().includes('element click intercepted');
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
