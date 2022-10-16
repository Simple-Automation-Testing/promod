/* eslint-disable max-len */
import { isString, isFunction, isPromise } from 'sat-utils';
import { By, WebElement, WebDriver } from 'selenium-webdriver';
import { browser } from './swd_client';

import type { PromodElementType, PromodElementsType } from '../interface';

function toSeleniumProtocolElement(webElId) {
  const elementObj = {
    'element-6066-11e4-a52e-4f735466cecf': webElId,
    ELEMENT: webElId,
  };
  return elementObj;
}

const buildBy = (selector: string | By, getExecuteScriptArgs?: () => any[]): any => {
  if (selector instanceof By) {
    return selector;
  }

  getExecuteScriptArgs = isFunction(getExecuteScriptArgs) ? getExecuteScriptArgs : () => [];

  if (isString(selector) && (selector as string).includes('xpath=')) {
    return By.xpath((selector as string).replace('xpath=', ''));
    /**
     * @depreacted
     */
  } else if (isString(selector) && (selector as string).includes('js=')) {
    /**
     * @depreacted
     */
    return By.js((selector as string).replace('js=', ''), ...getExecuteScriptArgs());
  } else if (isPromise(selector)) {
    return selector;
  } else if (isFunction(selector)) {
    return By.js(selector, getExecuteScriptArgs());
  }

  return By.css(selector);
};

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
  private seleniumDriver: WebDriver;
  private selector: string;
  private wdElements: WebElement[];
  private getParent: () => Promise<PromodSeleniumElement & WebElement>;
  private getExecuteScriptArgs: () => any;
  public parentSelector: string;

  constructor(selector, client, getParent?, getExecuteScriptArgs?) {
    this.seleniumDriver = client;
    this.selector = selector;
    this.getParent = getParent;
    this.getExecuteScriptArgs = getExecuteScriptArgs;
  }

  setseleniumDriver(client: WebDriver) {
    this.seleniumDriver = client;
  }

  get(index): PromodElementType {
    const childElement = new PromodSeleniumElement(
      this.selector,
      this.seleniumDriver,
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
    this.seleniumDriver = browser.currentClient();

    if (this.getParent) {
      let parent = await this.getParent();

      if (parent.getEngineElement) {
        // @ts-ignore
        parent = await parent.getEngineElement();
      }

      this.wdElements = await parent.findElements(buildBy(this.selector, this.getExecuteScriptArgs));
    } else {
      this.wdElements = await this.seleniumDriver.findElements(buildBy(this.selector, this.getExecuteScriptArgs));
    }

    if (index === -1) {
      return this.wdElements[this.wdElements.length - 1];
    }

    return this.wdElements[index];
  }

  async getIds() {
    await this.getElement();
    // @ts-ignore
    return this.wdElements.map((item) => item.id_);
  }

  async getSeleniumProtocolElementObj() {
    const ids = await this.getIds();

    return ids.map(toSeleniumProtocolElement);
  }

  async each(cb: (item: PromodElementType, index?: number) => Promise<void>): Promise<any> {
    await this.getElement(0);

    for (let i = 0; i < this.wdElements.length; i++) {
      await cb(this.get(i), i);
    }
  }

  async count(): Promise<number> {
    return this.getElement()
      .then(() => this.wdElements.length)
      .catch(() => 0);
  }
}

class PromodSeleniumElement {
  private seleniumDriver: WebDriver;
  private selector: string;
  private wdElement: WebElement;
  private getParent: () => Promise<PromodElementType>;
  private getExecuteScriptArgs: () => any;
  private useParent: boolean;
  public parentSelector: string;

  constructor(selector, client, getParent?, getExecuteScriptArgs?, useParent?) {
    this.seleniumDriver = client;
    this.selector = selector;
    this.getParent = getParent;
    this.getExecuteScriptArgs = getExecuteScriptArgs;
    this.useParent = useParent;

    const self = this;

    SELENIUM_API_METHODS.forEach(function (methodName) {
      self[methodName] = (...args: any[]) => {
        const action = () => self.wdElement[methodName].call(self.wdElement, ...args);

        return self.callElementAction(action);
      };
    });
  }

  setseleniumDriver(client: WebDriver) {
    this.seleniumDriver = client;
  }

  $(selector): PromodElementType {
    const childElement = new PromodSeleniumElement(selector, this.seleniumDriver, this.getElement.bind(this));
    childElement.parentSelector = this.selector;
    return childElement as any;
  }

  $$(selector): PromodElementsType {
    const childElements = new PromodSeleniumElements(selector, this.seleniumDriver, this.getElement.bind(this));
    childElements.parentSelector = this.selector;
    return childElements as any;
  }

  async getSeleniumProtocolElementObj() {
    const id = await this.getId();

    return toSeleniumProtocolElement(id);
  }

  /**
   * @param {boolean} [withScroll] try to prevent intercept error by scoll to bottom/to
   * @returns {Promise<void>}
   */
  async click(withScroll?: boolean) {
    await this.getElement();
    if (withScroll) {
      const scrollableClickResult = await this.wdElement
        .click()
        .catch((err) =>
          this.isInteractionIntercepted(err) ? this.scrollIntoView('center').then(() => this.wdElement.click()) : err,
        )
        .catch((err) =>
          this.isInteractionIntercepted(err) ? this.scrollIntoView('start').then(() => this.wdElement.click()) : err,
        )
        .catch((err) =>
          this.isInteractionIntercepted(err) ? this.scrollIntoView('end').then(() => this.wdElement.click()) : err,
        )
        .then((err) => err)
        .catch((err) => err);

      if (scrollableClickResult) {
        throw scrollableClickResult;
      }
    } else {
      return this.wdElement.click();
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
    await this.seleniumDriver.executeScript(
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
    this.seleniumDriver = browser.currentClient();
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
        this.wdElement = parent;
      } else {
        this.wdElement = await parent.findElement(buildBy(this.selector, this.getExecuteScriptArgs));
      }
    } else {
      this.wdElement = await this.seleniumDriver.findElement(buildBy(this.selector, this.getExecuteScriptArgs));
    }

    return this.wdElement;
  }

  /**
   * @returns {Promise<boolean>} button is present
   * @example
   * const button = $('button')
   * const buttonIsDisplayed = await button.isDisplayed();
   */
  async isDisplayed() {
    return this.getElement()
      .then(() => this.wdElement.isDisplayed())
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
    return this.wdElement.id_;
  }

  async getEngineElement() {
    await this.getElement();

    return this.wdElement;
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
