const KeysSWD = {
  ArrowDown: '\uE015',
  ArrowLeft: '\uE012',
  ArrowRight: '\uE014',
  ArrowUp: '\uE013',
  End: '\uE010',
  Home: '\uE011',
  PageDown: '\uE00F',
  PageUp: '\uE00E',
  Alt: '\uE00A',
  Backspace: '\uE003',
  Tab: '\uE004',
  Escape: '\uE00C',
  Space: '\uE00D',
  Delete: '\uE017',
  Enter: '\uE007',
  Clear: '\uE005',
  Shift: '\uE008',
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
};

const KeysPW = {
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowUp: 'ArrowUp',
  End: 'End',
  Home: 'Home',
  PageDown: 'PageDown',
  PageUp: 'PageUp',
  Alt: 'Alt',
  Backspace: 'Backspace',
  Tab: 'Tab',
  Escape: 'Escape',
  Space: 'Space',
  Delete: 'Delete',
  Enter: 'Enter',
  Clear: 'Clear',
  Shift: 'Shift',
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

const getPositionXY = (
  position: string,
  { x, y, width, height }: { x: number; y: number; width: number; height: number },
) => {
  switch (position) {
    case 'center':
      return { x: x + width / 2, y: y + height / 2 };
    case 'center-bottom':
      return { x: x + width / 2, y: y + height - 2 };
    case 'center-top':
      return { x: x + width / 2, y: y + 2 };
    case 'center-right':
      return { x: x + width - 2, y: y + height / 2 };
    case 'center-left':
      return { x: x + 2, y: y + height / 2 };
    case 'right-top':
      return { x: x + width - 2, y: y + 2 };
    case 'right-bottom':
      return { x: x + width - 2, y: y + height - 2 };
    case 'left-top':
      return { x: x + 2, y: y + 2 };
    case 'left-bottom':
      return { x: x + 2, y: y + height - 2 };
  }
};

export type Keys = typeof KeysPW;

export { KeysPW, KeysSWD, getPositionXY, resolveUrl };
