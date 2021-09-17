/* eslint-disable max-len */
import {isBoolean, isString, isFunction, isPromise} from 'sat-utils';
import {By, WebElement, WebDriver} from 'selenium-webdriver';
import {browser} from './swd_client';

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

	getExecuteScriptArgs = isFunction(getExecuteScriptArgs) ? getExecuteScriptArgs : () => ([]);

	if (isString(selector) && (selector as string).includes('xpath=')) {
		return By.xpath((selector as string).replace('xpath=', ''));
	} else if (isString(selector) && (selector as string).includes('js=')) {
		return By.js((selector as string).replace('js=', ''), ...getExecuteScriptArgs());
	} else if (isPromise(selector)) {
		return selector;
	} else if (isFunction(selector)) {
		return By.js(selector, ...getExecuteScriptArgs());
	}

	return By.css(selector);
};

const SELENIUM_API_METHODS = [
	'sendKeys', 'getTagName', 'getCssValue', 'getAttribute', 'getText', 'getRect',
	'isEnabled', 'isSelected', 'submit', 'clear', 'getId', 'takeScreenshot', 'getLocation',
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

	get(index): PromodSeleniumElementType {
		const childElement = new PromodSeleniumElement(this.selector, this.seleniumDriver, this.getElement.bind(this, index), null, true);
		if (this.parentSelector) {
			childElement.parentSelector = this.parentSelector || this.selector;
		}
		return childElement as any;
	}

	last(): PromodSeleniumElementType {
		return this.get(-1) as any;
	}

	first(): PromodSeleniumElementType {
		return this.get(0) as any;
	}

	private async getElement(index?) {
		this.seleniumDriver = browser.currentClient();

		if (this.getParent) {
			let parent = await this.getParent();

			if (parent.getWebDriverElement) {
				// @ts-ignore
				parent = await parent.getWebDriverElement();
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


	async each(cb: (item: PromodSeleniumElementType, index?: number) => Promise<void>): Promise<any> {
		await this.getElement(0);

		for (let i = 0; i < this.wdElements.length; i++) {
			await cb(new PromodSeleniumElement(this.selector, this.seleniumDriver, () => this.wdElements[i], null, true) as any, i);
		}
	}

	async count(): Promise<number> {
		await this.getElement(0);
		return this.wdElements.length;
	}
}

class PromodSeleniumElement {
	private seleniumDriver: WebDriver;
	private selector: string;
	private wdElement: WebElement;
	private getParent: () => Promise<PromodSeleniumElementType>;
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

		SELENIUM_API_METHODS.forEach(function(methodName) {
			self[methodName] = (...args: any[]) => {
				const action = () => self.wdElement[methodName].call(self.wdElement, ...args);

				return self.callElementAction(action);
			};
		});
	}

	setseleniumDriver(client) {
		this.seleniumDriver = client;
	}

	$(selector): PromodSeleniumElementType {
		const childElement = new PromodSeleniumElement(selector, this.seleniumDriver, this.getElement.bind(this));
		childElement.parentSelector = this.selector;
		return childElement as any;
	}

	$$(selector): PromodSeleniumElementsType {
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
			const scrollableClickResult = await this.wdElement.click()
				.catch((err) => (this.isInteractionIntercepted(err) ? this.scrollIntoView('end').then(() => this.wdElement.click()) : err))
				.catch((err) => (this.isInteractionIntercepted(err) ? this.scrollIntoView('start').then(() => this.wdElement.click()) : err))
				.then((err) => err)
				.catch((err) => err);

			if (scrollableClickResult) {
				throw scrollableClickResult;
			}
		} else {
			return this.wdElement.click();
		}
	}

	async scrollIntoView(position?: 'end' | 'start') {
		await this.getElement();
		await this.seleniumDriver.executeScript(`
      let position = true;
      if(arguments[1] ==='end') {
        position = {block: 'end'}
      } else if(arguments[1] ==='start') {
        position = {block: 'start'}
      }
      arguments[0].scrollIntoView(position)
    `, this.getWebDriverElement(), position);
	}

	async getElement() {
		this.seleniumDriver = browser.currentClient();
		if (this.getParent) {
			let parent = await this.getParent() as any;
			if (!parent) {
				throw new Error(
					this.useParent
						? `Any element with selector ${this.selector} was not found`
						: `Parent element with selector ${this.parentSelector} was not found`
				);
			}
			if (parent.getWebDriverElement) {
				parent = await parent.getWebDriverElement();
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
		const result = await this.getElement().catch(() => false);
		if (isBoolean(result) && !result) {
			return false;
		}
		return this.wdElement.isDisplayed().then((res) => res, () => false);
	}

	/**
	 * @returns {Promise<boolean>} button is present
	 * @example
	 * const button = $('button')
	 * const buttonIsPresent = await button.isPresent();
	 */
	async isPresent() {
		return this.getElement().then(() => true).catch((r) => false);
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

	async getWebDriverElement() {
		await this.getElement();

		return this.wdElement;
	}

	locator() {
		let locatorValue = '';
		if (this.parentSelector) {
			locatorValue += ` Parent: ${this.parentSelector} `;
		}
		return {value: `${locatorValue}${this.selector}`};
	}

	private isInteractionIntercepted(err) {
		return err.toString().includes('element click intercepted');
	}
}


function getInitElementRest(selector: string | By | ((...args: any[]) => any) | Promise<any>, root?: PromodSeleniumElementType, ...rest: any[]) {
	let getParent = null;
	let getExecuteScriptArgs = null;

	/**
	 * @info
	 * in case if selector is string with "js=" marker or selector is a function
	 */

	if ((isString(selector) && (selector as string).indexOf('js=') === 0) || isFunction(selector) || isPromise(selector)) {
		getExecuteScriptArgs = function getExecuteScriptArgs() {
			return [root, ...rest];
		};
	} else if (root && root instanceof PromodSeleniumElement) {
		getParent = function getParent() {
			return root;
		};
	}

	return [getParent, getExecuteScriptArgs];
}

const $ = (selector: string | By | ((...args: any[]) => any) | Promise<any>, root?: PromodSeleniumElementType | any, ...rest: any[]): PromodSeleniumElementType => {
	const restArgs = getInitElementRest(selector, root, ...rest);

	return new PromodSeleniumElement(selector, null, ...restArgs) as any;
};


const $$ = (selector: string | By | ((...args: any[]) => any) | Promise<any>, root?: PromodSeleniumElementType | any, ...rest: any[]): PromodSeleniumElementsType => {
	const restArgs = getInitElementRest(selector, root, ...rest);

	return new PromodSeleniumElements(selector, null, ...restArgs) as any;
};

export {$, $$, PromodSeleniumElement, PromodSeleniumElements, By};

export interface PromodSeleniumElementsType {
	wdElements: WebElement[];

	get(index: number): PromodSeleniumElementType;

	last(): PromodSeleniumElementType;

	first(): PromodSeleniumElementType;

	each(cb: (item: PromodSeleniumElementType, index?: number) => Promise<void>): Promise<void>;

	count(): Promise<number>;
}

export interface PromodSeleniumElementType {

	wdElement: WebElement;

	getId(): Promise<string>;

	click(withScroll?: boolean): Promise<void>;

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

	$(selector: string | By | ((...args: any[]) => any) | Promise<any>): PromodSeleniumElementType;
	$$(selector: string | By | ((...args: any[]) => any) | Promise<any>): PromodSeleniumElementsType;

	isEnabled(): Promise<boolean>;

	isSelected(): Promise<boolean>;

	isPresent(): Promise<boolean>;

	submit(): Promise<void>;

	clear(): Promise<void>;

	isDisplayed(): Promise<boolean>;

	takeScreenshot(opt_scroll?: boolean): Promise<string>;

	getWebDriverElement(): Promise<WebElement>;

	scrollIntoView(position?: boolean | string): Promise<void>;
}
