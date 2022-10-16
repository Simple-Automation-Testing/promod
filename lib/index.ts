import { seleniumWD } from './swd';
import { playwrightWD } from './pw';

export * from './swd/config';
export * from './pw/config';

export { seleniumWD, playwrightWD };
export { Browser } from './swd/swd_client';
