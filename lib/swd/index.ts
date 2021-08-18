import {getSeleniumDriver} from './driver';
import {$, $$, PromodSeleniumElement, PromodSeleniumElements} from './swd_element';
import {browser} from './swd_client';

const seleniumWD = {
	getSeleniumDriver,
	browser,
	$,
	$$,
	PromodSeleniumElement,
	PromodSeleniumElements,
};

export {
	seleniumWD,
};
