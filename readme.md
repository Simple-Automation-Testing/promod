<p align="center">
  <h1 align="center"> PROMOD </h1>
  <img style="width:100%;" src="./docs/promod.png"/>
</p>

<h3>
 <span style="font-weight: bold;"><span style="text-decoration: underline;">Motivation. </span> I really like protractor framework, and its api. Unfortunately protractor is deprecated.</span>
</br>
 That's why i decided to build this library and this library should allow you replace protractor framework in your TAF without massive refactoring.
<h3>

<h2> API </h2>
<p>
  Browser and element APIs should work in same way (as it was in protractor).
  But this library does not have ExpectedConditions object - replacement for this is simple browser.wait with browser/element API.
</p>
<p><a href="/docs/element.md">Element</a></p>
<p><a href="/docs/elements.md">Elements</a></p>
<p><a href="/docs/client.md">Browser</a></p>
<p><a href="/docs/init.md">Init driver</a></p>

- [Usage](#usage)
- [Transition from protractor to promod. Mocha example.](#transition-from-protractor-to-promod-mocha-example)

## Usage
```js
  const {seleniumWD} = require('promod');
  const {$, $$, getSeleniumDriver, browser} = seleniumWD;

  ;(async () => {
    const searchInput = $('input[name="q"]');
    const sections = $$('section');
    await getSeleniumDriver({seleniumAddress: 'http://localhost:4444/wd/hub'}, browser);
    await browser.get('https://www.npmjs.com/');
    await searchInput.sendKeys(`promod${browser.Key.ENTER}`);
    console.log(await sections.get(0).$('a').getText());
  })()

```

## Transition from protractor to promod. Mocha example.

<p>Current test command</p>

```json
  "test": "protractor ./protractor.conf.js"
```
<p>Update to</p>

```json
  "test": "mocha $(find specs -name '*.spec.*') --file ./mocha.hooks.js --timeout 500000"
```
Where:
  ```$(find specs -name '*.spec.*')``` spec files
  ```--file ./mocha.hooks.js``` mocha hooks file

### mocha.hooks.js example

```js
const {config} = require('./protractor.conf.js');
const {seleniumWD} = require('promod');

before(async function() {
  /**
   * onPrepare - protractor part
   * rest - other config data
   */
  const {onPrepare, ...rest} = config;
  const {getSeleniumDriver, browser, $, $$} = seleniumWD;

	await getSeleniumDriver(rest, browser);

  // i am not a big fan of global object usage, but if it is suitable for you, just add API to global
  global.browser = browser;
  global.$ = $;
  global.$$ = $$;

  if (onPrepare) {
    await onPrepare();
  }
});

after(async function() {
  await global.browser.quit();
});

```

<p>Current drivers update command</p>

```json
  "update:driver": "webdriver-manager update"
```
<p>Update to</p>

```json
  "update:driver": "selenium-standalone install"
```


## Improvement plan
 * [ ] Add documentation
 * [ ] Add playwright integration
 * [ ] Add test runner
 * [ ] Add logger