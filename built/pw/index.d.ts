import { getDriver } from './driver';
import { PromodElement, PromodElements } from './pw_element';
declare const playwrightWD: {
    getDriver: typeof getDriver;
    browser: import("./pw_client").Browser;
    $: (selector: string | Promise<any> | ((...args: any[]) => any), root?: any, ...rest: any[]) => import("../interface").PromodElementType;
    $$: (selector: string | Promise<any> | ((...args: any[]) => any), root?: any, ...rest: any[]) => import("../interface").PromodElementsType;
    PromodElement: typeof PromodElement;
    PromodElements: typeof PromodElements;
};
export { playwrightWD };
