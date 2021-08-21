import {deepStrictEqual} from 'assert';
import {seleniumWD} from '../lib/index';

describe('Base', () => {
	const {$, $$, getSeleniumDriver, browser} = seleniumWD;

	beforeEach(async () => {
		await getSeleniumDriver(undefined, browser);
		await browser.get('http://localhost:4000/');
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
		deepStrictEqual(item, 'test');
	});

	it('execute script fn', async () => {
		await $('input[placeholder="пароль"]').sendKeys('test');
		const item = await browser.executeScript((item) => item.value, $('input[placeholder="пароль"]'));
		deepStrictEqual(item, 'test');
	});

	it('execute script els', async () => {
		const btns = $$('button');
		// @ts-ignore
		const item = await browser.executeScript((items) => Array.from(items).map((i) => i.innerText), btns);
		deepStrictEqual(item, [
			'Увійти',
			'Зареєструватися',
			'Увійти'
		]);
	});

	it('$$ each', async () => {
		const btns = $$('button');
		await browser.sleep(25000);
		await btns.each(async (item) => {
			deepStrictEqual(await item.$$('a').count(), 0);
		});
	});

	it('isPresent', async () => {
		deepStrictEqual(await $('button.super.not.exist').$$('a').get(1).isPresent(), false);
		deepStrictEqual(await $$('button').get(0).isPresent(), true);
	});
});
