import { getSeleniumDriver } from './driver';
declare const seleniumWD: {
    getSeleniumDriver: typeof getSeleniumDriver;
    browser: import("./swd_client").Browser;
    $: (selector: any, root?: any, ...rest: any[]) => import("../interface").PromodElementType;
    $$: (selector: any, root?: any, ...rest: any[]) => import("../interface").PromodElementsType;
    By: any;
};
export { seleniumWD };
