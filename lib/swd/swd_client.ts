import {isArray, isPromise, waitForCondition, isNumber, isAsyncFunction, isString} from 'sat-utils';
import {WebDriver, Key} from 'selenium-webdriver';

function validateBrowserCallMethod(browserClass): Browser {
	const protKeys = Object.getOwnPropertyNames(browserClass.prototype).filter((item) => item !== 'constructor');
	for (const key of protKeys) {
		const descriptor = Object.getOwnPropertyDescriptor(browserClass.prototype, key);
		if (isAsyncFunction(descriptor.value)) {
			const originalMethod: (...args: any[]) => Promise<any> = descriptor.value;

			// eslint-disable-next-line no-inner-declarations
			async function decoratedWithChecker(...args) {
				if (!this.seleniumDriver) {
					throw new Error(`
${key}(): Seems like driver was not initialized, please check how or where did you call getSeleniumDriver function
or visit https://github.com/Simple-Automation-Testing/promod/blob/master/docs/init.md#getseleniumdriver
					`);
				}

				return originalMethod.call(this, ...args);
			}

			Object.defineProperty(decoratedWithChecker, 'name', {value: key});

			descriptor.value = decoratedWithChecker;
			Object.defineProperty(browserClass.prototype, key, descriptor);
		}
	}
	return new browserClass();
}


interface IBrowserTab {
	index?: number;
	expectedQuantity?: number;
	title?: string;
	timeout?: number;
}

class Browser {
	public wait = waitForCondition;
	public seleniumDriver: WebDriver;
	private appBaseUrl: string;
	private initialTab: any;
	private drivers: WebDriver[];
	private _createNewDriver: () => Promise<WebDriver>;

	constructor() {
		this.wait = waitForCondition;
	}

	currentClient() {
		return this.seleniumDriver;
	}

	async runNewBrowser() {
		if (!isArray(this.drivers)) {
			this.drivers = [];
		}
		this.drivers.push(this.seleniumDriver);
		if (!this._createNewDriver) {
			throw new Error('createNewDriver(): seems like create driver method was not inited');
		}

		const newDriver = await this._createNewDriver();
		this.drivers.push(newDriver);
		this.seleniumDriver = newDriver;
	}

	async switchToBrowser({index, tabTitle}: {index?: number; tabTitle?: string;} = {}) {
		if (isNumber(index) && isArray(this.drivers) && this.drivers.length > index) {
			this.seleniumDriver = this.drivers[index];
			return;
		} if (isString(tabTitle)) {
			for (const driver of this.drivers) {
				const result = await this.switchToBrowserTab({title: tabTitle}).then(() => true, () => false).catch(() => false);
				if (result) {
					this.seleniumDriver = driver;
					return;
				}
			}
		}

		throw new Error(`switchToBrowser(): required browser was not found`);
	}

	set setCreateNewDriver(driverCreator) {
		this._createNewDriver = driverCreator;
	}

	setClient(client) {
		this.seleniumDriver = client;
	}


	get Key() {
		return Key;
	}

	get baseUrl() {
		return this.appBaseUrl;
	}

	set baseUrl(url) {
		this.appBaseUrl = url;
	}

	public async returnToInitialTab() {
		// there was no switching in test
		if (!this.initialTab) {
			return;
		}
		await this.closeAllTabsExceptInitial();
		await this.switchTo().window(this.initialTab);
		// set initialTab to null for further "it" to use
		this.initialTab = null;
	}

	public async switchToTab(tabObject: IBrowserTab) {
		if (!this.initialTab) {
			this.initialTab = await this.getCurrentTab();
		}
		await this.switchToBrowserTab(tabObject);
	}

	private async closeAllTabsExceptInitial() {
		const handles = await this.getTabs();
		handles.splice(handles.indexOf(this.initialTab), 1);
		await this.makeActionAtEveryTab(async () => this.close(), handles);
	}

	public async makeActionAtEveryTab(action: (...args: any) => Promise<any>, handles?: string[]) {
		handles = handles || await this.getTabs();
		for (const windowHandle of handles) {
			await this.switchTo().window(windowHandle);
			await action();
		}
	}

	/**
	 * switchToBrowserTab
	 * @private
	 */
	private async switchToBrowserTab(tabObject: IBrowserTab) {
		const {index, expectedQuantity, title, timeout = 5000} = tabObject;
		let tabs = await this.getTabs();
		if (isNumber(expectedQuantity)) {
			await waitForCondition(async () => {
				tabs = await this.getTabs();
				return tabs.length === expectedQuantity;
			},
				{message: `Couldn't wait for ${expectedQuantity} tab(s) to appear. Probably you should pass expectedQuantity`, timeout}
			);
		}

		if (tabs.length > 1) {
			if (title) {
				await waitForCondition(async () => {
					tabs = await this.getTabs();
					for (const tab of tabs) {
						await this.switchTo().window(tab);
						if (await this.getTitle() === title) {
							return true;
						}
					}
				}, {message: `Window with ${title} title was not found during ${timeout}.`, timeout});
			} else {
				await this.switchTo().window(tabs[index]);
			}
		} else {
			await this.switchTo().window(tabs[0]);
		}
	}

	async getTitle() {
		return await this.seleniumDriver.getTitle();
	}

	async getCurrentUrl() {
		return await this.seleniumDriver.getCurrentUrl();
	}

	async takeScreenshot() {
		return await this.seleniumDriver.takeScreenshot();
	}

	async refresh() {
		return await this.seleniumDriver.navigate().refresh();
	}

	async tabTitle() {
		return await this.seleniumDriver.getTitle();
	}

	async getTabs() {
		return await this.seleniumDriver.getAllWindowHandles();
	}

	async getCurrentTab() {
		return await this.seleniumDriver.getWindowHandle();
	}

	async get(url: string) {
		const getUrl = this.resolveUrl(url);

		return await this.seleniumDriver.get(getUrl);
	}

	async setWindowSize(width: number, height: number) {
		return await this.seleniumDriver.manage().window()
			.setRect({
				width,
				height,
			});
	}

	async sleep(time: number) {
		await (() => new Promise((resolve) => setTimeout(resolve, time)))();
	}

	manage() {
		return this.seleniumDriver.manage();
	}

	async executeScript(script: any, ...args: any[]): Promise<any> {
		const recomposedArgs = await this.toSeleniumArgs(...args);
		const res = await this.seleniumDriver.executeScript(script, ...recomposedArgs);

		return res;
	}

	async executeAsyncScript(script: any, ...args: any[]): Promise<any> {
		const recomposedArgs = await this.toSeleniumArgs(...args);

		const res = await this.seleniumDriver.executeAsyncScript(script, ...recomposedArgs);

		return res;
	}

	navigate() {
		return this.seleniumDriver.navigate();
	}

	switchTo() {
		return this.seleniumDriver.switchTo();
	}

	private async toSeleniumArgs(...args) {
		const executeScriptArgs = [];

		for (const item of args) {
			const resolvedItem = isPromise(item) ? await item : item;

			if (Array.isArray(resolvedItem)) {
				const arrayItems = [];

				for (const itemArr of resolvedItem) {
					if (item && item.getId) {
						const elementObj = await this.getSeleniumProtocolElement(itemArr);

						arrayItems.push(elementObj);
					} else {
						arrayItems.push(itemArr);
					}
				}
				executeScriptArgs.push(arrayItems);
			} else if (resolvedItem && resolvedItem.getSeleniumProtocolElementObj) {
				executeScriptArgs.push(await resolvedItem.getSeleniumProtocolElementObj());
			} else {
				executeScriptArgs.push(item);
			}
		}

		return executeScriptArgs;
	}

	async quit() {
		await this.seleniumDriver.quit();
		this.seleniumDriver = null;
	}

	async quitAll() {
		if (isArray(this.drivers) && this.drivers.length) {
			for (const driver of this.drivers) {
				if (this.seleniumDriver === driver) {
					this.seleniumDriver = null;
				}
				await driver.quit();
			}
		}
		this.drivers = [];
		if (this.seleniumDriver) {
			await this.seleniumDriver.quit();
			this.seleniumDriver = null;
		}
	}

	async close() {
		if (this.drivers.length) {
			const index = this.drivers.findIndex((driver) => driver === this.seleniumDriver);
			if (index !== -1) this.drivers.splice(index, 1);
		}
		await this.seleniumDriver.close();
	}

	actions() {
		return this.seleniumDriver.actions({async: true});
	}

	private async getSeleniumProtocolElement(item) {
		const webElId = await item.getId();
		const elementObj = {
			'element-6066-11e4-a52e-4f735466cecf': webElId,
			ELEMENT: webElId,
		};

		return elementObj;
	}

	private resolveUrl(urlOrPath: string) {
		let resolved;

		if (!urlOrPath.includes('http') && this.appBaseUrl) {
			const url = this.appBaseUrl;
			const path = urlOrPath;

			if (url.endsWith('/') && path.startsWith('/')) {
				resolved = `${url.replace(/.$/u, '')}${path}`;
			} else if (url.endsWith('/') && !path.startsWith('/')) {
				resolved = `${url}${path}`;
			} else if (!url.endsWith('/') && path.startsWith('/')) {
				resolved = `${url}${path}`;
			} else {
				resolved = `${url}/${path}`;
			}
		} else if (urlOrPath === '' || urlOrPath === '/') {
			return this.baseUrl;
		} else {
			resolved = urlOrPath;
		}

		return resolved;
	}
}

const browser = validateBrowserCallMethod(Browser);

export {
	browser,
	Browser,
};
