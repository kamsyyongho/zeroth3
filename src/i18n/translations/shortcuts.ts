/**
 * used to display OS aware shortcut hotkeys
 */
export const shortcuts: {
  mac: { [x: string]: string };
  other: { [x: string]: string };
} = {
  mac: {
    save: '⌘ Cmd + S',
    undo: '⌘ Cmd + Z',
    redo: '⌘ Cmd + ⇧ Shift + Z',
    merge: '⇧ Shift + ⌫ Backspace',
    split: '⇧ Shift + ⏎ Return',
    toggleMore: '⌥ Opt',
    editSegmentTime: '⇧ Shift + ⌥ Opt',
    rewind: '⇧ Shift + ⌘ Cmd + A',
    forward: '⇧ Shift + ⌘ Cmd + D',
    playPause: '⇧ Shift + ⌘ Cmd + S',
    speaker: '⇧ Shift + ⌘ Cmd + ⌥ Opt',
  },
  other: {
    save: 'Ctrl + S',
    undo: 'Ctrl + Z',
    redo: 'Ctrl + ⇧ Shift + Z',
    merge: '⇧ Shift + Backspace',
    split: '⇧ Shift + ↵ Enter',
    toggleMore: 'Alt',
    editSegmentTime: '⇧ Shift + Alt',
    rewind: '⇧ Shift + Ctrl + A',
    forward: '⇧ Shift + Ctrl + D',
    playPause: '⇧ Shift + Ctrl + S',
    speaker: '⇧ Shift + Ctrl + Alt',
  },
};

export interface Shortcuts {
  undo: string;
  redo: string;
  merge: string;
  split: string;
  toggleMore: string;
  createWord: string;
}
