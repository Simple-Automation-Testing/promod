import {validateSeleniumConf} from '../lib/swd/config';

describe('Base', () => {
	it('[P] validateSeleniumConf', () => {
		validateSeleniumConf({seleniumAddress: '', seleniumSessionId: ''});
	});

	it('[N] validateSeleniumConf', () => {
		validateSeleniumConf({
			// @ts-ignore
			seleniumAddress: {}, seleniumSessionId: ''
		});
	});
});
