"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.By = exports.PromodSeleniumElements = exports.PromodSeleniumElement = exports.$$ = exports.$ = void 0;
/* eslint-disable max-len */
const sat_utils_1 = require("sat-utils");
const selenium_webdriver_1 = require("selenium-webdriver");
Object.defineProperty(exports, "By", { enumerable: true, get: function () { return selenium_webdriver_1.By; } });
const swd_client_1 = require("./swd_client");
function toSeleniumProtocolElement(webElId) {
    const elementObj = {
        'element-6066-11e4-a52e-4f735466cecf': webElId,
        ELEMENT: webElId,
    };
    return elementObj;
}
const buildBy = (selector, getExecuteScriptArgs) => {
    if (selector instanceof selenium_webdriver_1.By) {
        return selector;
    }
    getExecuteScriptArgs = (0, sat_utils_1.isFunction)(getExecuteScriptArgs) ? getExecuteScriptArgs : () => [];
    if ((0, sat_utils_1.isString)(selector) && selector.includes('xpath=')) {
        return selenium_webdriver_1.By.xpath(selector.replace('xpath=', ''));
    }
    else if ((0, sat_utils_1.isString)(selector) && selector.includes('js=')) {
        return selenium_webdriver_1.By.js(selector.replace('js=', ''), ...getExecuteScriptArgs());
    }
    else if ((0, sat_utils_1.isPromise)(selector)) {
        return selector;
    }
    else if ((0, sat_utils_1.isFunction)(selector)) {
        return selenium_webdriver_1.By.js(selector, ...getExecuteScriptArgs());
    }
    return selenium_webdriver_1.By.css(selector);
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
    constructor(selector, client, getParent, getExecuteScriptArgs) {
        this.seleniumDriver = client;
        this.selector = selector;
        this.getParent = getParent;
        this.getExecuteScriptArgs = getExecuteScriptArgs;
    }
    setseleniumDriver(client) {
        this.seleniumDriver = client;
    }
    get(index) {
        const childElement = new PromodSeleniumElement(this.selector, this.seleniumDriver, this.getElement.bind(this, index), null, true);
        if (this.parentSelector) {
            childElement.parentSelector = this.parentSelector || this.selector;
        }
        return childElement;
    }
    last() {
        return this.get(-1);
    }
    first() {
        return this.get(0);
    }
    async getElement(index) {
        this.seleniumDriver = swd_client_1.browser.currentClient();
        if (this.getParent) {
            let parent = await this.getParent();
            if (parent.getEngineElement) {
                // @ts-ignore
                parent = await parent.getEngineElement();
            }
            this.wdElements = await parent.findElements(buildBy(this.selector, this.getExecuteScriptArgs));
        }
        else {
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
    async each(cb) {
        await this.getElement(0);
        for (let i = 0; i < this.wdElements.length; i++) {
            await cb(this.get(i), i);
        }
    }
    async count() {
        return this.getElement()
            .then(() => this.wdElements.length)
            .catch(() => 0);
    }
}
exports.PromodSeleniumElements = PromodSeleniumElements;
class PromodSeleniumElement {
    constructor(selector, client, getParent, getExecuteScriptArgs, useParent) {
        this.seleniumDriver = client;
        this.selector = selector;
        this.getParent = getParent;
        this.getExecuteScriptArgs = getExecuteScriptArgs;
        this.useParent = useParent;
        const self = this;
        SELENIUM_API_METHODS.forEach(function (methodName) {
            self[methodName] = (...args) => {
                const action = () => self.wdElement[methodName].call(self.wdElement, ...args);
                return self.callElementAction(action);
            };
        });
    }
    setseleniumDriver(client) {
        this.seleniumDriver = client;
    }
    $(selector) {
        const childElement = new PromodSeleniumElement(selector, this.seleniumDriver, this.getElement.bind(this));
        childElement.parentSelector = this.selector;
        return childElement;
    }
    $$(selector) {
        const childElements = new PromodSeleniumElements(selector, this.seleniumDriver, this.getElement.bind(this));
        childElements.parentSelector = this.selector;
        return childElements;
    }
    async getSeleniumProtocolElementObj() {
        const id = await this.getId();
        return toSeleniumProtocolElement(id);
    }
    /**
     * @param {boolean} [withScroll] try to prevent intercept error by scoll to bottom/to
     * @returns {Promise<void>}
     */
    async click(withScroll) {
        await this.getElement();
        if (withScroll) {
            const scrollableClickResult = await this.wdElement
                .click()
                .catch((err) => this.isInteractionIntercepted(err) ? this.scrollIntoView('center').then(() => this.wdElement.click()) : err)
                .catch((err) => this.isInteractionIntercepted(err) ? this.scrollIntoView('start').then(() => this.wdElement.click()) : err)
                .catch((err) => this.isInteractionIntercepted(err) ? this.scrollIntoView('end').then(() => this.wdElement.click()) : err)
                .then((err) => err)
                .catch((err) => err);
            if (scrollableClickResult) {
                throw scrollableClickResult;
            }
        }
        else {
            return this.wdElement.click();
        }
    }
    async hover() {
        await swd_client_1.browser
            .currentClient()
            .actions()
            .move({ origin: await this.getEngineElement() })
            .perform();
    }
    async focus() {
        await swd_client_1.browser
            .currentClient()
            .actions()
            .move({ origin: await this.getEngineElement() })
            .press()
            .perform();
    }
    async scrollIntoView(position) {
        await this.getElement();
        await this.seleniumDriver.executeScript(`
      let position = true;

      const scrollBlock = ['end', 'start', 'center', 'nearest']
      if(scrollBlock.includes(arguments[1])) {
        position = {block: arguments[1]}
      }
      arguments[0].scrollIntoView(position)
    `, this.getEngineElement(), position);
    }
    async getElement() {
        this.seleniumDriver = swd_client_1.browser.currentClient();
        if (this.getParent) {
            let parent = (await this.getParent());
            if (!parent) {
                throw new Error(this.useParent
                    ? `Any element with selector ${this.selector} was not found`
                    : `Parent element with selector ${this.parentSelector} was not found`);
            }
            if (parent.getEngineElement) {
                parent = await parent.getEngineElement();
            }
            if (this.useParent) {
                this.wdElement = parent;
            }
            else {
                this.wdElement = await parent.findElement(buildBy(this.selector, this.getExecuteScriptArgs));
            }
        }
        else {
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
    async callElementAction(action) {
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
    isInteractionIntercepted(err) {
        return err.toString().includes('element click intercepted');
    }
}
exports.PromodSeleniumElement = PromodSeleniumElement;
function getInitElementRest(selector, root, ...rest) {
    let getParent = null;
    let getExecuteScriptArgs = null;
    /**
     * @info
     * in case if selector is string with "js=" marker or selector is a function
     */
    if (((0, sat_utils_1.isString)(selector) && selector.indexOf('js=') === 0) ||
        (0, sat_utils_1.isFunction)(selector) ||
        (0, sat_utils_1.isPromise)(selector)) {
        getExecuteScriptArgs = function getExecuteScriptArgs() {
            const localRest = rest.map((item) => (item && item.getEngineElement ? item.getEngineElement() : item));
            const rootPromiseIfRequired = root && root.getEngineElement ? root.getEngineElement() : root;
            return [rootPromiseIfRequired, ...localRest];
        };
    }
    else if (root && root instanceof PromodSeleniumElement) {
        getParent = function getParent() {
            return root;
        };
    }
    return [getParent, getExecuteScriptArgs];
}
const $ = (selector, root, ...rest) => {
    const restArgs = getInitElementRest(selector, root, ...rest);
    return new PromodSeleniumElement(selector, null, ...restArgs);
};
exports.$ = $;
const $$ = (selector, root, ...rest) => {
    const restArgs = getInitElementRest(selector, root, ...rest);
    return new PromodSeleniumElements(selector, null, ...restArgs);
};
exports.$$ = $$;
//# sourceMappingURL=swd_element.js.map