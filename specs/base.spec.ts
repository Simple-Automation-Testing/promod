import { sleep, waitForCondition } from 'sat-utils';
import {
  engine,
  expect,
  Key,
  iframesFile,
  logsFile,
  formsFile,
  hoverFocusFile,
  framesFile,
  selectorsFile,
  actionFile,
  pressFile,
  scrollFile,
  invisibleFile,
  visibleFile,
} from './setup';
import { KeysSWD } from '../lib/mappers';

describe('Base', () => {
  const { $, $$, getDriver, browser } = engine;

  before(async () => {
    await getDriver(browser);
  });

  after(async () => {
    await browser.quitAll();
  });

  it('[P] get only visible elements', async () => {
    await browser.get(visibleFile);
    await waitForCondition(() => $('body').isDisplayed());

    const fromRoot = await $$('li')
      .getAllVisible()
      .map(async (li) => li.getText());

    expect(fromRoot).toDeepEqual(['1', '3']);

    const fromParent = await $('body')
      .$$('ul')
      .getFirstVisible()
      .$$('li')
      .getAllVisible()
      .map(async (li) => li.getText());

    expect(fromParent).toDeepEqual(fromRoot);
  });

  it('[P] element custom', async () => {
    await browser.get(hoverFocusFile);
    await waitForCondition(() => $('body').isDisplayed());
    await $({ query: 'button', rg: 'us' }).focus();
    // @ts-ignore
    const data = await browser.executeScript(() => document.querySelector('#focus').style.background);
    expect(data).toEqual('pink');
  });

  it('[N] element custom', async () => {
    await browser.get(hoverFocusFile);
    let err;
    try {
      await waitForCondition(() => $('body').isDisplayed());

      await $({ query: 'button', rg: 'us113213' }).click();
    } catch (error) {
      err = error;
    }

    expect(err).toNotEqual(undefined);
  });

  it('[P] element custom nested', async () => {
    await browser.get(hoverFocusFile);
    await waitForCondition(() => $('body').isDisplayed());
    await $('.actions').$({ query: 'button', rg: 'us' }).focus();
    // @ts-ignore
    const data = await browser.executeScript(() => document.querySelector('#focus').style.background);
    expect(data).toEqual('pink');
  });

  it('[P] element custom nested simple query', async () => {
    await browser.get(hoverFocusFile);
    await waitForCondition(() => $('body').isDisplayed());
    const txt = await $('.actions').$({ query: 'div' }).getText();
    expect(txt).toEqual('nested div');
  });

  it('[P] element custom nested with index', async () => {
    await browser.get(hoverFocusFile);
    await waitForCondition(() => $('body').isDisplayed());
    await $('.actions').$$({ query: 'button', rg: 'us' }).get(0).focus();
    // @ts-ignore
    const data = await browser.executeScript(() => document.querySelector('#focus').style.background);
    expect(data).toEqual('pink');
  });

  it('[N] element custom nested with index', async () => {
    await browser.get(hoverFocusFile);
    let err;

    try {
      await waitForCondition(() => $('body').isDisplayed());
      await $('.actions').$$({ query: 'button', rg: 'udlaskld;s' }).get(0).focus();
    } catch (error) {
      err = error;
    }

    expect(err).toNotEqual(undefined);
  });

  it('[N] element custom nested', async () => {
    await browser.get(hoverFocusFile);
    let err;
    try {
      await waitForCondition(() => $('body').isDisplayed());
      await $('.actions').$({ query: 'button', rg: 'us113213' }).focus();
    } catch (error) {
      err = error;
    }

    expect(err).toNotEqual(undefined);
  });

  it('[N] element custom nested bad parent', async () => {
    await browser.get(hoverFocusFile);
    let err;
    try {
      await waitForCondition(() => $('body').isDisplayed());
      await $('.action123s').$({ query: 'button', rg: 'us' }).focus();
      // @ts-ignore
      const data = await browser.executeScript(() => document.querySelector('#focus').style.background);
      expect(data).toEqual('pink');
    } catch (error) {
      err = error;
    }

    expect(err).toNotEqual(undefined);
  });

  it('[P] elements custom nested', async () => {
    await browser.get(hoverFocusFile);
    await waitForCondition(() => $('body').isDisplayed());
    expect(await $('.actions').$$({ query: 'button', rg: 'us' }).count()).toEqual(1);
  });

  it('[P] elements custom', async () => {
    await browser.get(hoverFocusFile);
    await waitForCondition(() => $('body').isDisplayed());
    const els = $$({ query: 'button', rg: 'us' });
    expect(await els.count()).toEqual(1);
  });

  it('[P] element actions', async () => {
    await browser.get(hoverFocusFile);
    await waitForCondition(() => $('#dclick').isPresent());
    await $('#dclick').doubleClick();
    // @ts-ignore
    const data = await browser.executeScript(() => document.querySelector('#dclick').style.background);
    expect(data).toEqual('yellow');
  });

  it.skip('invisible element actions', async () => {
    await browser.get(invisibleFile);
    await waitForCondition(() => $('button').isPresent());
    await $('button').click({
      withScroll: true,
      allowForceIfIntercepted: true,
      clickCount: 1,
      timeout: 15_000,
      noWaitAfter: true,
    });
  });

  it('[P] keys press', async () => {
    await browser.get(pressFile);
    await waitForCondition(() => $('body').isDisplayed());
    const checker = $('div#hold');
    const field = $('input');
    await field.sendKeys(KeysSWD.Enter);
    expect(await checker.getText()).toEqual('Enter');
  });

  it('[P] switchToBrowserTab', async () => {
    await browser.get(scrollFile);
    await waitForCondition(() => $('body').isDisplayed());
    await browser.openNewTab(actionFile);
    await browser.switchToTab({ index: 1, expectedQuantity: 2 });
    expect(await browser.getCurrentUrl()).toEqual(actionFile);
    await browser.close();
    await browser.switchToTab({ index: 0, expectedQuantity: 1 });
    expect(await browser.getCurrentUrl()).toEqual(scrollFile);
  });

  it('[P] browser scroll element by mouse whell', async () => {
    await browser.get(scrollFile);
    await waitForCondition(() => $$('[class="scroll_item"]').get(4).isDisplayed(), { message: (t, e) => `${e}` });
    const elementToScroll = $$('[class="scroll_item"]').get(4);
    const beforeScroll = await elementToScroll.getRect();
    await sleep(500);
    await browser.scrollElementByMouseWheel(elementToScroll, 0, 0, 0, 200, 200);
    await sleep(500);
    const afterScroll = await elementToScroll.getRect();

    expect(beforeScroll).toNotDeepEqual(afterScroll);
  });

  it('[P] browser windows indexes', async () => {
    await browser.get(iframesFile);
    await waitForCondition(() => $('body').isDisplayed());
    await browser.runNewBrowser();
    await browser.get(actionFile);
    await waitForCondition(() => $('body').isDisplayed());
    await browser.runNewBrowser();
    await browser.get(formsFile);
    await waitForCondition(() => $('body').isDisplayed());

    await browser.switchToBrowser({ index: 0 });
    expect(await browser.getTitle()).toEqual('IFRAMES');
    expect(await browser.getCurrentUrl()).stringIncludesSubstring(iframesFile);

    await browser.switchToBrowser({ index: 2 });
    expect(await browser.getTitle()).toEqual('FORMS');
    expect(await browser.getCurrentUrl()).stringIncludesSubstring(formsFile);

    await browser.switchToBrowser({ index: 1 });
    expect(await browser.getTitle()).toEqual('ACTIONS');
    expect(await browser.getCurrentUrl()).stringIncludesSubstring(actionFile);

    await browser.switchToBrowser({ index: 2 });
    await browser.quit();
    await browser.switchToBrowser({ index: 1 });
    await browser.quit();
    await browser.switchToBrowser({ index: 0 });
  });

  it('[P] browser windows title and urls', async () => {
    await browser.get(iframesFile);
    await browser.runNewBrowser();
    await browser.get(actionFile);
    await browser.runNewBrowser();
    await browser.get(formsFile);

    await browser.switchToBrowser({ title: 'IFRAMES', timeout: 500 });
    expect(await browser.getTitle()).toEqual('IFRAMES');
    expect(await browser.getCurrentUrl()).stringIncludesSubstring(iframesFile);

    await browser.switchToBrowser({ title: 'FORMS', timeout: 500 });
    expect(await browser.getTitle()).toEqual('FORMS');
    expect(await browser.getCurrentUrl()).stringIncludesSubstring(formsFile);

    await browser.quit();
    await browser.switchToBrowser({ title: 'ACTIONS' });
    expect(await browser.getTitle()).toEqual('ACTIONS');
    expect(await browser.getCurrentUrl()).stringIncludesSubstring(actionFile);

    await browser.quit();
    await browser.switchToBrowser({ title: 'IFRAMES', timeout: 500 });
    expect(await browser.getTitle()).toEqual('IFRAMES');
    expect(await browser.getCurrentUrl()).stringIncludesSubstring(iframesFile);
  });

  it('[P] selectors', async () => {
    await browser.get(selectorsFile);
    expect(await waitForCondition(() => $('body').$('[id="target"]').isDisplayed())).toEqual(true);
    expect(await $('select').$('[id="target"]').isDisplayed()).toEqual(false);
    expect(await $('select').$('xpath=//*[@id="target"]').isDisplayed()).toEqual(true);
    expect(await $('select').$('xpath=.//*[@id="target"]').isDisplayed()).toEqual(false);
    expect(await $('body').$('xpath=.//*[@id="target"]').isDisplayed()).toEqual(true);
  });

  it('[P] selectors ignore-parent', async () => {
    await browser.get(selectorsFile);
    expect(await waitForCondition(() => $('body').$('[id="target"]').isDisplayed())).toEqual(true);
    expect(await $('select').$('[id="target"]').isDisplayed()).toEqual(false);
    expect(await $('select').$('ignore-parent=[id="target"]').isDisplayed()).toEqual(true);
    expect(await $('select').$('[id="target"]').isDisplayed()).toEqual(false);
  });

  it('[P] getTagName', async () => {
    await browser.get(selectorsFile);
    const select = $('select');
    await waitForCondition(() => select.isDisplayed());
    expect(await select.getTagName()).toEqual('select');
  });

  it('[P] select', async () => {
    await browser.get(selectorsFile);
    const select = $('select');
    await waitForCondition(() => select.isDisplayed());
    await select.selectOption('2');
    expect(await $('#target').getText()).toEqual('2');
  });

  it('[P] maximize', async () => {
    await browser.get(logsFile);
    await waitForCondition(() => $('body').isDisplayed());
    const sizeBeforeMaximize = await browser.getWindomSize();
    await browser.maximize();
    const sizeAfterMaximize = await browser.getWindomSize();

    console.log(sizeBeforeMaximize, sizeAfterMaximize);
  });

  it('[P] logs', async () => {
    await browser.get(logsFile);
    await browser.sleep(500);
    const logs = JSON.stringify(await browser.getBrowserLogs());
    expect(logs).stringIncludesSubstring('~~~~~~~~~~~~~~~~~~~~~~~~111111111');
  });

  it('[P] openNewTab/switchToTab', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('body').isDisplayed());
    await browser.openNewTab(hoverFocusFile);
    await waitForCondition(() => $('body').isDisplayed());
    await browser.switchToTab({ index: 1, expectedQuantity: 2 });
    expect(await browser.getCurrentUrl()).toEqual(hoverFocusFile);
    await browser.switchToTab({ index: 0, expectedQuantity: 2 });
    expect(await browser.getCurrentUrl()).toEqual(formsFile);
  });

  it('[P] nested xpath', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('form').$$('xpath=//button').count());
    const buttons = $('form').$$('xpath=//button');
    expect(await buttons.get(1).getText()).toEqual('Зареєструватися');
  });

  it('[P] by js function', async () => {
    await browser.get(formsFile);
    const email = $(() => document.querySelector('input[placeholder="Ім\'я користувача"]'));

    expect(await waitForCondition(() => email.isDisplayed())).toEqual(true);
    expect(await email.isPresent()).toEqual(true);

    const email1 = $(() => document.querySelector('input[placeholder="Ім\'ssssя користувача"]'));

    expect(await email1.isDisplayed()).toEqual(false);
    expect(await email1.isPresent()).toEqual(false);
  });

  it('[P] by js function with parent', async () => {
    await browser.get(formsFile);
    try {
      const body = $(() => document.querySelector('body')).$('form.login_form');

      await waitForCondition(() => body.isDisplayed());
      const email = $((parent) => {
        return parent.querySelector('input[placeholder="Ім\'я користувача"]');
      }, body.getEngineElement());

      expect(await waitForCondition(() => email.isDisplayed())).toEqual(true);
      expect(await email.isPresent()).toEqual(true);
      expect(await email.getAttribute('placeholder')).toEqual("Ім'я користувача");
    } catch (error) {
      console.log(error);
      await browser.sleep(2500000);
    }
  });

  it('[P] by js function from parent with parent', async () => {
    await browser.get(formsFile);
    try {
      const body = $(() => document.querySelector('body'));

      expect(await waitForCondition(() => body.isDisplayed())).toEqual(true, 'Bodu should be visible');

      const email = body.$((parent) => {
        return parent.querySelector('input[placeholder="Ім\'я користувача"]');
      }, body);

      const emails = body.$$((parent) => {
        return parent.querySelectorAll('input[placeholder="Ім\'я користувача"]');
      }, body.getEngineElement());

      expect(await email.getTagName()).toEqual('input');
      expect(await email.isDisplayed()).toEqual(true);
      expect(await email.isPresent()).toEqual(true);
      expect(await emails.count()).toEqual(1);
    } catch (error) {
      console.log(error);
      await browser.sleep(2500000);
    }
  });

  it('[P] isDisplayed', async () => {
    await browser.get(formsFile);
    const email = $('input[placeholder="Ім\'я lol"]');

    expect(await email.isDisplayed()).toEqual(false);
    expect(await email.isPresent()).toEqual(false);
  });

  it('[P] several browsers', async () => {
    await browser.get(formsFile);
    const email = $('input[placeholder="Ім\'я користувача"]');
    const pass = $('input[placeholder="Пароль"]');

    await browser.runNewBrowser();
    await browser.get('https://google.com');

    expect(await email.isDisplayed()).toEqual(false);
    expect(await pass.isDisplayed()).toEqual(false);

    await browser.switchToBrowser({ title: 'FORMS' });

    expect(await email.isDisplayed()).toEqual(true);
    expect(await pass.isDisplayed()).toEqual(true);
    await email.sendKeys('A');
    await pass.sendKeys('B');
    await browser.switchToBrowser({ title: 'Google' });
    expect(await email.isDisplayed()).toEqual(false);
    expect(await pass.isDisplayed()).toEqual(false);
    await browser.switchToBrowser({ title: 'FORMS' });
    expect(await email.isDisplayed()).toEqual(true);
    expect(await pass.isDisplayed()).toEqual(true);
  });

  it('[P] several browsers by browser name', async () => {
    await browser.get(formsFile);

    await browser.runNewBrowser({ currentBrowserName: 'initial one', newBrowserName: 'google' });
    await browser.get('https://google.com');
    await waitForCondition(() => $('body').isDisplayed());
    expect(await browser.getTitle()).stringIncludesSubstring('Google');

    await browser.switchToBrowser({ browserName: 'initial one' });
    expect(await browser.getTitle()).stringIncludesSubstring('FORMS');
  });

  it('[P] element click/sendKeys', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('body').isDisplayed());
    const email = $('input[placeholder="Ім\'я користувача"]');
    const pass = $('input[placeholder="Пароль"]');
    const signIn = $('.login_form .btn-primary');
    // await browser.actions().keyDown(Key.SHIFT).perform();
    await email.sendKeys(`${Key.SHIFT}a`);
    await signIn.click();
  });

  it('[P] execute script fn', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('body').isDisplayed());
    await $('input[placeholder="Пароль"]').sendKeys('test');
    const item = await browser.executeScript(([item]) => item.value, [$('input[placeholder="Пароль"]')]);
    expect(item).toEqual('test');
  });

  it('[P] execute script els', async () => {
    await browser.get(formsFile);
    const btns = $$('button');
    await waitForCondition(() => $('body').isDisplayed());
    // @ts-ignore
    const item = await browser.executeScript((items) => Array.from(items).map((i) => i.innerText), btns);
    expect(item).toDeepEqual(['Увійти', 'Зареєструватися', 'Увійти']);
  });

  it('[P] $$ each', async () => {
    const btns = $$('button');
    await waitForCondition(() => $('body').isDisplayed());
    await btns.each(async (item) => {
      expect(await item.$$('a').count()).toEqual(0);
    });
  });

  it('[P] $$ every', async () => {
    await browser.get(formsFile);
    const btns = $$('button');

    await waitForCondition(() => $('body').isDisplayed());

    const result = await btns.every(async (item) => {
      return await item.isDisplayed();
    });
    expect(result).toDeepEqual(true);
  });

  it('[P] $$ some', async () => {
    await browser.get(formsFile);
    const btns = $$('button');

    await waitForCondition(() => $('body').isDisplayed());

    const result = await btns.some(async (item) => {
      return await item.isDisplayed();
    });
    expect(result).toDeepEqual(true);
  });

  it('[P] $$ map', async () => {
    await browser.get(formsFile);
    const btns = $$('button');

    await waitForCondition(() => $('body').isDisplayed());

    const result = await btns.map(async (item) => {
      return await item.getText();
    });
    expect(result).toDeepEqual(['Увійти', 'Зареєструватися', 'Увійти']);
  });

  it('[P] count', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('body').isDisplayed());
    const notExistingElements = $('.not_existing_item0').$('.not_existing_item1').$$('button');
    expect(await notExistingElements.count()).toEqual(0);
  });

  it('[P] isPresent', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('body').isDisplayed());
    expect(await $('button.super.not.exist').$$('a').get(1).isPresent()).toEqual(false);
    expect(await $$('button').get(0).isPresent()).toEqual(true);
  });

  it('[P] by js function with argument', async () => {
    await browser.get(formsFile);
    expect(
      await waitForCondition(() =>
        $((selector) => {
          return document.querySelector(selector);
        }, 'button').isPresent(),
      ),
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
    await browser.sleep(5500);
    await lastRow.scrollIntoView();
    await browser.sleep(5500);
    const afterScroll = await lastRow.getRect();
    expect(beforeScroll).toNotDeepEqual(afterScroll);
  });

  it('[P] click', async () => {
    const clickElement = $('#click');
    const positions = [
      'center',
      'center-top',
      'center-bottom',
      'center-right',
      'center-left',
      'right-top',
      'right-bottom',
      'left-top',
      'left-bottom',
    ];
    for (const position of positions) {
      await browser.get(hoverFocusFile);
      await waitForCondition(() => $('body').isDisplayed());
      await clickElement.clickByElementCoordinate(position as any);
      // @ts-ignore
      const data = await browser.executeScript(() => document.querySelector('#click').style.background);
      expect(data).toEqual('black');
    }
  });

  it('[P] focus', async () => {
    await browser.get(hoverFocusFile);
    await waitForCondition(() => $('body').isDisplayed());
    const focus = $('#focus');
    await focus.focus();
    // @ts-ignore
    const data = await browser.executeScript(() => document.querySelector('#focus').style.background);
    expect(data).toEqual('pink');
  });

  it('[P] hover', async () => {
    const hover = $('#hover');
    await browser.get(hoverFocusFile);
    await waitForCondition(() => $('body').isDisplayed());
    await hover.hover();
    // @ts-ignore
    const data = await browser.executeScript(() => document.querySelector('#hover').style.background);
    expect(data).toEqual('red');
  });

  it('[P] screenshot', async () => {
    await browser.get(hoverFocusFile);
    await browser.takeScreenshot();
  });

  it('[P] iframes nested', async () => {
    await browser.get(iframesFile);

    await waitForCondition(() => $('[name="first"]').isDisplayed());
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

  it('[P] iframes', async () => {
    const resulter = $('body').$('#resulter');
    await browser.get(framesFile);
    await waitForCondition(() => $('body').isDisplayed());
    expect(await $('#test').isDisplayed()).toEqual(true);
    await browser.switchToIframe('#test');
    await waitForCondition(() => resulter.isDisplayed());
    await browser.executeScript((...args) => console.log(...args), [resulter.getEngineElement()]);
    expect(await $('#hover').isDisplayed()).toEqual(true);
    await browser.switchToDefauldIframe();
    await waitForCondition(() => $('body').isDisplayed());
    expect(await $('#hover').isDisplayed()).toEqual(false);
    expect(await $('#main').isDisplayed()).toEqual(true);
  });
});
