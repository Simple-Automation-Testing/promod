import {isBoolean} from 'sat-utils';
import {By, WebElement, WebDriver} from 'selenium-webdriver';
import {browser} from './swd_client';

function toSeleniumProtocolElement(webElId) {
	const elementObj = {
		'element-6066-11e4-a52e-4f735466cecf': webElId,
		ELEMENT: webElId,
	};
	return elementObj;
}

const buildBy = (selector: string | By): any => {
	if (selector instanceof By) {
		return selector;
	}

	if ((selector as string).includes('xpath=')) {
		return By.xpath((selector as string).replace('xpath=', ''));
	} if ((selector as string).includes('js=')) {
		return By.js((selector as string).replace('js=', ''));
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
	public parentSelector: string;

	constructor(selector, client, getParent?) {
		this.seleniumDriver = client;
		this.selector = selector;
		this.getParent = getParent;
	}

	setseleniumDriver(client: WebDriver) {
		this.seleniumDriver = client;
	}

	get(index): PromodSeleniumElementType {
		const childElement = new PromodSeleniumElement(this.selector, this.seleniumDriver, this.getElement.bind(this, index), true);
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

			this.wdElements = await parent.findElements(buildBy(this.selector));
		} else {
			this.wdElements = await this.seleniumDriver.findElements(buildBy(this.selector));
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


	async each(cb: (item: PromodSeleniumElementType) => Promise<void>): Promise<any> {
		await this.getElement(0);

		for (const el of this.wdElements) {
			await cb(new PromodSeleniumElement(this.selector, this.seleniumDriver, () => el, true) as any);
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
	private useParent: boolean;
	public parentSelector: string;

	constructor(selector, client, getParent?, useParent?) {
		this.seleniumDriver = client;
		this.selector = selector;
		this.getParent = getParent;
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
				this.wdElement = await parent.findElement(buildBy(this.selector));
			}

		} else {
			this.wdElement = await this.seleniumDriver.findElement(buildBy(this.selector));
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
		return this.getElement().then(() => true).catch(() => false);
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

const $ = (selector: string | By, root?: PromodSeleniumElementType): PromodSeleniumElementType => {
	let getParent = null;
	if (root) {
		getParent = () => {
			return root;
		};
	}

	return new PromodSeleniumElement(selector, null, getParent) as any;
};


const $$ = (selector: string | By, root?: PromodSeleniumElementType): PromodSeleniumElementsType => {
	let getParent = null;
	if (root) {
		getParent = () => {
			return root;
		};
	}

	return new PromodSeleniumElements(selector, null, getParent) as any;
};

export {$, $$, PromodSeleniumElement, PromodSeleniumElements, By};
