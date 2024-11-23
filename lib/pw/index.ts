import { $, $$, preBindBrowserInstance } from './pw_element';
import { browser } from './pw_client';

const playwrightWD = {
  browser,
  $,
  $$,
  preBindBrowserInstance,
};

export { playwrightWD };
