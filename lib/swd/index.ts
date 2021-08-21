import {getSeleniumDriver} from './driver';
import {$, $$, PromodSeleniumElement, PromodSeleniumElements, By} from './swd_element';
import {browser} from './swd_client';

const seleniumWD = {
	getSeleniumDriver,
	browser,
	$,
	$$,
	By,
	PromodSeleniumElement,
	PromodSeleniumElements,
};

export {
	seleniumWD,
};
