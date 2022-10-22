import { getDriver } from './driver';
import { $, $$ } from './pw_element';
import { browser } from './pw_client';

const playwrightWD = {
  getDriver,
  browser,
  $,
  $$,
};

export { playwrightWD };
