import { Key } from 'selenium-webdriver';
import { expect } from 'assertior';
import { playwrightWD } from '../../lib/index';
import * as path from 'path';

describe('Base', () => {
  const { $, $$, getDriver, browser } = playwrightWD;

  beforeEach(async () => {
    await getDriver(browser);
    await browser.get('http://localhost:4000/');
  });

  afterEach(async () => {
    await browser.quitAll();
  });

  it('isDisplayed', async () => {
    const email = $('input[placeholder="Ім\'я lol"]');

    expect(await email.isDisplayed()).toEqual(false);
    expect(await email.isPresent()).toEqual(false);
  });

  it('several browsers', async () => {
    const email = $('input[placeholder="Ім\'я користувача"]');
    const pass = $('input[placeholder="пароль"]');

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
    const pass = $('input[placeholder="пароль"]');
    const signIn = $('.login_form .btn-primary');
    // await browser.actions().keyDown(Key.SHIFT).perform();
    await email.sendKeys(`${Key.SHIFT}a`);
    await signIn.click(true);
  });

  it('execute script str', async () => {
    await $('input[placeholder="пароль"]').sendKeys('test');
    const item = await browser.executeScript(([item]) => item.value, [$('input[placeholder="пароль"]')]);
    expect(item).toEqual('test');
  });

  it('execute script fn', async () => {
    await $('input[placeholder="пароль"]').sendKeys('test');
    const item = await browser.executeScript(([item]) => item.value, [$('input[placeholder="пароль"]')]);
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
      await $(([selector]) => {
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

  it.only('scrollIntoView', async () => {
    const email = $('input[placeholder="Ім\'я користувача"]');
    const pass = $('input[placeholder="пароль"]');
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
    const focus = $('#focus');
    const file = path.resolve(__dirname, '../misc/hover_focus.html');
    await browser.get(`file://${file}`);
    await focus.focus();
    // @ts-ignore
    const data = await browser.executeScript(() => document.querySelector('#focus').style.background);
    expect(data).toEqual('pink');
  });

  it('hover', async () => {
    const hover = $('#hover');
    const file = path.resolve(__dirname, '../misc/hover_focus.html');
    await browser.get(`file://${file}`);
    await hover.hover();
    // @ts-ignore
    const data = await browser.executeScript(() => document.querySelector('#hover').style.background);
    expect(data).toEqual('red');
  });

  it('screenshot', async () => {
    const file = path.resolve(__dirname, '../misc/hover_focus.html');
    await browser.get(`file://${file}`);
    await browser.takeScreenshot();
  });
});
