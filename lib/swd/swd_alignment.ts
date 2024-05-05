import { isString, isObject, isFunction, isPromise } from 'sat-utils';
import { By } from 'selenium-webdriver';

import { TCustomSelector } from '../mappers';

const buildBy = (
  selector: string | By | TCustomSelector,
  getExecuteScriptArgs: () => any[] = () => [],
  parent?,
  toMany?,
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
      ([parent, entry]) => {
        const { query, text, rg, strict, toMany } = entry;
        const elements = parent ? parent.querySelectorAll(query) : document.querySelectorAll(query);

        if (!elements.length) return null;

        const filteredElements = [];

        for (const element of elements) {
          const innerText = element.innerText.trim();
          const textMatches = typeof text === 'string' && (!strict ? innerText.includes(text) : innerText === text);
          const rgMatches = rg && innerText.match(new RegExp(rg, 'gmi'));

          if (rgMatches && !toMany) {
            return element;
          } else if (textMatches && !toMany) {
            return element;
          } else if (rgMatches && toMany) {
            filteredElements.push(element);
          } else if (textMatches && toMany) {
            filteredElements.push(element);
          }
          if (!text && !rg) {
            return element;
          }
        }

        return toMany ? filteredElements : null;
      },
      [parent, { ...item, toMany }],
    ) as any;
  }

  return By.css(selector as string);
};

export { buildBy };
