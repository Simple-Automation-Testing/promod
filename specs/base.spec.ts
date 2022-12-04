import {
  engine,
  expect,
  Key,
  iframesFile,
  logsFile,
  formsFile,
  hoveFocusFile,
  framesFile,
  selectorsFile,
} from './setup';

describe('Base', () => {
  const { $, $$, getDriver, browser } = engine;

  beforeEach(async () => {
    await getDriver(browser);
  });

  afterEach(async () => {
    await browser.quitAll();
  });

  it('iframes', async () => {
    await browser.get(iframesFile);

    await browser.switchToIframe('[name="first"]');
    const list = $('ul').$$('li');
    const listSecond = $('#list').$$('span');
    expect(await list.count()).toEqual(3);

    await browser.switchToDefauldIframe();
    expect(await list.count()).toEqual(0);
    await browser.switchToIframe('#first');
    await browser.switchToIframe('#second');

    expect(await listSecond.count()).toEqual(3);
    expect(await list.count()).toEqual(0);
    await browser.switchToDefauldIframe();
    expect(await list.count()).toEqual(0);
    expect(await listSecond.count()).toEqual(0);
  });

  it('selectors', async () => {
    await browser.get(selectorsFile);
    expect(await $('body').$('[id="target"]').isDisplayed()).toEqual(true);
    expect(await $('select').$('[id="target"]').isDisplayed()).toEqual(false);
    expect(await $('select').$('xpath=//*[@id="target"]').isDisplayed()).toEqual(true);
    expect(await $('select').$('xpath=.//*[@id="target"]').isDisplayed()).toEqual(false);
    expect(await $('body').$('xpath=.//*[@id="target"]').isDisplayed()).toEqual(true);
  });

  it('getTagName', async () => {
    await browser.get(selectorsFile);
    const select = $('select');
    expect(await select.getTagName()).toEqual('select');
  });

  it('select', async () => {
    await browser.get(selectorsFile);
    const select = $('select');
    await select.selectOption('2');
    expect(await $('#target').getText()).toEqual('2');
  });

  it('maximize', async () => {
    await browser.get(logsFile);
    const sizeBeforeMaximize = await browser.getWindomSize();
    await browser.maximize();
    const sizeAfterMaximize = await browser.getWindomSize();

    console.log(sizeBeforeMaximize, sizeAfterMaximize);
  });

  it('logs', async () => {
    await browser.get(logsFile);
    await browser.sleep(500);
    const logs = JSON.stringify(await browser.getBrowserLogs());
    console.log(logs);
    expect(logs).stringIncludesSubstring('~~~~~~~~~~~~~~~~~~~~~~~~111111111');
  });

  it('openNewTab', async () => {
    await browser.get(formsFile);
    await browser.openNewTab(hoveFocusFile);
    await browser.switchToTab({ index: 1, expectedQuantity: 2 });
    expect(await browser.getCurrentUrl()).toEqual(hoveFocusFile);
    await browser.switchToTab({ index: 0, expectedQuantity: 2 });
    expect(await browser.getCurrentUrl()).toEqual(formsFile);
  });

  it('by js function', async () => {
    await browser.get(formsFile);
    const button = $('form').$$('xpath=//button');
    expect(await button.get(1).getText()).toEqual('Зареєструватися');
  });

  it('by js function', async () => {
    await browser.get(formsFile);
    const email = $(() => document.querySelector('input[placeholder="Ім\'я користувача"]'));

    expect(await email.isDisplayed()).toEqual(true);
    expect(await email.isPresent()).toEqual(true);

    const email1 = $(() => document.querySelector('input[placeholder="Ім\'ssssя користувача"]'));

    expect(await email1.isDisplayed()).toEqual(false);
    expect(await email1.isPresent()).toEqual(false);
  });

  it('by js function with parent', async () => {
    await browser.get(formsFile);
    try {
      const body = $(() => document.querySelector('body'));
      const email = $((parent) => {
        console.log(parent);
        return parent.querySelector('input[placeholder="Ім\'я користувача"]');
      }, body.getEngineElement());

      expect(await email.isDisplayed()).toEqual(true);
      expect(await email.isPresent()).toEqual(true);
    } catch (error) {
      console.log(error);
      await browser.sleep(2500000);
    }
  });

  it('isDisplayed', async () => {
    await browser.get(formsFile);
    const email = $('input[placeholder="Ім\'я lol"]');

    expect(await email.isDisplayed()).toEqual(false);
    expect(await email.isPresent()).toEqual(false);
  });

  it('several browsers', async () => {
    await browser.get(formsFile);
    const email = $('input[placeholder="Ім\'я користувача"]');
    const pass = $('input[placeholder="Пароль"]');

    await browser.runNewBrowser();
    await browser.get('https://google.com');

    expect(await email.isDisplayed()).toEqual(false);
    expect(await pass.isDisplayed()).toEqual(false);

    await browser.switchToBrowser({ index: 0 });

    expect(await email.isDisplayed()).toEqual(true);
    expect(await pass.isDisplayed()).toEqual(true);
    await email.sendKeys('A');
    await pass.sendKeys('B');
    await browser.switchToBrowser({ index: 1 });
    expect(await email.isDisplayed()).toEqual(false);
    expect(await pass.isDisplayed()).toEqual(false);
    await browser.switchToBrowser({ index: 0 });
    expect(await email.isDisplayed()).toEqual(true);
    expect(await pass.isDisplayed()).toEqual(true);
  });

  it('element click/sendKeys', async () => {
    await browser.get(formsFile);
    const email = $('input[placeholder="Ім\'я користувача"]');
    const pass = $('input[placeholder="Пароль"]');
    const signIn = $('.login_form .btn-primary');
    // await browser.actions().keyDown(Key.SHIFT).perform();
    await email.sendKeys(`${Key.SHIFT}a`);
    await signIn.click(true);
  });

  it('execute script str', async () => {
    await browser.get(formsFile);
    await $('input[placeholder="Пароль"]').sendKeys('test');
    const item = await browser.executeScript(([item]) => item.value, [$('input[placeholder="Пароль"]')]);
    expect(item).toEqual('test');
  });

  it('execute script fn', async () => {
    await browser.get(formsFile);
    await $('input[placeholder="Пароль"]').sendKeys('test');
    const item = await browser.executeScript(([item]) => item.value, [$('input[placeholder="Пароль"]')]);
    expect(item).toEqual('test');
  });

  it('execute script els', async () => {
    await browser.get(formsFile);
    const btns = $$('button');
    // @ts-ignore
    const item = await browser.executeScript((items) => Array.from(items).map((i) => i.innerText), btns);
    expect(item).toDeepEqual(['Увійти', 'Зареєструватися', 'Увійти']);
  });

  it('$$ each', async () => {
    const btns = $$('button');
    await btns.each(async (item) => {
      expect(await item.$$('a').count()).toEqual(0);
    });
  });

  it('count', async () => {
    await browser.get(formsFile);
    const notExistingElements = $('.not_existing_item0').$('.not_existing_item1').$$('button');
    expect(await notExistingElements.count()).toEqual(0);
  });

  it('isPresent', async () => {
    await browser.get(formsFile);
    expect(await $('button.super.not.exist').$$('a').get(1).isPresent()).toEqual(false);
    expect(await $$('button').get(0).isPresent()).toEqual(true);
  });

  it('by js function with argument', async () => {
    await browser.get(formsFile);
    expect(
      await $((selector) => {
        return document.querySelector(selector);
      }, 'button').isPresent(),
    ).toEqual(true);
  });

  // DOES NOT WORK with PW
  it.skip('by js as string function with argument', async () => {
    expect(
      await $(
        `js=return ((selector) => {
			return document.querySelector(selector);
		})(arguments[0])`,
        'button',
      ).isPresent(),
    ).toEqual(true);
  });

  // DOES NOT WORK with PW
  it.skip('by js as string function with argument with parent', async () => {
    const body = $('body');
    expect(
      await $(
        `js=return ((selector, root) => {
			return root.querySelector(selector);
		})(arguments[0], arguments[1])`,
        'button',
        body.getEngineElement(),
      ).isPresent(),
    ).toEqual(true);
  });

  it.skip('scrollIntoView', async () => {
    const email = $('input[placeholder="Ім\'я користувача"]');
    const pass = $('input[placeholder="Пароль"]');
    const signIn = $('.login_form .btn-primary');
    await email.sendKeys('admin');
    await pass.sendKeys('admin');
    await signIn.click();
    const lastRow = $$('tr').last();
    const beforeScroll = await lastRow.getRect();
    console.log(beforeScroll);
    await browser.sleep(5500);
    await lastRow.scrollIntoView();
    await browser.sleep(5500);
    const afterScroll = await lastRow.getRect();
    expect(beforeScroll).toNotDeepEqual(afterScroll);
  });

  it('focus', async () => {
    await browser.get(hoveFocusFile);
    const focus = $('#focus');
    await focus.focus();
    // @ts-ignore
    const data = await browser.executeScript(() => document.querySelector('#focus').style.background);
    expect(data).toEqual('pink');
  });

  it('hover', async () => {
    const hover = $('#hover');
    await browser.get(hoveFocusFile);
    await hover.hover();
    // @ts-ignore
    const data = await browser.executeScript(() => document.querySelector('#hover').style.background);
    expect(data).toEqual('red');
  });

  it('screenshot', async () => {
    await browser.get(hoveFocusFile);
    await browser.takeScreenshot();
  });

  it('iframes', async () => {
    await browser.get(framesFile);
    expect(await $('#test').isDisplayed()).toEqual(true);
    await browser.switchToIframe('#test');
    expect(await $('#hover').isDisplayed()).toEqual(true);
    await browser.switchToDefauldIframe();
    expect(await $('#hover').isDisplayed()).toEqual(false);
    expect(await $('#main').isDisplayed()).toEqual(true);
  });
});