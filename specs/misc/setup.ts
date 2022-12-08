import * as path from 'path';

const actionFile = `file://${path.resolve(__dirname, './action.html')}`;
const collectionFile = `file://${path.resolve(__dirname, './collection.html')}`;
const hoverFocusFile = `file://${path.resolve(__dirname, './hover_focus.html')}`;
const framesFile = `file://${path.resolve(__dirname, './frames.html')}`;
const formsFile = `file://${path.resolve(__dirname, './forms.html')}`;
const logsFile = `file://${path.resolve(__dirname, './logs.html')}`;
const selectorsFile = `file://${path.resolve(__dirname, './selectors.html')}`;
const iframesFile = `file://${path.resolve(__dirname, './iframes.html')}`;

export { iframesFile, actionFile, collectionFile, hoverFocusFile, framesFile, formsFile, logsFile, selectorsFile };
