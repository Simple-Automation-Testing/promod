import { getSeleniumDriver } from './driver';
import { $, $$ } from './swd_element';
import { browser } from './swd_client';

const seleniumWD = {
  getSeleniumDriver,
  browser,
  $,
  $$,
};

export { seleniumWD };
