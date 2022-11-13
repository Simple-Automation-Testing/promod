import { Key } from 'selenium-webdriver';
import { expect } from 'assertior';
import { seleniumWD } from '../../lib/index';
import { logsFile, formsFile, hoveFocusFile, framesFile, selectorsFile } from '../misc/setup';

describe('Base', () => {
  const { $, $$, getDriver, browser } = seleniumWD;

  beforeEach(async () => {
    await getDriver(browser);
    await browser.get(formsFile);
  });

  afterEach(async () => {
    await browser.quitAll();
  });

  it('selectors', async () => {
    await browser.get(selectorsFile);
    expect(await $('body').$('[id="target"]').isDisplayed()).toEqual(true);
    expect(await $('select').$('[id="target"]').isDisplayed()).toEqual(false);
    expect(await $('select').$('xpath=//*[@id="target"]').isDisplayed()).toEqual(true);
    expect(await $('select').$('xpath=.//*[@id="target"]').isDisplayed()).toEqual(false);
    expect(await $('body').$('xpath=.//*[@id="target"]').isDisplayed()).toEqual(true);
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

    // console.log(sizeBeforeMaximize, sizeAfterMaximize)
  });

  it('logs', async () => {
    await browser.get(logsFile);
    await browser.sleep(500);
    const logs = JSON.stringify(await browser.getBrowserLogs());
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
    const email = $(() => document.querySelector('input[placeholder="Ім\'я користувача"]'));

    expect(await email.isDisplayed()).toEqual(true);
    expect(await email.isPresent()).toEqual(true);

    const email1 = $(() => document.querySelector('input[placeholder="Ім\'ssssя користувача"]'));

    expect(await email1.isDisplayed()).toEqual(false);
    expect(await email1.isPresent()).toEqual(false);
  });

  it('by js function with parent', async () => {
    const body = $(() => document.querySelector('body'));
    const email = $((parent) => {
      return parent.querySelector('input[placeholder="Ім\'я користувача"]');
    }, body.getEngineElement());

    expect(await email.isDisplayed()).toEqual(true);
    expect(await email.isPresent()).toEqual(true);
  });

  it('isDisplayed', async () => {
    const email = $('input[placeholder="Ім\'я lol"]');

    expect(await email.isDisplayed()).toEqual(false);
    expect(await email.isPresent()).toEqual(false);
  });

  it('several browsers', async () => {
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
    const email = $('input[placeholder="Ім\'я користувача"]');
    const pass = $('input[placeholder="Пароль"]');
    const signIn = $('.login_form .btn-primary');
    await browser.actions().keyDown(Key.SHIFT).perform();
    await email.sendKeys(`${Key.SHIFT}a`);
    await signIn.click(true);
  });

  it('execute script fn', async () => {
    await $('input[placeholder="Пароль"]').sendKeys('test');
    const item = await browser.executeScript(([item]) => item.value, [$('input[placeholder="Пароль"]')]);
    expect(item).toEqual('test');
  });

  it('execute script els', async () => {
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
    const notExistingElements = $('.not_existing_item0').$('.not_existing_item1').$$('button');
    expect(await notExistingElements.count()).toEqual(0);
  });

  it('isPresent', async () => {
    expect(await $('button.super.not.exist').$$('a').get(1).isPresent()).toEqual(false);
    expect(await $$('button').get(0).isPresent()).toEqual(true);
  });

  it('by js function with argument', async () => {
    expect(
      await $((selector) => {
        return document.querySelector(selector);
      }, 'button').isPresent(),
    ).toEqual(true);
  });

  it('by js as string function with argument', async () => {
    expect(
      await $(
        `js=return ((selector) => {
			return document.querySelector(selector);
		})(arguments[0])`,
        'button',
      ).isPresent(),
    ).toEqual(true);
  });

  it('by js as string function with argument with parent', async () => {
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

  it('scrollIntoView', async () => {
    const email = $('input[placeholder="Ім\'я користувача"]');
    const pass = $('input[placeholder="Пароль"]');
    const signIn = $('.login_form .btn-primary');
    await email.sendKeys('admin');
    await pass.sendKeys('admin');
    await signIn.click();
    const lastRow = $$('tr').last();
    const beforeScroll = await lastRow.getRect();
    await browser.sleep(5500);
    await lastRow.scrollIntoView();
    await browser.sleep(5500);
    const afterScroll = await lastRow.getRect();
    expect(beforeScroll).toNotDeepEqual(afterScroll);
  });

  it('focus', async () => {
    const focus = $('#focus');
    await browser.get(hoveFocusFile);
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
