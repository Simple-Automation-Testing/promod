"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromodElements = exports.PromodElement = exports.$$ = exports.$ = void 0;
/* eslint-disable max-len */
const sat_utils_1 = require("sat-utils");
const pw_client_1 = require("./pw_client");
const buildBy = (selector, getExecuteScriptArgs) => {
    getExecuteScriptArgs = (0, sat_utils_1.isFunction)(getExecuteScriptArgs) ? getExecuteScriptArgs : () => [];
    if ((0, sat_utils_1.isString)(selector) && selector.includes('xpath=')) {
        return selector.replace('xpath=', '');
    }
    else if ((0, sat_utils_1.isString)(selector) && selector.includes('js=')) {
        return [selector.replace('js=', ''), ...getExecuteScriptArgs()];
    }
    else if ((0, sat_utils_1.isPromise)(selector)) {
        return selector;
    }
    else if ((0, sat_utils_1.isFunction)(selector)) {
        return [selector, getExecuteScriptArgs()];
    }
    return selector;
};
class PromodElements {
    constructor(selector, client, getParent, getExecuteScriptArgs) {
        this._driver = client;
        this.selector = selector;
        this.getParent = getParent;
        this.getExecuteScriptArgs = getExecuteScriptArgs;
    }
    set_driver(client) {
        this._driver = client;
    }
    get(index) {
        const childElement = new PromodElement(this.selector, this._driver, this.getElement.bind(this, index), null, true);
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
        this._driver = await pw_client_1.browser.getCurrentPage();
        if (this.getParent) {
            let parent = await this.getParent();
            // @ts-ignore
            if (parent.getEngineElement) {
                // @ts-ignore
                parent = await parent.getEngineElement();
            }
            // TODO improve this solution
            this._driverElements = (await parent.$$(buildBy(this.selector, this.getExecuteScriptArgs)));
        }
        else {
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
    async each(cb) {
        await this.getElement(0);
        for (let i = 0; i < this._driverElements.length; i++) {
            await cb(this.get(i), i);
        }
    }
    async count() {
        return this.getElement()
            .then(() => this._driverElements.length)
            .catch(() => 0);
    }
}
exports.PromodElements = PromodElements;
class PromodElement {
    constructor(selector, client, getParent, getExecuteScriptArgs, useParent) {
        this._driver = client;
        this.selector = selector;
        this.getParent = getParent;
        this.getExecuteScriptArgs = getExecuteScriptArgs;
        this.useParent = useParent;
    }
    set_driver(client) {
        this._driver = client;
    }
    $(selector) {
        const childElement = new PromodElement(selector, this._driver, this.getElement.bind(this));
        childElement.parentSelector = this.selector;
        return childElement;
    }
    $$(selector) {
        const childElements = new PromodElements(selector, this._driver, this.getElement.bind(this));
        childElements.parentSelector = this.selector;
        return childElements;
    }
    /**
     * @param {boolean} [withScroll] try to prevent intercept error by scoll to bottom/to
     * @returns {Promise<void>}
     */
    async click(withScroll) {
        await this.getElement();
        if (withScroll) {
            const scrollableClickResult = await this._driverElement
                .click()
                .catch((err) => this.isInteractionIntercepted(err)
                ? this.scrollIntoView('center').then(() => this._driverElement.click())
                : err)
                .catch((err) => this.isInteractionIntercepted(err)
                ? this.scrollIntoView('start').then(() => this._driverElement.click())
                : err)
                .catch((err) => this.isInteractionIntercepted(err) ? this.scrollIntoView('end').then(() => this._driverElement.click()) : err)
                .then((err) => err)
                .catch((err) => err);
            if (scrollableClickResult) {
                throw scrollableClickResult;
            }
        }
        else {
            return this._driverElement.click();
        }
    }
    // TODO implement
    async getTagName() { }
    async getCssValue() { }
    async getAttribute() { }
    async getRect() { }
    async isEnabled() { }
    async isSelected() { }
    async getLocation() { }
    async sendKeys(value) {
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
    async scrollIntoView(position) {
        await this.getElement();
        await this._driver.evaluateHandle((arg) => {
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
        }, [await this.getEngineElement(), position]);
    }
    async getEngineElement() {
        await this.getElement();
        return this._driverElement;
    }
    async getElement() {
        this._driver = await pw_client_1.browser.getCurrentPage();
        const getElementArgs = buildBy(this.selector, this.getExecuteScriptArgs);
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
                this._driverElement = parent;
            }
            else {
                this._driverElement = await parent.$(getElementArgs);
            }
        }
        else if ((0, sat_utils_1.isFunction)(getElementArgs[0]) || (0, sat_utils_1.isAsyncFunction)(getElementArgs[0])) {
            this._driverElement = await this._driver.evaluateHandle(getElementArgs[0], getElementArgs[1]);
        }
        else {
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
exports.PromodElement = PromodElement;
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
    else if (root && root instanceof PromodElement) {
        getParent = function getParent() {
            return root;
        };
    }
    return [getParent, getExecuteScriptArgs];
}
const $ = (selector, root, ...rest) => {
    const restArgs = getInitElementRest(selector, root, ...rest);
    return new PromodElement(selector, null, ...restArgs);
};
exports.$ = $;
const $$ = (selector, root, ...rest) => {
    const restArgs = getInitElementRest(selector, root, ...rest);
    return new PromodElements(selector, null, ...restArgs);
};
exports.$$ = $$;
//# sourceMappingURL=pw_element.js.map