import type { Keys } from './mappers';

export interface PromodElementsType {
  selector: string;

  get(index: number): PromodElementType;

  last(): PromodElementType;

  first(): PromodElementType;

  each(cb: (item: PromodElementType, index?: number) => Promise<void>): Promise<void>;

  map<T>(cb: (item: PromodElementType, index?: number) => Promise<T>): Promise<T[]>;

  find(cb: (item: PromodElementType, index?: number) => Promise<boolean>): Promise<PromodElementType>;

  count(): Promise<number>;
}

export interface PromodElementType {
  selector: string;

  getId(): Promise<string>;

  /**
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

  hover(): Promise<void>;

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

  /**
   * @example
   * const button = $('button');
   * await button.focus(); // regular focus on element
   *
   * @returns {Promise<void>}
   */
  focus(): Promise<void>;

  sendKeys(...keys: Array<string | number | Promise<string | number>>): Promise<void>;

  getTagName(): Promise<string>;

  getCssValue(cssStyleProperty: string): Promise<string>;

  getAttribute(attributeName: string): Promise<string>;

  getText(): Promise<string>;

  getSize(): Promise<{
    width: number;
    height: number;
  }>;

  getRect(): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;

  getLocation(): Promise<{
    x: number;
    y: number;
  }>;

  clearViaBackspace(repeat: number): Promise<void>;

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

export type ExecuteScriptFn = (data: any | any[]) => unknown;
