/**
 * used to display OS aware shortcut hotkeys
 */
export const shortcuts: {mac: {[x: string]: string}; other: {[x: string]: string}} = {
  mac: {
    undo: 'Cmd + Z',
    redo: 'Cmd + Shift + Z',
    merge: 'Shift + Backspace',
    split: 'Shift + Enter',
    toggleMore: 'Alt',
  },
  other: {
    undo: 'Ctrl + Z',
    redo: 'Ctrl + Shift + Z',
    merge: 'Shift + Backspace',
    split: 'Shift + Enter',
    toggleMore: 'Alt',
  },
}

export interface Shortcuts {
  undo: string;
  redo: string;
  merge: string;
  split: string;
  toggleMore: string;
}