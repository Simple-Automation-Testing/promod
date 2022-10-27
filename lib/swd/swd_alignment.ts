import { isString, isFunction, isPromise } from 'sat-utils';
import { By } from 'selenium-webdriver';

const buildBy = (selector: string | By, getExecuteScriptArgs?: () => any[]): By => {
  if (selector instanceof By) {
    return selector;
  }

  getExecuteScriptArgs = isFunction(getExecuteScriptArgs) ? getExecuteScriptArgs : () => [];

  if (isString(selector) && (selector as string).includes('xpath=')) {
    return By.xpath((selector as string).replace('xpath=', ''));
    /**
     * @depreacted
     */
  } else if (isString(selector) && (selector as string).includes('js=')) {
    /**
     * @depreacted
     */
    return By.js((selector as string).replace('js=', ''), ...getExecuteScriptArgs()) as any;
  } else if (isPromise(selector)) {
    return selector as any;
  } else if (isFunction(selector)) {
    return By.js(selector, ...getExecuteScriptArgs()) as any;
  }

  return By.css(selector);
};

export { buildBy };
