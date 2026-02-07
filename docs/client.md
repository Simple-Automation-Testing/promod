# Browser

The `browser` object provides methods for page navigation, tab/window management, script execution, cookies, iframes, keyboard actions, and more.

All examples show both Playwright and Selenium WebDriver usage.

- [Key / keyboard](#key--keyboard)
- [baseUrl](#baseurl)
- [get](#get)
- [getCurrentUrl](#getcurrenturl)
- [getTitle](#gettitle)
- [refresh](#refresh)
- [back](#back)
- [forward](#forward)
- [takeScreenshot](#takescreenshot)
- [setWindowSize](#setwindowsize)
- [getWindomSize](#getwindomsize)
- [maximize](#maximize)
- [sleep](#sleep)
- [executeScript](#executescript)
- [getTabs](#gettabs)
- [getTabsCount](#gettabscount)
- [getCurrentTab](#getcurrenttab)
- [switchToTab](#switchtotab)
- [returnToInitialTab](#returntoinitialtab)
- [openNewTab](#opennewtab)
- [makeActionAtEveryTab](#makeactionateverytab)
- [close](#close)
- [quit](#quit)
- [quitAll](#quitall)
- [runNewBrowser](#runnewbrowser)
- [switchToBrowser](#switchtobrowser)
- [switchToIframe](#switchtoiframe)
- [switchToDefauldIframe](#switchtodefauldiframe)
- [scrollByMouseWheel](#scrollbymousewheel)
- [scrollElementByMouseWheel](#scrollelementbymousewheel)
- [keyDownAndHold](#keydownandhold)
- [keyUp](#keyup)
- [keyDownAndUp](#keydownandup)
- [keyboardPressEsc](#keyboardpressesc)
- [keyboardPressEnter](#keyboardpressenter)
- [setCookies](#setcookies)
- [getCookies](#getcookies)
- [getCookieByName](#getcookiebyname)
- [deleteCookie](#deletecookie)
- [deleteAllCookies](#deleteallcookies)
- [getBrowserLogs](#getbrowserlogs)
- [setBasicAuth](#setbasicauth)
- [mockRequests](#mockrequests)
- [wait](#wait)

---

## Key / keyboard

```js
// Playwright
const { playwrightWD } = require('promod');
const { browser } = playwrightWD;
browser.Key       // keyboard keys object
browser.keyboard  // same as Key

// Selenium
const { seleniumWD } = require('promod');
const { browser } = seleniumWD;
browser.Key       // selenium Key object
```

## baseUrl

```js
browser.baseUrl = 'https://your.app.com'; // setter
const url = browser.baseUrl;              // getter

await browser.get('/test'); // opens https://your.app.com/test
```

## get

Opens a URL. If `baseUrl` is set and the argument is a relative path, the full URL is resolved.

```js
await browser.get('https://example.com');
await browser.get('/relative/path'); // uses baseUrl
```

## getCurrentUrl

```js
const url = await browser.getCurrentUrl();
```

## getTitle

```js
const title = await browser.getTitle();
```

## refresh

```js
await browser.refresh();
```

## back

```js
await browser.back();
```

## forward

```js
await browser.forward();
```

## takeScreenshot

```js
const screenshot = await browser.takeScreenshot();
```

## setWindowSize

```js
await browser.setWindowSize(1280, 720);
```

## getWindomSize

```js
const { width, height } = await browser.getWindomSize();
```

## maximize

```js
await browser.maximize();
```

## sleep

```js
await browser.sleep(2500); // sleep 2.5 seconds
```

## executeScript

Executes a script in the browser context. Arguments must be passed as an array.

```js
// No arguments
const height = await browser.executeScript(() => document.body.offsetHeight);

// With arguments
const text = await browser.executeScript(
  ([el]) => el.innerText,
  [$('h1').getEngineElement()],
);
```

## getTabs

```js
const tabs = await browser.getTabs();
```

## getTabsCount

```js
const count = await browser.getTabsCount();
```

## getCurrentTab

```js
const currentTab = await browser.getCurrentTab();
```

## switchToTab

Switch to a tab by index, title, or URL.

```js
await browser.switchToTab({ index: 2 });
await browser.switchToTab({ title: 'Some title' });
await browser.switchToTab({ url: 'some-url-part', strictEquality: false });
await browser.switchToTab({ index: 2, expectedQuantity: 3, timeout: 5000 });
```

| Option | Type | Description |
| --- | --- | --- |
| `index` | `number` | Tab index (0-based) |
| `title` | `string` | Tab title to match |
| `url` | `string` | URL to match |
| `expectedQuantity` | `number` | Wait until this many tabs exist |
| `timeout` | `number` | Max wait time in ms (default 5000) |
| `strictEquality` | `boolean` | Exact match vs substring (default true) |

## returnToInitialTab

Closes all tabs except the initial one and switches back to it.

```js
await browser.switchToTab({ index: 2 });
// ... do work ...
await browser.returnToInitialTab();
```

## openNewTab

```js
await browser.openNewTab('https://example.com');
await browser.openNewTab(); // opens blank tab
```

## makeActionAtEveryTab

Runs an action in every open tab.

```js
const titles = [];
await browser.makeActionAtEveryTab(async () => {
  titles.push(await browser.getTitle());
});
```

## close

Closes the current tab/page.

```js
await browser.close();
```

## quit

Closes the current browser context/session.

```js
await browser.quit();
```

## quitAll

Closes all contexts and the browser itself.

```js
await browser.quitAll();
```

## runNewBrowser

Creates a new browser context (Playwright) or launches a new browser instance (Selenium).

```js
await browser.runNewBrowser();
await browser.runNewBrowser({
  currentBrowserName: 'main',
  newBrowserName: 'second',
});
```

## switchToBrowser

Switch between multiple browser contexts/instances.

```js
await browser.switchToBrowser({ index: 0 });
await browser.switchToBrowser({ browserName: 'main' });
await browser.switchToBrowser({ title: 'Page Title' });
```

## switchToIframe

Switches the working context to an iframe.

```js
// By CSS selector
await browser.switchToIframe('iframe.my-frame');

// By element
const frame = $('iframe.my-frame');
await browser.switchToIframe(frame);

// With options
await browser.switchToIframe('iframe.my-frame', false, {
  timeout: 30000,
  message: 'Custom error message',
});
```

| Parameter | Type | Description |
| --- | --- | --- |
| `selector` | `string \| PromodElementType` | Iframe selector or element |
| `jumpToDefaultFirst` | `boolean` | Switch to top frame first (default false) |
| `opts.timeout` | `number` | Max wait time (default 30000) |
| `opts.message` | `string` | Custom error message |

## switchToDefauldIframe

Switches back to the top-level frame.

```js
await browser.switchToDefauldIframe();
```

## scrollByMouseWheel

Scrolls the page by moving the mouse and using the wheel.

```js
await browser.scrollByMouseWheel(x, y, deltaX, deltaY, duration);
```

## scrollElementByMouseWheel

Scrolls inside an element by moving the mouse to it and using the wheel.

```js
const container = $('.scrollable');
await browser.scrollElementByMouseWheel(container, 0, 0, 0, 500, 100);
```

## keyDownAndHold

Presses and holds a key.

```js
await browser.keyDownAndHold(browser.Key.PageDown);
await browser.keyDownAndHold('Shift', $('input'));
```

## keyUp

Releases a held key.

```js
await browser.keyUp(browser.Key.PageDown);
```

## keyDownAndUp

Presses and immediately releases a key.

```js
await browser.keyDownAndUp(browser.Key.Escape);
```

## keyboardPressEsc

```js
await browser.keyboardPressEsc();
```

## keyboardPressEnter

```js
await browser.keyboardPressEnter();
```

## setCookies

```js
await browser.setCookies({ name: 'token', value: 'abc123' });
await browser.setCookies([
  { name: 'a', value: '1' },
  { name: 'b', value: '2' },
]);
```

## getCookies

```js
const cookies = await browser.getCookies();
```

## getCookieByName

```js
const cookie = await browser.getCookieByName('token');
```

## deleteCookie

```js
await browser.deleteCookie('token');
```

## deleteAllCookies

```js
await browser.deleteAllCookies();
```

## getBrowserLogs

Returns console log entries from the page (Playwright only captures these natively).

```js
const logs = await browser.getBrowserLogs();
```

## setBasicAuth

Sets Basic authentication headers on all subsequent requests (Playwright).

```js
await browser.setBasicAuth({ username: 'user', password: 'pass' });
```

## mockRequests

Registers a request mock/intercept (Playwright).

```js
browser.mockRequests({
  url: '**/api/data',
  handler: (request) => ({
    status: 200,
    body: JSON.stringify({ mocked: true }),
    headers: { 'Content-Type': 'application/json' },
  }),
});
```

## wait

Built-in wait utility (`sat-wait`). Waits until a condition is met.

```js
await browser.wait(
  async () => (await browser.getTitle()) === 'Expected Title',
  { timeout: 5000, message: 'Title did not match' },
);
```
