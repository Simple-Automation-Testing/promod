# Browser config

Define browser settings once and translate them to engine-specific configuration for Playwright or Selenium WebDriver. No auto-launching — you still call `chromium.launch()` / `new Builder().build()` yourself.

- [PromodBrowserConfig](#promodbrowserconfig)
- [toPwConfig](#topwconfig)
- [toSwdConfig](#toswdconfig)
- [Full example](#full-example)

---

## PromodBrowserConfig

A unified configuration object accepted by both translation functions.

```ts
const { toPwConfig, toSwdConfig } = require('promod');

const config = {
  browserName: 'chrome',
  headless: true,
  args: ['--disable-gpu'],
  viewport: { width: 1280, height: 720 },
};
```

| Property | Type | Description |
| --- | --- | --- |
| `browserName` | `'chrome' \| 'firefox' \| 'webkit' \| 'edge'` | Target browser (required) |
| `headless` | `boolean` | Run without a visible window |
| `args` | `string[]` | Extra browser arguments |
| `executablePath` | `string` | Path to browser binary |
| `proxy` | `{ server, bypass?, username?, password? }` | Proxy settings |
| `viewport` | `{ width, height }` | Browser viewport size |
| `userAgent` | `string` | Custom user-agent string |
| `isMobile` | `boolean` | Emulate a mobile device |
| `deviceScaleFactor` | `number` | Device pixel ratio |
| `locale` | `string` | Browser locale (e.g. `'en-US'`) |
| `timezoneId` | `string` | Timezone (e.g. `'America/New_York'`) |
| `permissions` | `string[]` | Granted permissions (e.g. `['geolocation']`) |
| `geolocation` | `{ latitude, longitude, accuracy? }` | Geolocation override |
| `colorScheme` | `'light' \| 'dark' \| 'no-preference'` | Preferred color scheme |
| `ignoreHTTPSErrors` | `boolean` | Accept insecure certificates |

Only set properties appear in the output — no undefined keys are added.

---

## toPwConfig

Translates a `PromodBrowserConfig` into Playwright launch and context options.

```js
const { toPwConfig } = require('promod');

const { browserType, launchOptions, contextOptions } = toPwConfig({
  browserName: 'chrome',
  headless: true,
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
});
```

Returns:

| Field | Type | Description |
| --- | --- | --- |
| `browserType` | `'chromium' \| 'firefox' \| 'webkit'` | Playwright browser type to launch |
| `launchOptions` | `object` | Passed to `chromium.launch(launchOptions)` |
| `contextOptions` | `object` | Passed to `browser.newContext()` or `setClient({ baseConfig })` |

Browser name mapping:

| `browserName` | `browserType` | Extra |
| --- | --- | --- |
| `'chrome'` | `'chromium'` | — |
| `'edge'` | `'chromium'` | `launchOptions.channel = 'msedge'` |
| `'firefox'` | `'firefox'` | — |
| `'webkit'` | `'webkit'` | — |

Properties routed to `launchOptions`: `headless`, `args`, `executablePath`, `proxy`.

Properties routed to `contextOptions`: `viewport`, `userAgent`, `isMobile`, `deviceScaleFactor`, `locale`, `timezoneId`, `permissions`, `geolocation`, `colorScheme`, `ignoreHTTPSErrors`.

---

## toSwdConfig

Translates a `PromodBrowserConfig` into Selenium WebDriver capabilities.

```js
const { toSwdConfig } = require('promod');

const { browserName, capabilities } = toSwdConfig({
  browserName: 'chrome',
  headless: true,
  viewport: { width: 1280, height: 720 },
});
```

Returns:

| Field | Type | Description |
| --- | --- | --- |
| `browserName` | `string` | Selenium browser name (`'chrome'`, `'MicrosoftEdge'`, `'firefox'`) |
| `capabilities` | `object` | Capabilities object for `new Builder().withCapabilities()` |

Browser name mapping:

| `browserName` | Selenium `browserName` | Capabilities key |
| --- | --- | --- |
| `'chrome'` | `'chrome'` | `goog:chromeOptions` |
| `'edge'` | `'MicrosoftEdge'` | `ms:edgeOptions` |
| `'firefox'` | `'firefox'` | `moz:firefoxOptions` |
| `'webkit'` | — | throws an error |

Property mapping — Chrome / Edge:

| Property | Mapping |
| --- | --- |
| `headless` | `args: ['--headless=new']` |
| `args` | merged into `args` |
| `executablePath` | `binary` |
| `proxy` | `--proxy-server=<server>` arg |
| `viewport` | `--window-size=W,H` arg |
| `userAgent` | `--user-agent=...` arg + `mobileEmulation.userAgent` |
| `isMobile` | `mobileEmulation.deviceMetrics.mobile` |
| `deviceScaleFactor` | `mobileEmulation.deviceMetrics.pixelRatio` |
| `locale` | `--lang=...` arg |
| `ignoreHTTPSErrors` | top-level `acceptInsecureCerts: true` |
| `timezoneId, permissions, geolocation, colorScheme` | not mapped (require CDP at runtime) |

Property mapping — Firefox:

| Property | Mapping |
| --- | --- |
| `headless` | `args: ['-headless']` |
| `args` | merged into `args` |
| `executablePath` | `binary` |
| `userAgent` | `prefs['general.useragent.override']` |
| `locale` | `prefs['intl.accept_languages']` |
| `ignoreHTTPSErrors` | top-level `acceptInsecureCerts: true` |
| `proxy, viewport, isMobile, deviceScaleFactor` | not mapped (set at runtime) |
| `timezoneId, permissions, geolocation, colorScheme` | not mapped |

---

## Full example

```js
const { chromium, firefox, webkit } = require('playwright');
const { Builder } = require('selenium-webdriver');
const { playwrightWD, seleniumWD, toPwConfig, toSwdConfig } = require('promod');

const config = {
  browserName: 'chrome',
  headless: true,
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
};

// Playwright
async function setupPlaywright() {
  const pw = { chromium, firefox, webkit };
  const { browserType, launchOptions, contextOptions } = toPwConfig(config);
  const driver = await pw[browserType].launch(launchOptions);
  playwrightWD.browser.setClient({ driver, baseConfig: contextOptions });
}

// Selenium WebDriver
async function setupSelenium() {
  const { browserName, capabilities } = toSwdConfig(config);
  const driver = await new Builder().forBrowser(browserName).withCapabilities(capabilities).build();
  seleniumWD.browser.setClient({ driver });
}
```
