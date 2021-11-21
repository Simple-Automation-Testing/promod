# Elements
Elements has "lazy" interface (as it was in protractor)

- [searchStragegy](#searchstragegy)
- [get](#get)
- [first](#first)
- [last](#last)
- [each](#each)
- [map](#map)


## searchStragegy
```js
	const {seleniumWD} = require('promod');
	const {By, $$} = seleniumWD
	// css
	const elementsByCss = $$('.class #id div a[href*="link"]') // css selector
	const elementsByXpath = $$('xpath=.//div[@data-test="id"]/span') // xpath selector
	const elementsByJS = $$('js=() => document.querySelectorAll("div .span")') // js selector
	const elementWithByInterface = $$(By.className('class')) // By object interface
```

## get
```js
	const {seleniumWD} = require('promod');
	const {$$} = seleniumWD
	const someInput = $$('input').get(3)

	;(async () => {
		await someInput.sendKeys('some value')
	})()
```

## first
```js
	const {seleniumWD} = require('promod');
	const {$$} = seleniumWD
	const someButton = $$('button').first()

	;(async () => {
		await someButton.click()
	})()
```

## last
```js
	const {seleniumWD} = require('promod');
	const {$$} = seleniumWD
	const someButton = $$('button').last()

	;(async () => {
		await someButton.click()
	})()
```

## each
```js
	const {seleniumWD} = require('promod');
	const {$$} = seleniumWD
	const someButtons = $$('button');

	;(async () => {
		await someButtons.each(async (button) => {
			await button.click()
		})
	})()
```

## map
```js
	const {seleniumWD} = require('promod');
	const {$$} = seleniumWD
	const someButtons = $$('button');

	;(async () => {
		const buttonsTexts = await someButtons.each((button) => {
			return button.getText()
		});
	})()
```

