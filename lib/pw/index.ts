import { getDriver } from './driver';
import { $, $$, PromodElement, PromodElements } from './pw_element';
import { browser } from './pw_client';

const playwrightWD = {
  getDriver,
  browser,
  $,
  $$,
  PromodElement,
  PromodElements,
};

export { playwrightWD };
