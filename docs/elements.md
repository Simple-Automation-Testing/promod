# Elements

Elements has "lazy" interface (as it was in protractor)

- [searchStragegy](#searchstragegy)
- [get](#get)
- [first](#first)
- [last](#last)
- [each](#each)
- [map](#map)
- [some](#some)
- [every](#every)

## searchStragegy

```js
const { seleniumWD } = require('promod');
const { By, $$ } = seleniumWD;
// css
const elementsByCss = $$('.class #id div a[href*="link"]'); // css selector
const elementsByXpath = $$('xpath=.//div[@data-test="id"]/span'); // xpath selector
const elementsByJS = $$('js=() => document.querySelectorAll("div .span")'); // js selector
const elementWithByInterface = $$(By.className('class')); // By object interface
```

## get

```js
const { seleniumWD } = require('promod');
const { $$ } = seleniumWD;
const someInput = $$('input').get(3);

(async () => {
  await someInput.sendKeys('some value');
})();
```

## first

```js
const { seleniumWD } = require('promod');
const { $$ } = seleniumWD;
const someButton = $$('button').first();

(async () => {
  await someButton.click();
})();
```

## last

```js
const { seleniumWD } = require('promod');
const { $$ } = seleniumWD;
const someButton = $$('button').last();

(async () => {
  await someButton.click();
})();
```

## each

```js
	const {seleniumWD} = require('promod');
	const {$$} = seleniumWD
	const someButtons = $$('button');

	;(async () => {
		await someButtons.each((someButton) => {
			await someButton.click()
		})
	})()
```

## map

```js
	const {seleniumWD} = require('promod');
	const {$$} = seleniumWD
	const someButtons = $$('button');

	;(async () => {
		const allButtonTexts = await someButtons.map((button) => {
			return await someButton.getText()
		})
	})()
```

## some

```js
	const {seleniumWD} = require('promod');
	const {$$} = seleniumWD
	const someButtons = $$('button');

	;(async () => {
		const isSomeButtonVisible = await someButtons.some((button) => {
			return await someButton.isDisplayed()
		})
	})()
```

## every

```js
	const {seleniumWD} = require('promod');
	const {$$} = seleniumWD
	const someButtons = $$('button');

	;(async () => {
		const isEveryButtonVisible = await someButtons.every((button) => {
			return await someButton.isDisplayed()
		})
	})()
```
