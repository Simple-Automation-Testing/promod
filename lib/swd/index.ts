import { getDriver } from './driver';
import { $, $$, preBindBrowserInstance } from './swd_element';
import { browser } from './swd_client';

const seleniumWD = {
  getDriver,
  browser,
  $,
  $$,
  preBindBrowserInstance,
};

export { seleniumWD };
