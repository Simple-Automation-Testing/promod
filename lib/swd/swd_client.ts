import {isPromise, waitForCondition} from 'sat-utils';
import {WebDriver, Key} from 'selenium-webdriver';

class Browser {
	public seleniumDriver: WebDriver;
	private appBaseUrl;
	public wait = waitForCondition;

	constructor() {
		/**
		 *
		 */
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

	currentClient() {
		return this.seleniumDriver;
	}

	setClient(client) {
		this.seleniumDriver = client;
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

	async executeScript(script: any, ...args: any[]) {
		const recomposedArgs = await this.toSeleniumArgs(...args);
		const res = await this.seleniumDriver.executeScript(script, ...recomposedArgs);

		return res;
	}

	async executeAsyncScript(script: any, ...args: any[]) {
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

const browser = new Browser();

export {
	browser,
	Browser,
};
