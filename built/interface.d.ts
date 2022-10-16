export interface PromodElementsType {
    get(index: number): PromodElementType;
    last(): PromodElementType;
    first(): PromodElementType;
    each(cb: (item: PromodElementType, index?: number) => Promise<void>): Promise<void>;
    count(): Promise<number>;
}
export interface PromodElementType {
    getId(): Promise<string>;
    click(withScroll?: boolean): Promise<void>;
    hover(): Promise<void>;
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
    $(selector: string | ((...args: any[]) => any) | Promise<any>): PromodElementType;
    $$(selector: string | ((...args: any[]) => any) | Promise<any>): PromodElementsType;
    isEnabled(): Promise<boolean>;
    isSelected(): Promise<boolean>;
    isPresent(): Promise<boolean>;
    submit(): Promise<void>;
    clear(): Promise<void>;
    isDisplayed(): Promise<boolean>;
    takeScreenshot(opt_scroll?: boolean): Promise<string>;
    getEngineElement(): Promise<unknown>;
    scrollIntoView(position?: boolean | string): Promise<void>;
}
