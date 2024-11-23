# Set driver to engine wrapper

[Promod](https://github.com/Simple-Automation-Testing/promod) is a library, it does not have own test runner, and own browser manipulation interface. <br> Currently promod has API alignment for [playwright](https://www.npmjs.com/package/playwright) <br> and [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver) so to run browser manipulation interface next functions could be created

```js
const { chromium } = require('playwright');
const { Browser, Builder } = require('selenium-webdriver');
const { ENGINE } = process.env;

async function getEngine() {
  if (ENGINE === 'pw') {
    const lauchedChrome = await chromium.launch({ headless: false });
    playwrightWD.browser.setClient({ driver: lauchedChrome });

		return playwrightWD;
  } else {
    require('chromedriver');
    const lauchedChrome = await new Builder().forBrowser(Browser.CHROME).build();
    seleniumWD.browser.setClient({
      driver: lauchedChrome,
      lauchNewInstance: async () => await new Builder().forBrowser(Browser.CHROME).build(),
    });

		return seleniumWD
  }
}

module.exports = { getEngine };
```
