import { $, $$, preBindBrowserInstance } from './swd_element';
import { browser } from './swd_client';

const seleniumWD = {
  browser,
  $,
  $$,
  preBindBrowserInstance,
};

export { seleniumWD };
