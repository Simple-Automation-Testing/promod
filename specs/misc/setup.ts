import * as path from 'path';

const actionFile = `file://${path.resolve(__dirname, './action.html')}`;
const collectionFile = `file://${path.resolve(__dirname, './collection.html')}`;
const hoverFocusFile = `file://${path.resolve(__dirname, './hover_focus.html')}`;
const framesFile = `file://${path.resolve(__dirname, './frames.html')}`;
const formsFile = `file://${path.resolve(__dirname, './forms.html')}`;
const logsFile = `file://${path.resolve(__dirname, './logs.html')}`;
const selectorsFile = `file://${path.resolve(__dirname, './selectors.html')}`;
const iframesFile = `file://${path.resolve(__dirname, './iframes.html')}`;
const scrollFile = `file://${path.resolve(__dirname, './scroll.html')}`;
const pressFile = `file://${path.resolve(__dirname, './press.html')}`;
const invisibleFile = `file://${path.resolve(__dirname, './invisible.html')}`;
const visibleFile = `file://${path.resolve(__dirname, './visible.html')}`;

export {
  scrollFile,
  iframesFile,
  actionFile,
  collectionFile,
  hoverFocusFile,
  framesFile,
  formsFile,
  logsFile,
  selectorsFile,
  pressFile,
  invisibleFile,
  visibleFile,
};
