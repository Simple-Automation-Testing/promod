import { seleniumWD } from './swd';
import { playwrightWD } from './pw';

export * from './swd/config';
export * from './pw/config';

const { PROMOD_ENGINE = 'selenium' } = process.env;

// for types
export { PromodSeleniumElementType, PromodSeleniumElementsType } from './swd/swd_element';
export { PromodElementType, PromodElementsType } from './pw/pw_element';
export { Browser } from './swd/swd_client';
