import type { Keys } from './mappers';

export interface PromodElementsType {
  selector: string;

  get(index: number): PromodElementType;

  last(): PromodElementType;

  first(): PromodElementType;

  each(cb: (item: PromodElementType, index?: number) => Promise<void>): Promise<void>;

  count(): Promise<number>;
}

export interface PromodElementType {
  selector: string;
  getId(): Promise<string>;

  click(opts?: {
    withScroll?: boolean;
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
