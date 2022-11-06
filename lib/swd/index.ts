import { getDriver } from './driver';
import { $, $$ } from './swd_element';
import { browser } from './swd_client';

const seleniumWD = {
  getDriver,
  browser,
  $,
  $$,
};

export { seleniumWD };
