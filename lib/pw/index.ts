import { getDriver } from './driver';
import { $, $$, preBindBrowserInstance } from './pw_element';
import { browser } from './pw_client';

const playwrightWD = {
  getDriver,
  browser,
  $,
  $$,
  preBindBrowserInstance,
};

export { playwrightWD };
