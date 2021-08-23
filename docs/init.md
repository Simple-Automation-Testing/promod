# Session initialization
Promod is a library, it does not have own test runner, initialization of the driver session should be done by ```getSeleniumDriver``` function

- [getSeleniumDriver](#getseleniumdriver)


## getSeleniumDriver
```js
	const {seleniumWD} = require('promod');
	const conf = {
		capabilities: {
			browserName: 'firefox',
		},
		baseUrl: 'https://www.npmjs.com',
	};
	const {getSeleniumDriver, browser, $, $$} = seleniumWD;
	// lazy
	const searchInput = $('input[name="q"]');
	const searchButton = $$('[title="Submit"]').get(0);

	test()
	async function test() {
		await getSeleniumDriver(conf, browser);
		await browser.get('/'); // open npm promode package
		await searchInput.sendKeys('promod');
		await searchButton.click();
	}
```
