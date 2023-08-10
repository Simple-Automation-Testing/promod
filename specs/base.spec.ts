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
  scrollFile,
} from './setup';

describe('Base', () => {
  const { $, $$, getDriver, browser } = engine;

  before(async () => {
    await getDriver(browser);
  });

  after(async () => {
    await browser.quitAll();
  });

  it('switchToBrowserTab', async () => {
    await browser.get(scrollFile);
    await waitForCondition(() => $('body').isDisplayed());
    await browser.openNewTab(actionFile);
    await browser.switchToTab({ index: 1, expectedQuantity: 2 });
    expect(await browser.getCurrentUrl()).toEqual(actionFile);
    await browser.close();
    await browser.switchToTab({ index: 0, expectedQuantity: 1 });
    expect(await browser.getCurrentUrl()).toEqual(scrollFile);
  });

  it('browser scroll element by mouse whell', async () => {
    await browser.get(scrollFile);
    await waitForCondition(() => $$('[class="scroll_item"]').get(4).isDisplayed());
    const elementToScroll = $$('[class="scroll_item"]').get(4);
    const beforeScroll = await elementToScroll.getRect();
    await sleep(500);
    await browser.scrollElementByMouseWheel(elementToScroll, 0, 0, 0, 200, 200);
    await sleep(500);
    const afterScroll = await elementToScroll.getRect();

    expect(beforeScroll).toNotDeepEqual(afterScroll);
  });

  it('browser windows indexes', async () => {
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

  it('browser windows title and urls', async () => {
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
    expect(await waitForCondition(() => $('body').$('[id="target"]').isDisplayed())).toEqual(true);
    expect(await $('select').$('[id="target"]').isDisplayed()).toEqual(false);
    expect(await $('select').$('xpath=//*[@id="target"]').isDisplayed()).toEqual(true);
    expect(await $('select').$('xpath=.//*[@id="target"]').isDisplayed()).toEqual(false);
    expect(await $('body').$('xpath=.//*[@id="target"]').isDisplayed()).toEqual(true);
  });

  it('getTagName', async () => {
    await browser.get(selectorsFile);
    const select = $('select');
    await waitForCondition(() => select.isDisplayed());
    expect(await select.getTagName()).toEqual('select');
  });

  it('select', async () => {
    await browser.get(selectorsFile);
    const select = $('select');
    await waitForCondition(() => select.isDisplayed());
    await select.selectOption('2');
    expect(await $('#target').getText()).toEqual('2');
  });

  it('maximize', async () => {
    await browser.get(logsFile);
    await waitForCondition(() => $('body').isDisplayed());
    const sizeBeforeMaximize = await browser.getWindomSize();
    await browser.maximize();
    const sizeAfterMaximize = await browser.getWindomSize();

    console.log(sizeBeforeMaximize, sizeAfterMaximize);
  });

  it('logs', async () => {
    await browser.get(logsFile);
    await browser.sleep(500);
    const logs = JSON.stringify(await browser.getBrowserLogs());
    expect(logs).stringIncludesSubstring('~~~~~~~~~~~~~~~~~~~~~~~~111111111');
  });

  it('openNewTab/switchToTab', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('body').isDisplayed());
    await browser.openNewTab(hoverFocusFile);
    await waitForCondition(() => $('body').isDisplayed());
    await browser.switchToTab({ index: 1, expectedQuantity: 2 });
    expect(await browser.getCurrentUrl()).toEqual(hoverFocusFile);
    await browser.switchToTab({ index: 0, expectedQuantity: 2 });
    expect(await browser.getCurrentUrl()).toEqual(formsFile);
  });

  it('by js function', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('form').$$('xpath=//button').count());
    const buttons = $('form').$$('xpath=//button');
    expect(await buttons.get(1).getText()).toEqual('Зареєструватися');
  });

  it('by js function', async () => {
    await browser.get(formsFile);
    const email = $(() => document.querySelector('input[placeholder="Ім\'я користувача"]'));

    expect(await waitForCondition(() => email.isDisplayed())).toEqual(true);
    expect(await email.isPresent()).toEqual(true);

    const email1 = $(() => document.querySelector('input[placeholder="Ім\'ssssя користувача"]'));

    expect(await email1.isDisplayed()).toEqual(false);
    expect(await email1.isPresent()).toEqual(false);
  });

  it('by js function with parent', async () => {
    await browser.get(formsFile);
    try {
      const body = $(() => document.querySelector('body'));
      await waitForCondition(() => body.isDisplayed());
      const email = $((parent) => {
        return parent.querySelector('input[placeholder="Ім\'я користувача"]');
      }, body.getEngineElement());

      expect(await waitForCondition(() => email.isDisplayed())).toEqual(true);
      expect(await email.isPresent()).toEqual(true);
    } catch (error) {
      console.log(error);
      await browser.sleep(2500000);
    }
  });

  it('by js function from parent with parent', async () => {
    await browser.get(formsFile);
    try {
      const body = $(() => {
        return document.querySelector('body');
      });

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

  it('several browsers by browser name', async () => {
    await browser.get(formsFile);

    await browser.runNewBrowser({ currentBrowserName: 'initial one', newBrowserName: 'google' });
    await browser.get('https://google.com');
    await waitForCondition(() => $('body').isDisplayed());
    expect(await browser.getTitle()).stringIncludesSubstring('Google');

    await browser.switchToBrowser({ browserName: 'initial one' });
    expect(await browser.getTitle()).stringIncludesSubstring('FORMS');
  });

  it('element click/sendKeys', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('body').isDisplayed());
    const email = $('input[placeholder="Ім\'я користувача"]');
    const pass = $('input[placeholder="Пароль"]');
    const signIn = $('.login_form .btn-primary');
    // await browser.actions().keyDown(Key.SHIFT).perform();
    await email.sendKeys(`${Key.SHIFT}a`);
    await signIn.click();
  });

  it('execute script str', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('body').isDisplayed());
    await $('input[placeholder="Пароль"]').sendKeys('test');
    const item = await browser.executeScript(([item]) => item.value, [$('input[placeholder="Пароль"]')]);
    expect(item).toEqual('test');
  });

  it('execute script fn', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('body').isDisplayed());
    await $('input[placeholder="Пароль"]').sendKeys('test');
    const item = await browser.executeScript(([item]) => item.value, [$('input[placeholder="Пароль"]')]);
    expect(item).toEqual('test');
  });

  it('execute script els', async () => {
    await browser.get(formsFile);
    const btns = $$('button');
    await waitForCondition(() => $('body').isDisplayed());
    // @ts-ignore
    const item = await browser.executeScript((items) => Array.from(items).map((i) => i.innerText), btns);
    expect(item).toDeepEqual(['Увійти', 'Зареєструватися', 'Увійти']);
  });

  it('$$ each', async () => {
    const btns = $$('button');
    await waitForCondition(() => $('body').isDisplayed());
    await btns.each(async (item) => {
      expect(await item.$$('a').count()).toEqual(0);
    });
  });

  it.only('$$ map', async () => {
    await browser.get(formsFile);
    const btns = $$('button');

    await waitForCondition(() => $('body').isDisplayed());

    const result = await btns.map(async (item) => {
      return await item.getText();
    });
    console.log(result, '<')
  });

  it('count', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('body').isDisplayed());
    const notExistingElements = $('.not_existing_item0').$('.not_existing_item1').$$('button');
    expect(await notExistingElements.count()).toEqual(0);
  });

  it('isPresent', async () => {
    await browser.get(formsFile);
    await waitForCondition(() => $('body').isDisplayed());
    expect(await $('button.super.not.exist').$$('a').get(1).isPresent()).toEqual(false);
    expect(await $$('button').get(0).isPresent()).toEqual(true);
  });

  it('by js function with argument', async () => {
    await browser.get(formsFile);
    expect(
      await waitForCondition(() =>
        $((selector) => {
          return document.querySelector(selector);
        }, 'button').isPresent(),
      ),
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
    await browser.sleep(5500);
    await lastRow.scrollIntoView();
    await browser.sleep(5500);
    const afterScroll = await lastRow.getRect();
    expect(beforeScroll).toNotDeepEqual(afterScroll);
  });

  it('click', async () => {
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

  it('focus', async () => {
    await browser.get(hoverFocusFile);
    await waitForCondition(() => $('body').isDisplayed());
    const focus = $('#focus');
    await focus.focus();
    // @ts-ignore
    const data = await browser.executeScript(() => document.querySelector('#focus').style.background);
    expect(data).toEqual('pink');
  });

  it('hover', async () => {
    const hover = $('#hover');
    await browser.get(hoverFocusFile);
    await waitForCondition(() => $('body').isDisplayed());
    await hover.hover();
    // @ts-ignore
    const data = await browser.executeScript(() => document.querySelector('#hover').style.background);
    expect(data).toEqual('red');
  });

  it('screenshot', async () => {
    await browser.get(hoverFocusFile);
    await browser.takeScreenshot();
  });

  it('iframes', async () => {
    await browser.get(framesFile);
    await waitForCondition(() => $('body').isDisplayed());
    expect(await $('#test').isDisplayed()).toEqual(true);
    await browser.switchToIframe('#test');
    await waitForCondition(() => $('body').isDisplayed());
    expect(await $('#hover').isDisplayed()).toEqual(true);
    await browser.switchToDefauldIframe();
    await waitForCondition(() => $('body').isDisplayed());
    expect(await $('#hover').isDisplayed()).toEqual(false);
    expect(await $('#main').isDisplayed()).toEqual(true);
  });
});
