/**
 * @info for details
 * https://w3c.github.io/webdriver/webdriver-spec.html#character-types
 */
const KeysSWD = {
  NULL: '\uE000',
  Unidentified: '\uE000',
  Cancel: '\uE001',
  Help: '\uE002',
  Backspace: '\uE003',
  'Back space': '\uE003',
  Tab: '\uE004',
  Clear: '\uE005',
  Return: '\uE006',
  Enter: '\uE007',
  Shift: '\uE008',
  Control: '\uE009',
  'Control Left': '\uE009',
  'Control Right': '\uE051',
  Alt: '\uE00A',
  Pause: '\uE00B',
  Escape: '\uE00C',
  Space: '\uE00D',
  ' ': '\uE00D',
  PageUp: '\uE00E',
  Pageup: '\uE00E',
  Page_Up: '\uE00E',
  PageDown: '\uE00F',
  Pagedown: '\uE00F',
  Page_Down: '\uE00F',
  End: '\uE010',
  Home: '\uE011',
  ArrowLeft: '\uE012',
  'Left arrow': '\uE012',
  Arrow_Left: '\uE012',
  ArrowUp: '\uE013',
  'Up arrow': '\uE013',
  Arrow_Up: '\uE013',
  ArrowRight: '\uE014',
  'Right arrow': '\uE014',
  Arrow_Right: '\uE014',
  ArrowDown: '\uE015',
  'Down arrow': '\uE015',
  Arrow_Down: '\uE015',
  Insert: '\uE016',
  Delete: '\uE017',
  Semicolon: '\uE018',
  Equals: '\uE019',
  'Numpad 0': '\uE01A',
  'Numpad 1': '\uE01B',
  'Numpad 2': '\uE01C',
  'Numpad 3': '\uE01D',
  'Numpad 4': '\uE01E',
  'Numpad 5': '\uE01F',
  'Numpad 6': '\uE020',
  'Numpad 7': '\uE021',
  'Numpad 8': '\uE022',
  'Numpad 9': '\uE023',
  Multiply: '\uE024',
  Add: '\uE025',
  Separator: '\uE026',
  Subtract: '\uE027',
  Decimal: '\uE028',
  Divide: '\uE029',
  F1: '\uE031',
  F2: '\uE032',
  F3: '\uE033',
  F4: '\uE034',
  F5: '\uE035',
  F6: '\uE036',
  F7: '\uE037',
  F8: '\uE038',
  F9: '\uE039',
  F10: '\uE03A',
  F11: '\uE03B',
  F12: '\uE03C',
  Command: '\uE03D',
  Meta: '\uE03D',
};

const KeysPW = {
  NULL: 'NULL',
  Unidentified: 'Unidentified',
  Cancel: 'Cancel',
  Help: 'Help',
  Backspace: 'Backspace',
  'Back space': 'Back space',
  Tab: 'Tab',
  Clear: 'Clear',
  Return: 'Return',
  Enter: 'Enter',
  Shift: 'Shift',
  Control: 'Control',
  'Control Left': 'Control Left',
  'Control Right': 'Control Right',
  Alt: 'Alt',
  Pause: 'Pause',
  Escape: 'Escape',
  Space: 'Space',
  PageUp: 'PageUp',
  Pageup: 'Pageup',
  Page_Up: 'Page_Up',
  PageDown: 'PageDown',
  Pagedown: 'Pagedown',
  Page_Down: 'Page_Down',
  End: 'End',
  Home: 'Home',
  ArrowLeft: 'ArrowLeft',
  'Left arrow': 'Left arrow',
  Arrow_Left: 'Arrow_Left',
  ArrowUp: 'ArrowUp',
  'Up arrow': 'Up arrow',
  Arrow_Up: 'Arrow_Up',
  ArrowRight: 'ArrowRight',
  'Right arrow': 'Right arrow',
  Arrow_Right: 'Arrow_Right',
  ArrowDown: 'ArrowDown',
  'Down arrow': 'Down arrow',
  Arrow_Down: 'Arrow_Down',
  Insert: 'Insert',
  Delete: 'Delete',
  Semicolon: 'Semicolon',
  Equals: 'Equals',
  'Numpad 0': 'Numpad 0',
  'Numpad 1': 'Numpad 1',
  'Numpad 2': 'Numpad 2',
  'Numpad 3': 'Numpad 3',
  'Numpad 4': 'Numpad 4',
  'Numpad 5': 'Numpad 5',
  'Numpad 6': 'Numpad 6',
  'Numpad 7': 'Numpad 7',
  'Numpad 8': 'Numpad 8',
  'Numpad 9': 'Numpad 9',
  Multiply: 'Multiply',
  Add: 'Add',
  Separator: 'Separator',
  Subtract: 'Subtract',
  Decimal: 'Decimal',
  Divide: 'Divide',
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',
  Command: 'Command',
  Meta: 'Meta',
};

/**
 * @param {string} urlOrPath
 * @returns {string}
 */
const resolveUrl = (urlOrPath: string, appBaseUrl) => {
  let resolved;

  if (!urlOrPath.includes('http') && appBaseUrl) {
    const url = appBaseUrl;
    const path = urlOrPath;

    if (url.endsWith('/') && path.startsWith('/')) {
      resolved = `${url.replace(/.$/u, '')}${path}`;
    } else if (url.endsWith('/') && !path.startsWith('/')) {
      resolved = `${url}${path}`;
    } else if (!url.endsWith('/') && path.startsWith('/')) {
      resolved = `${url}${path}`;
    } else {
      resolved = `${url}/${path}`;
    }
  } else if (urlOrPath === '' || urlOrPath === '/') {
    return appBaseUrl;
  } else {
    resolved = urlOrPath;
  }

  return resolved;
};
/*
|---------------------- X
| 0
|
|
|
|
Y
*/
const getPositionXY = (
  position: string,
  { x, y, width, height }: { x: number; y: number; width: number; height: number },
) => {
  switch (position) {
    case 'center':
      return { x: Math.round(x + width / 2), y: Math.round(y + height / 2) };
    case 'center-bottom':
      return { x: Math.round(x + width / 2), y: Math.round(y + height - 1) };
    case 'center-top':
      return { x: Math.round(x + width / 2), y: Math.round(y + 2) };
    case 'center-right':
      return { x: x + width - 2, y: Math.round(y + height / 2) };
    case 'center-left':
      return { x: x + 2, y: Math.round(y + height / 2) };
    case 'right-top':
      return { x: x + width - 2, y: y + 2 };
    case 'right-bottom':
      return { x: x + width - 2, y: y + height - 2 };
    case 'left-top':
      return { x: x + 1, y: y + 1 };
    case 'left-bottom':
      return { x: x + 2, y: y + height - 2 };
  }
};

export type Keys = typeof KeysPW;

export type TCustomSelector = { query: string; text?: string; rg: string; strict?: boolean };

export { KeysPW, KeysSWD, getPositionXY, resolveUrl };
