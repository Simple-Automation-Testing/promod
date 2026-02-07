# Element

Element has a "lazy" interface (as it was in protractor). The element is not resolved until an action is performed on it.

All examples work identically with both `playwrightWD` and `seleniumWD`.

- [Selector strategies](#selector-strategies)
- [Child elements](#child-elements)
- [click](#click)
- [doubleClick](#doubleclick)
- [sendKeys](#sendkeys)
- [clear](#clear)
- [clearViaBackspace](#clearViabackspace)
- [pressEnter](#pressenter)
- [hover](#hover)
- [hoverByElementCoordinate](#hoverbyelementcoordinate)
- [clickByElementCoordinate](#clickbyelementcoordinate)
- [getElementCoordinates](#getelementcoordinates)
- [focus](#focus)
- [getText](#gettext)
- [getTagName](#gettagname)
- [getAttribute](#getattribute)
- [getCssValue](#getcssvalue)
- [getRect](#getrect)
- [isDisplayed](#isdisplayed)
- [isPresent](#ispresent)
- [isEnabled](#isenabled)
- [isSelected](#isselected)
- [submit](#submit)
- [selectOption](#selectoption)
- [scrollIntoView](#scrollintoview)
- [takeScreenshot](#takescreenshot)
- [getEngineElement](#getengineelement)
- [locator](#locator)

---

## Selector strategies

```js
const { playwrightWD } = require('promod');
const { $ } = playwrightWD;

const byCss = $('.class #id div a[href*="link"]');
const byXpath = $('xpath=.//div[@data-test="id"]/span');
const byJS = $(() => document.querySelector('div > span'));
const byCustom = $({ query: 'button', text: 'Submit' });
const byCustomRegex = $({ query: 'button', rg: 'Sub.*' });
```

## Child elements

Elements can create child `$` and `$$` from themselves, scoping the search to the parent element.

```js
const form = $('form');
const input = form.$('input');           // single child element
const buttons = form.$$('button');       // child elements collection
```

## click

```js
const button = $('button');

await button.click();                                  // regular click
await button.click({ withScroll: true });              // scroll into view first
await button.click({ allowForceIfIntercepted: true }); // retry via coordinates if intercepted
await button.click({ force: true });                   // force click via coordinates
await button.click({ button: 'right' });               // right click
```

| Option | Type | Description |
| --- | --- | --- |
| `withScroll` | `boolean` | Scroll element into view before clicking |
| `allowForceIfIntercepted` | `boolean` | Retry via coordinates if click is intercepted |
| `force` | `boolean` | Click via coordinates directly |
| `button` | `'left' \| 'right' \| 'middle'` | Mouse button |
| `clickCount` | `number` | Number of clicks |
| `delay` | `number` | Delay between mousedown and mouseup |
| `modifiers` | `Array<'Alt'\|'Control'\|'Meta'\|'Shift'>` | Modifier keys |
| `position` | `{ x: number; y: number }` | Click position relative to element |
| `timeout` | `number` | Timeout in ms |

## doubleClick

```js
const button = $('button');

await button.doubleClick();
await button.doubleClick({ withScroll: true });
```

Accepts the same options as `click` (except `clickCount`).

## sendKeys

```js
const input = $('input');

await input.sendKeys('hello world');
await input.sendKeys(42);
await input.sendKeys('hello', true); // use fill mode (Playwright: clears first then fills)
```

## clear

```js
const input = $('input');
await input.clear();
```

## clearViaBackspace

Clears input by pressing backspace repeatedly.

```js
const input = $('input');
await input.sendKeys('hello');
await input.clearViaBackspace(5, true); // 5 backspaces, focus first
```

| Parameter | Type | Description |
| --- | --- | --- |
| `repeat` | `number` | Number of backspace presses (default 1) |
| `focus` | `boolean` | Focus/click element first |

## pressEnter

```js
const input = $('input');
await input.sendKeys('search query');
await input.pressEnter();       // focus first (default)
await input.pressEnter(false);  // without focusing
```

## hover

```js
const button = $('button');

await button.hover();
await button.hover({ force: true });
```

## hoverByElementCoordinate

Moves the mouse to a specific position relative to the element.

```js
const el = $('div');
await el.hoverByElementCoordinate('center');
await el.hoverByElementCoordinate('right-top');
```

Positions: `'center'`, `'center-top'`, `'center-bottom'`, `'center-right'`, `'center-left'`, `'right-top'`, `'right-bottom'`, `'left-top'`, `'left-bottom'`

## clickByElementCoordinate

Clicks at a specific position relative to the element.

```js
const el = $('div');
await el.clickByElementCoordinate('center');
await el.clickByElementCoordinate('left-top');
```

## getElementCoordinates

Returns the x/y coordinates of a specific position on the element.

```js
const { x, y } = await $('div').getElementCoordinates('center');
```

## focus

```js
const input = $('input');
await input.focus();
```

## getText

```js
const text = await $('h1').getText();
```

## getTagName

```js
const tag = await $('h1').getTagName(); // 'h1'
```

## getAttribute

```js
const href = await $('a').getAttribute('href');
const dataId = await $('div').getAttribute('data-id');
```

## getCssValue

Returns the computed CSS property value.

```js
const color = await $('button').getCssValue('color');
const fontSize = await $('h1').getCssValue('font-size');
```

## getRect

Returns the element bounding box.

```js
const { x, y, width, height } = await $('div').getRect();
```

## isDisplayed

```js
const visible = await $('button').isDisplayed(); // true | false
```

## isPresent

Checks if the element exists in the DOM.

```js
const exists = await $('button').isPresent(); // true | false
```

## isEnabled

```js
const enabled = await $('button').isEnabled(); // true | false
```

## isSelected

```js
const selected = await $('input[type="checkbox"]').isSelected(); // true | false
```

## submit

```js
await $('form').submit();
```

## selectOption

Works with `<select>` elements.

```js
const select = $('select');

// By visible text
await select.selectOption('Option text');

// By value attribute
await select.selectOption({ value: 'opt1' });

// By label attribute
await select.selectOption({ label: 'Option Label' });

// By index
await select.selectOption({ index: 2 });
```

## scrollIntoView

```js
const el = $('div');

await el.scrollIntoView();          // default scroll
await el.scrollIntoView('start');   // scroll to top of viewport
await el.scrollIntoView('end');     // scroll to bottom of viewport
await el.scrollIntoView('center');  // scroll to center of viewport
await el.scrollIntoView('nearest'); // scroll to nearest edge
```

## takeScreenshot

```js
const screenshot = await $('form').takeScreenshot();
```

## getEngineElement

Returns the underlying native engine element (Playwright `Locator` / Selenium `WebElement`).

```js
const nativeElement = await $('button').getEngineElement();
```

## locator

Returns the selector information used to find this element.

```js
const info = $('button').locator(); // { value: 'button' }
```
