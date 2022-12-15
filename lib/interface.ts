import type { Keys } from './mappers';

export interface PromodElementsType {
  selector: string;

  /**
   * @example
   * const els = $$('a')
   * const thirdLink = els.get(2);
   * const lastLink = els.get(-1);
   *
   * @param {number} index
   * @returns {PromodElementType} PromodElementType instance
   */
  get(index: number): PromodElementType;

  /**
   * @example
   * const els = $$('a')
   * const lastLink = els.last(); // same as els.get(-1);
   *
   * @param {number} index
   * @returns {PromodElementType} PromodElementType instance
   */
  last(): PromodElementType;

  /**
   * @example
   * const els = $$('a')
   * const firstLink = els.first(); // same as els.get(0);
   *
   * @param {number} index
   * @returns {PromodElementType} PromodElementType instance
   */
  first(): PromodElementType;

  each(cb: (item: PromodElementType, index?: number) => Promise<void>): Promise<void>;

  map<T>(cb: (item: PromodElementType, index?: number) => Promise<T>): Promise<T[]>;

  find(cb: (item: PromodElementType, index?: number) => Promise<boolean>): Promise<PromodElementType>;

  /**
   * @example
   * const els = $$('a')
   * const linksCount = await els.count(); // number
   *
   * @param {number} index
   * @returns {Promise<number>} elements count
   */
  count(): Promise<number>;
}

export interface PromodElementType {
  selector: string;

  /**
   * @example
   * const link = $('a')
   * await link.clickByElementCoordinate('center'); // will click center
   * await link.clickByElementCoordinate('right-top'); // will click right top corner
   *
   * @param {string} position click position
   * @returns {Promise<void>}
   */
  clickByElementCoordinate(
    position?:
      | 'center'
      | 'center-top'
      | 'center-bottom'
      | 'center-right'
      | 'center-left'
      | 'right-top'
      | 'right-bottom'
      | 'left-top'
      | 'left-bottom',
  ): Promise<void>;

  /**
   * @example
   * const link = $('a')
   * const { x, y } = await link.getElementCoordinates('center'); // returns x and y of the element center
   *
   * @param {string} position click position
   * @returns {Promise<{ x: number; y: number }>}
   */
  getElementCoordinates(
    position?:
      | 'center'
      | 'center-top'
      | 'center-bottom'
      | 'center-right'
      | 'center-left'
      | 'right-top'
      | 'right-bottom'
      | 'left-top'
      | 'left-bottom',
  ): Promise<{ x: number; y: number }>;

  /**
   * @example
   * const button = $('button');
   * await button.click(); // regular click
   * await button.click({ withScroll: true }); // first element will be scrolled to view port and then regular click
   * await button.click({ allowForceIfIntercepted: true }); // if regular click is intercepted by another element, click will be re-executed by element x,y center coordinates
   *
   *
   * @param {object} [opts]
   * @param {boolean} [opts.withScroll]
   * @param {boolean} [opts.allowForceIfIntercepted]
   * @param {boolean} [opts.force]
   * @param {string} [opts.button]
   * @param {number} [opts.clickCount]
   * @param {number} [opts.delay]
   * @param {string[]} [opts.modifiers]
   * @param {boolean} [opts.noWaitAfter]
   * @param {{ x: number; y: number }} [opts.position]
   * @param {number} [opts.timeout]
   * @param {boolean} [opts.trial]
   *
   * @returns {Promise<void>}
   */
  click(opts?: {
    withScroll?: boolean;
    allowForceIfIntercepted?: boolean;
    button?: 'left' | 'right' | 'middle';
    clickCount?: number;
    delay?: number;
    force?: boolean;
    modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;
    noWaitAfter?: boolean;
    position?: { x: number; y: number };
    timeout?: number;
    trial?: boolean;
  }): Promise<void>;

  /**
   * @example
   * const link = $('a')
   * await link.hover('center'); // will hove element
   *
   * @returns {Promise<void>}
   */
  hover(): Promise<void>;

  /**
   * @example
   * const button = $('button');
   * await button.focus(); // regular focus on element
   *
   * @returns {Promise<void>}
   */
  focus(): Promise<void>;

  selectOption(
    value:
      | string
      | {
          /**
           * Matches by `option.value`. Optional.
           */
          value?: string;

          /**
           * Matches by `option.label`. Optional.
           */
          label?: string;

          /**
           * Matches by the index. Optional.
           */
          index?: number;
        },
  ): Promise<void>;

  sendKeys(value: string | number, asFill?: boolean): Promise<void>;

  /**
   * @example
   * const button = $('button');
   * const buttonTag = await button.getTagName(); // button string
   *
   * @returns {Promise<string>}
   */
  getTagName(): Promise<string>;

  /**
   * @example
   * const button = $('button');
   * const buttonTag = await button.getText(); // button text content
   *
   * @returns {Promise<string>}
   */
  getText(): Promise<string>;

  getCssValue(cssStyleProperty: string): Promise<string>;

  getAttribute(attributeName: string): Promise<string>;

  /**
   * @example
   * const button = $('button');
   * const {x,y,width,height} = await button.getRect(); // button bounding box
   *
   * @returns {Promise<x: number; y: number;width: number;height: number;>} element bounding box
   */
  getRect(): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;

  /**
   * @example
   * const txt = '123';
   * const inpt = $('input');
   * await inpt.sendKeys(txt);
   * await inpt.clearViaBackspace(txt.length, true);
   *
   * @param {number} repeat how many times execute back space
   * @param {boolean} [focus] should element got focus event before execute back space
   *
   * @returns {Promise<void>}
   */
  clearViaBackspace(repeat: number, focus?: boolean): Promise<void>;

  /**
   * @example
   * const txt = '123';
   * const inpt = $('input');
   * await inpt.sendKeys(txt);
   * await inpt.pressEnter(true);
   *
   * @param {boolean} [focus] should element got focus event before execute enter
   *
   * @returns {Promise<void>}
   */
  pressEnter(): Promise<void>;

  $(selector: string | ((...args: any[]) => any) | Promise<any>): PromodElementType;
  $$(selector: string | ((...args: any[]) => any) | Promise<any>): PromodElementsType;

  isEnabled(): Promise<boolean>;

  isSelected(): Promise<boolean>;

  isPresent(): Promise<boolean>;

  submit(): Promise<void>;

  clear(): Promise<void>;

  isDisplayed(): Promise<boolean>;

  takeScreenshot(opt_scroll?: boolean): Promise<string>;

  getEngineElements(): Promise<unknown>;

  getEngineElement(): Promise<unknown>;

  scrollIntoView(position?: boolean | string): Promise<void>;
}

export type TCookie = {
  name: string;
  value: string;
  url?: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
};

export type TLogLevel = {
  level: string;
  type: string;
  timestamp: string;
  message: any | any[];
};

export type ExecuteScriptFn = (data: any | any[]) => unknown;
