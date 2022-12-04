import { Key } from 'selenium-webdriver';
import { expect } from 'assertior';
import { seleniumWD, playwrightWD } from '../lib';

const { ENGINE } = process.env;

const engine = ENGINE === 'pw' ? playwrightWD : seleniumWD;

export { iframesFile, logsFile, formsFile, hoveFocusFile, framesFile, selectorsFile } from './misc/setup';
export { engine, Key, expect };
