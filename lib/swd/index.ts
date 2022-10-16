import { getSeleniumDriver } from './driver';
import { $, $$, By } from './swd_element';
import { browser } from './swd_client';

const seleniumWD = {
  getSeleniumDriver,
  browser,
  $,
  $$,
  By,
};

export { seleniumWD };
