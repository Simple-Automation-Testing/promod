import { getSeleniumDriver } from './driver';
import { By } from './swd_element';
declare const seleniumWD: {
    getSeleniumDriver: typeof getSeleniumDriver;
    browser: import("./swd_client").Browser;
    $: (selector: string | Promise<any> | By | ((...args: any[]) => any), root?: any, ...rest: any[]) => import("../interface").PromodElementType;
    $$: (selector: string | Promise<any> | By | ((...args: any[]) => any), root?: any, ...rest: any[]) => import("../interface").PromodElementsType;
    By: typeof By;
};
export { seleniumWD };
