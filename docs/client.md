# Browser

- [Key](#key)
- [baseUrl](#baseUrl)
- [getCurrentUrl](#getcurrenturl)
- [takeScreenshot](#takescreenshot)
- [refresh](#refresh)
- [tabTitle](#tabtitle)
- [getTabs](#gettabs)
- [getCurrentTab](#getcurrenttab)
- [close](#close)
- [get](#get)
- [setWindowSize](#setwindowsize)
- [sleep](#sleep)
- [manage](#manage)
- [executeScript](#executescript)
- [executeAsyncScript](#executeasyncscript)
- [navigate](#navigate)
- [switchTo](#switchto)
- [quit](#quit)
- [getTitle](#gettitle)
- [switchToTab](#switchtotab)
- [returnToInitialTab](#returntoinitialtab)
- [actions](#actions)
- [runNewBrowser](#runnewbrowser)
- [switchToBrowser](#switchtobrowser)

## Key
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	browser.Key // getter - returns keyboard keys
```

## baseUrl
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	browser.baseUrl = 'https://your.app.com' // setter
	const currnetBaseUrl = browser.baseUrl // getter - returns current base url
	await browser.get('/test') // browser will open https://your.app.com/test
```

## getCurrentUrl
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	const url = await browser.getCurrentUrl() // current browser line url
```

## takeScreenshot
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	const screen = await browser.takeScreenshot()
```

## refresh
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	await browser.refresh() // refresh page
```

## getTabs
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	const tabs = await browser.getTabs() // current browser opened tabs
```

## get
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	await browser.get('https://www.npmjs.com/package/promod') // open https://www.npmjs.com/package/promod
```

## setWindowSize
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	await browser.setWindowSize(200, 600) // set window size to width 200, height 600
```

## sleep
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	await browser.sleep(2500) // sleep 2.5 seconds
```

## executeScript
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	await browser.executeScript(() => document.querySelector('a').innerText) // returns result of the script
```

## executeAsyncScript
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	await browser.executeAsyncScript((done) => {
		setTimeout(() => {
			done(document.querySelector('a').innerText)
		}, 2500)
	}) // returns result of the async script
```

## quit
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	await browser.quit() // close session
```

## actions
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	const actionsObj = browser.actions() // returns selenium actions interface
```

## switchTo
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	const switchToObj = browser.switchTo() // returns selenium switchTo interface
```

## navigate
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	const navigateToObj = browser.navigate() // returns selenium navigate interface
```

## getCurrentTab
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	const CurrentTabObj = await browser.getCurrentTab() // returns current browser tab item
```

## getCurrentTab
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	await browser.close() // close current browser tab (if one close window)
```

## getTitle
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	const browserWindowTabTitle = await browser.getTitle();
```

## switchToTab
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	await browser.switchToTab({index: 2}); // will switch context to third browser tab (second tab in tabs array)
	await browser.switchToTab({title: 'Some title'}); // will switch context to browser tab where tab title equals 'Some title'
```

## returnToInitialTab
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	await browser.switchToTab({index: 2}); // will switch context to third browser tab (second tab in tabs array)
	await browser.returnToInitialTab(); // will switch first opened tab and close all other tabs
```

## runNewBrowser
```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	await browser.runNewBrowser(); // will runNewBrowser new browser
```

## switchToBrowser

```js
	const {seleniumWD} = require('promod');
	const {browser} = seleniumWD

	await browser.switchToBrowser({index: 0}); // will switch to browser (not tab) which was started first
	await browser.switchToBrowser({tabTitle: 'Simple-Automation-Testing/promod: Library for browser manipulation'});
	// will switch to browser (not tab) which has "Simple-Automation-Testing/promod: Library for browser manipulation" title
```