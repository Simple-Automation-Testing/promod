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
	'click', 'sendKeys', 'getTagName', 'getCssValue', 'getAttribute', 'getText', 'getRect',
	'isEnabled', 'isSelected', 'submit', 'clear', 'getId', 'takeScreenshot',
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
			childElement.parentSelector = this.parentSelector;
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
		if (!this.seleniumDriver) {
			this.seleniumDriver = browser.currentClient();
		}

		if (this.getParent) {
			let parent = await this.getParent();

			// @ts-ignore
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

	async getElement() {
		if (!this.seleniumDriver) {
			this.seleniumDriver = browser.currentClient();
		}

		if (this.getParent) {
			let parent = await this.getParent();

			if (parent.getWebDriverElement) {
				// @ts-ignore
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

	async isDisplayed() {
		const result = await this.getElement().catch(() => false);
		if (isBoolean(result) && !result) {
			return false;
		}
		return this.wdElement.isDisplayed().then((res) => res, () => false);
	}

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
}

export type PromodSeleniumElementType = PromodSeleniumElement & WebElement
export type PromodSeleniumElementsType = PromodSeleniumElements & WebElement


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
