/**
 * Browser-side function for filtering DOM elements by custom selector criteria.
 * This function is serialized and runs in the browser context via evaluate/By.js.
 *
 * @param {[HTMLElement|null, object]} args - Tuple of [parent, entry]
 * @returns {HTMLElement|HTMLElement[]|null}
 */
function customSelectorFilterFn([parent, entry]: [
  HTMLElement | null,
  { query: string; text?: string; rg?: string; strict?: boolean; toMany?: boolean; rgFlags?: string },
]): HTMLElement | HTMLElement[] | null {
  const { query, text, rg, strict, toMany, rgFlags = 'gmi' } = entry;
  const elements = parent ? parent.querySelectorAll(query) : document.querySelectorAll(query);

  if (!elements.length) return null;

  const filteredElements: HTMLElement[] = [];

  for (const element of elements) {
    const el = element as HTMLElement;
    const innerText = el?.innerText?.trim() || el?.textContent?.trim() || el?.outerHTML?.trim();
    const textMatches = typeof text === 'string' && (!strict ? innerText.includes(text) : innerText === text);
    const rgMatches = rg && innerText.match(new RegExp(rg, rgFlags));

    if (rgMatches && !toMany) {
      return el;
    } else if (textMatches && !toMany) {
      return el;
    } else if (rgMatches && toMany) {
      filteredElements.push(el);
    } else if (textMatches && toMany) {
      filteredElements.push(el);
    }
    if (!text && !rg) {
      return el;
    }
  }

  return toMany ? filteredElements : null;
}

export { customSelectorFilterFn };
