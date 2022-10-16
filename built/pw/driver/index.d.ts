import { Browser as PWBrowser } from 'playwright-core';
import { BaseConfPW } from '../config/config';
import { Browser } from '../pw_client';
declare function getDriver(config?: BaseConfPW | Browser, browser?: Browser): Promise<PWBrowser>;
export { getDriver };
