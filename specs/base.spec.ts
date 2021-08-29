import {expect} from 'assertior';
import {seleniumWD} from '../lib/index';

describe('Base', () => {
	const {$, $$, getSeleniumDriver, browser} = seleniumWD;

	beforeEach(async () => {
		await getSeleniumDriver({seleniumAddress: 'http://localhost:4444/wd/hub'}, browser);
		await browser.get('http://localhost:4000/');
		await browser.Key.ENTER
	});

	afterEach(async () => {
		await browser.quit();
	});

	it('element click/sendKeys', async () => {
		const email = $('input[placeholder="Ім\'я користувача"]');
		const pass = $('input[placeholder="пароль"]');
		const signIn = $('.login_form .btn-primary');
		await email.sendKeys('admin');
		await pass.sendKeys('admin');
		await signIn.click();
	});

	it('execute script str', async () => {
		await $('input[placeholder="пароль"]').sendKeys('test');
		const item = await browser.executeScript('return arguments[0].value', $('input[placeholder="пароль"]'));
		expect(item).toEqual('test');
	});

	it('execute script fn', async () => {
		await $('input[placeholder="пароль"]').sendKeys('test');
		const item = await browser.executeScript((item) => item.value, $('input[placeholder="пароль"]'));
		expect(item).toEqual('test');
	});

	it('execute script els', async () => {
		const btns = $$('button');
		// @ts-ignore
		const item = await browser.executeScript((items) => Array.from(items).map((i) => i.innerText), btns);
		expect(item).toDeepEqual([
			'Увійти',
			'Зареєструватися',
			'Увійти'
		]);
	});

	it('$$ each', async () => {
		const btns = $$('button');
		await btns.each(async (item) => {
			expect(await item.$$('a').count()).toEqual(0);
		});
	});

	it('isPresent', async () => {
		expect(await $('button.super.not.exist').$$('a').get(1).isPresent()).toEqual(false);
		expect(await $$('button').get(0).isPresent()).toEqual(true);
	});

	it('by js function with argument', async () => {
		expect(await $((selector) => {
			return document.querySelector(selector);
		}, 'button').isPresent()).toEqual(true);
	});

	it('by js as string function with argument', async () => {
		expect(await $(`js=return ((selector) => {
			return document.querySelector(selector);
		})(arguments[0])`, 'button').isPresent()).toEqual(true);
	});

	it('by js as string function with argument with parent', async () => {
		const body = $('body');
		expect(await $(`js=return ((selector, root) => {
			return root.querySelector(selector);
		})(arguments[0], arguments[1])`, 'button', body.getWebDriverElement()).isPresent()).toEqual(true);
	});
});
