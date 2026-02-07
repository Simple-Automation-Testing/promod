# Elements

Elements has a "lazy" interface (as it was in protractor). The collection is not resolved until an action is performed on it.

All examples work identically with both `playwrightWD` and `seleniumWD`.

- [Selector strategies](#selector-strategies)
- [get](#get)
- [first](#first)
- [last](#last)
- [count](#count)
- [getFirstVisible](#getfirstvisible)
- [getAllVisible](#getallvisible)
- [each](#each)
- [map](#map)
- [some](#some)
- [every](#every)
- [find](#find)
- [filter](#filter)
- [getEngineElements](#getengineelements)

---

## Selector strategies

```js
const { playwrightWD } = require('promod');
const { $$ } = playwrightWD;

const byCss = $$('.class #id div a[href*="link"]');
const byXpath = $$('xpath=.//div[@data-test="id"]/span');
const byJS = $$(() => document.querySelectorAll('div > span'));
const byCustom = $$({ query: 'button', text: 'Submit' });
```

## get

Returns a single element from the collection by index. Negative indexes count from the end.

```js
const buttons = $$('button');

const first = buttons.get(0);
const third = buttons.get(2);
const last = buttons.get(-1);

await first.click();
```

## first

Shorthand for `get(0)`.

```js
const button = $$('button').first();
await button.click();
```

## last

Shorthand for `get(-1)`.

```js
const button = $$('button').last();
await button.click();
```

## count

Returns the number of elements matching the selector.

```js
const count = await $$('button').count();
```

## getFirstVisible

Returns the first visible (displayed) element in the collection.

```js
const visibleButton = $$('button').getFirstVisible();
await visibleButton.click();
```

## getAllVisible

Returns a new elements collection containing only visible elements.

```js
const visibleButtons = $$('button').getAllVisible();
const visibleCount = await visibleButtons.count();
```

## each

Iterates over each element in the collection.

```js
const buttons = $$('button');

await buttons.each(async (button, index) => {
  await button.click();
});
```

## map

Maps each element to a value.

```js
const buttons = $$('button');

const texts = await buttons.map(async (button) => {
  return await button.getText();
});
```

## some

Returns `true` if the callback returns `true` for at least one element.

```js
const buttons = $$('button');

const isSomeVisible = await buttons.some(async (button) => {
  return await button.isDisplayed();
});
```

## every

Returns `true` if the callback returns `true` for every element.

```js
const buttons = $$('button');

const allVisible = await buttons.every(async (button) => {
  return await button.isDisplayed();
});
```

## find

Finds the first element matching the callback condition.

```js
const buttons = $$('button');

const submitBtn = await buttons.find(async (button) => {
  return (await button.getText()) === 'Submit';
});

await submitBtn.click();
```

## filter

Returns a new elements collection with elements matching the callback condition.

```js
const buttons = $$('button');

const enabledButtons = buttons.filter(async (button) => {
  return await button.isEnabled();
});

const count = await enabledButtons.count();
```

## getEngineElements

Returns the underlying native engine elements (Playwright `Locator[]` / Selenium `WebElement[]`).

```js
const nativeElements = await $$('button').getEngineElements();
```
