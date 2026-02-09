import { waitFor } from 'sat-wait';
import { getEngine, engine, expect } from './setup';

describe('Mock requests', () => {
  const { $, browser } = engine;

  before(async () => {
    await getEngine();
  });

  after(async () => {
    await browser.quitAll();
  });

  afterEach(async () => {
    browser.clearMockRequests();
  });

  it('[P] mock a page navigation and verify the mocked response', async () => {
    browser.mockRequests({
      url: '**/mock-page',
      handler: () => ({
        status: 200,
        body: '<html><head><title>MOCKED</title></head><body><div id="result">mocked-response-body</div></body></html>',
        headers: { 'Content-Type': 'text/html' },
      }),
    });

    await browser.get('https://promod-mock-test.local/mock-page');
    await waitFor(() => $('#result').isDisplayed());

    expect(await $('#result').getText()).toEqual('mocked-response-body');
  });

  it('[P] mock a JSON fetch from a mocked page', async () => {
    browser.mockRequests({
      url: '**/mock-app',
      handler: () => ({
        status: 200,
        body: [
          '<html><head><title>MOCK APP</title></head><body>',
          '<div id="result"></div>',
          '<button id="fetch-btn" onclick="doFetch()">Fetch</button>',
          '<script>',
          'async function doFetch() {',
          '  const res = await fetch("/api/data");',
          '  document.getElementById("result").innerText = await res.text();',
          '}',
          '</script>',
          '</body></html>',
        ].join(''),
        headers: { 'Content-Type': 'text/html' },
      }),
    });

    browser.mockRequests({
      url: '**/api/data',
      handler: () => ({
        status: 200,
        body: JSON.stringify({ message: 'hello from mock' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    await browser.get('https://promod-mock-test.local/mock-app');
    await waitFor(() => $('#fetch-btn').isDisplayed());
    await $('#fetch-btn').click();

    await waitFor(async () => (await $('#result').getText()).includes('hello from mock'), {
      timeout: 5000,
      message: 'Expected JSON mock response to appear in #result',
    });

    const text = await $('#result').getText();
    expect(text).stringIncludesSubstring('hello from mock');
  });

  it('[P] mock multiple endpoints independently', async () => {
    browser.mockRequests({
      url: '**/mock-multi',
      handler: () => ({
        status: 200,
        body: [
          '<html><head><title>MOCK MULTI</title></head><body>',
          '<div id="result"></div>',
          '<button id="fetch-btn" onclick="doFetch(\'/api/first\')">First</button>',
          '<button id="fetch-second-btn" onclick="doFetch(\'/api/second\')">Second</button>',
          '<script>',
          'async function doFetch(url) {',
          '  const res = await fetch(url);',
          '  document.getElementById("result").innerText = await res.text();',
          '}',
          '</script>',
          '</body></html>',
        ].join(''),
        headers: { 'Content-Type': 'text/html' },
      }),
    });

    browser.mockRequests({
      url: '**/api/first',
      handler: () => ({
        status: 200,
        body: 'first-endpoint',
        headers: { 'Content-Type': 'text/plain' },
      }),
    });

    browser.mockRequests({
      url: '**/api/second',
      handler: () => ({
        status: 200,
        body: 'second-endpoint',
        headers: { 'Content-Type': 'text/plain' },
      }),
    });

    await browser.get('https://promod-mock-test.local/mock-multi');
    await waitFor(() => $('#fetch-btn').isDisplayed());

    await $('#fetch-btn').click();
    await waitFor(async () => (await $('#result').getText()) === 'first-endpoint', {
      timeout: 5000,
      message: 'Expected first endpoint mock in #result',
    });
    expect(await $('#result').getText()).toEqual('first-endpoint');

    await $('#fetch-second-btn').click();
    await waitFor(async () => (await $('#result').getText()) === 'second-endpoint', {
      timeout: 5000,
      message: 'Expected second endpoint mock in #result',
    });
    expect(await $('#result').getText()).toEqual('second-endpoint');
  });

  it('[P] clearMockRequests stops intercepting', async () => {
    browser.mockRequests({
      url: '**/cleared-page',
      handler: () => ({
        status: 200,
        body: '<html><body><div id="result">should-be-cleared</div></body></html>',
        headers: { 'Content-Type': 'text/html' },
      }),
    });

    browser.clearMockRequests();

    let navigated = false;

    try {
      await browser.get('https://promod-mock-test.local/cleared-page');
      navigated = true;
    } catch {
      // navigation may fail since mock is cleared and host does not exist
    }

    if (navigated) {
      const text = await $('#result').getText().catch(() => '');
      expect(text).toNotEqual('should-be-cleared');
    }
  });
});
