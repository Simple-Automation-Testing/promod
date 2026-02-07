import { isString, isObject, isFunction, isPromise } from 'sat-utils';
import { By } from 'selenium-webdriver';
import { customSelectorFilterFn } from '../shared/custom_selector_filter';

import { TCustomSelector } from '../mappers';

const buildBy = (
  selector: string | By | TCustomSelector | ((...args: any[]) => any) | Promise<any>,
  getExecuteScriptArgs: () => unknown[] = () => [],
  parent?: unknown,
  toMany?: boolean,
): By => {
  if (selector instanceof By) {
    return selector;
  }

  if (isString(selector) && (selector as string).includes('xpath=')) {
    return By.xpath((selector as string).replace('xpath=', ''));
  } else if (isPromise(selector)) {
    return selector as any;
  } else if (isFunction(selector)) {
    return By.js(selector as any, ...getExecuteScriptArgs()) as any;
  } else if (isObject(selector)) {
    const item = selector as TCustomSelector;

    return By.js(
      customSelectorFilterFn,
      [parent, { ...item, toMany }],
    ) as any;
  }

  return By.css(selector as string);
};

export { buildBy };
