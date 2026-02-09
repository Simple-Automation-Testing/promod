# Engine setup

Promod does not ship its own test runner or browser driver. It wraps [Playwright](https://www.npmjs.com/package/playwright) and [Selenium WebDriver](https://www.npmjs.com/package/selenium-webdriver) with a unified API.

- [Playwright setup](#playwright-setup)
- [Selenium WebDriver setup](#selenium-webdriver-setup)
- [Engine switcher](#engine-switcher)
- [Browser config translation](./config.md) — define settings once, translate to engine-specific config

## Playwright setup

```js
const { chromium } = require('playwright');
const { playwrightWD } = require('promod');
const { browser, $, $$ } = playwrightWD;

async function setup() {
  const launched = await chromium.launch({ headless: false });
  browser.setClient({ driver: launched });
}
```

`setClient` accepts:

| Parameter | Type | Description |
| --- | --- | --- |
| `driver` | `Browser` (Playwright) | Launched browser instance |
| `lauchNewInstance` | `() => Promise<Browser>` | Factory to create new browser instances for `runNewBrowser()` |
| `baseConfig` | `object` | Default context config (viewport, userAgent, isMobile) |

## Selenium WebDriver setup

```js
const { Browser, Builder } = require('selenium-webdriver');
require('chromedriver');
const { seleniumWD } = require('promod');
const { browser, $, $$ } = seleniumWD;

async function setup() {
  const driver = await new Builder().forBrowser(Browser.CHROME).build();
  browser.setClient({
    driver,
    lauchNewInstance: () => new Builder().forBrowser(Browser.CHROME).build(),
  });
}
```

`setClient` accepts:

| Parameter | Type | Description |
| --- | --- | --- |
| `driver` | `ThenableWebDriver` | Selenium WebDriver instance |
| `lauchNewInstance` | `() => Promise<ThenableWebDriver>` | Factory for `runNewBrowser()` |

## Engine switcher

A common pattern is to select the engine via an environment variable:

```js
const { chromium } = require('playwright');
const { Browser, Builder } = require('selenium-webdriver');
const { playwrightWD, seleniumWD } = require('promod');

const { ENGINE } = process.env; // 'pw' or 'swd'

async function getEngine() {
  if (ENGINE === 'pw') {
    const launched = await chromium.launch({ headless: false });
    playwrightWD.browser.setClient({ driver: launched });
    return playwrightWD;
  } else {
    require('chromedriver');
    const driver = await new Builder().forBrowser(Browser.CHROME).build();
    seleniumWD.browser.setClient({
      driver,
      lauchNewInstance: () => new Builder().forBrowser(Browser.CHROME).build(),
    });
    return seleniumWD;
  }
}

module.exports = { getEngine };
```
