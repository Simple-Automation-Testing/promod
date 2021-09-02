# Element
Element has "lazy" interface (as it was in protractor)

- [searchStragegy](#searchstragegy)
- [sendKeys](#sendkeys)
- [click](#click)
- [getTagName](#gettagname)
- [getCssValue](#getcssvalue)
- [getAttribute](#getattribute)
- [getText](#gettext)
- [getRect](#getrect)
- [isEnabled](#isenabled)
- [isSelected](#isselected)
- [isPresent](#ispresent)
- [isDisplayed](#isdisplayed)
- [submit](#submit)
- [clear](#clear)
- [takeScreenshot](#takescreenshot)
- [scrollIntoView](#scrollintoview)


## searchStragegy
```js
	const {seleniumWD} = require('promod');
	const {By, $} = seleniumWD
	// css
	const elementByCss = $('.class #id div a[href*="link"]') // css selector
	const elementByXpath = $('xpath=.//div[@data-test="id"]/span') // xpath selector
	const elementByJS = $('js=() => document.querySelector("div .span")') // js selector
	const elementWithByInterface = $(By.className('class')) // By object interface
```

## sendKeys
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someInput = $('input')

	;(async () => {
		await someInput.sendKeys('some value')
	})
```

## click
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someButton = $('button')

	;(async () => {
		await someButton.click()
	})
```

## getTagName
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someButton = $('button')

	;(async () => {
		const tagName = await someButton.getTagName() // button
	})
```

## getCssValue
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someButton = $('button')

	;(async () => {
		const buttonColor = await someButton.getCssValue('color') // some color
	})
```

## getAttribute
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someButton = $('button')

	;(async () => {
		const buttonAttribute = await someButton.getAttribute('data-id') // value of data-id attribute
	})
```

## getText
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someButton = $('button')

	;(async () => {
		const buttonText = await someButton.getText() // button Text
	})
```

## getRect
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someButton = $('button')

	;(async () => {
		const buttonRect = await someButton.getRect() // {x: number, y: number, width: number, height: number}
	})
```

## isEnabled
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someButton = $('button')

	;(async () => {
		const buttonAvailableToClick = await someButton.isEnabled() // true|false
	})()
```

## isPresent
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someButton = $('button')

	;(async () => {
		const buttonExistsInDOM = await someButton.isPresent() // true|false
	})()
```

## isDisplayed
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someButton = $('button')

	;(async () => {
		const buttonIsVisible = await someButton.isDisplayed() // true|false
	})()
```

## isSelected
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someButton = $('button')

	;(async () => {
		const buttonIsSelected = await someButton.isSelected() // true|false
	})()
```

## submit
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someButton = $('button')

	;(async () => {
		await someButton.submit()
	})()
```

## clear
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someInput = $('input')

	;(async () => {
		await someInput.clear()
	})()
```

## takeScreenshot
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someForm = $('form')

	;(async () => {
		await someForm.takeScreenshot()
	})()
```

## takeScreenshot
```js
	const {seleniumWD} = require('promod');
	const {$} = seleniumWD
	const someForm = $('form')

	;(async () => {
		await someForm.scrollIntoView() // default scroll into view
		await someForm.scrollIntoView('end') // move element to the bottom of the view port
		await someForm.scrollIntoView('start') // move element to the top of the view port
	})()
```