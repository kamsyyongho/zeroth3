import { Segment } from '../../../types';
import log from '../../../util/log/logger';
import { EDITOR_CONTROLS } from '../components/EditorControls';
import {isMacOs} from '../../../util/misc';

export const setSelectionRange = (playingBlock: HTMLElement) => {
  const selection = window.getSelection();
  const range = document.createRange();

  if(playingBlock) {
    range.selectNodeContents(playingBlock);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
};

/** gets the time in segments of a word alignment item */
export const calculateWordTime = (
  segments: Segment[],
  segmentIndex: number,
  wordIndex: number,
) => {
  try {
    const segment = segments[segmentIndex];
    const word = segment.wordAlignments[wordIndex];
    const segmentTime = segment.start;
    const wordTime = word.start;
    let totalTime = segmentTime + wordTime;
    // set to 2 sig figs
    totalTime = Number(totalTime.toFixed(2));
    return totalTime;
  } catch (error) {
    return 0;
  }
};

export const getDisabledControls = (
  segments: Segment[],
  canUndo?: boolean,
  canRedo?: boolean,
  saveSegmentsLoading?: boolean,
  confirmSegmentsLoading?: boolean,
) => {
  if(segments?.length) {
    const disabledControls: EDITOR_CONTROLS[] = [];
    const mergeDisabled = segments.length < 2;
    if (!canUndo) {
      disabledControls.push(EDITOR_CONTROLS.undo);
    }
    if (!canRedo) {
      disabledControls.push(EDITOR_CONTROLS.redo);
    }
    if (mergeDisabled) {
      disabledControls.push(EDITOR_CONTROLS.merge);
    }
    const splitDisabled = !segments.some(
        segment => segment.wordAlignments.length > 0,
    );
    if (splitDisabled) {
      disabledControls.push(EDITOR_CONTROLS.split);
    }
    if (saveSegmentsLoading || confirmSegmentsLoading) {
      disabledControls.push(EDITOR_CONTROLS.save);
      disabledControls.push(EDITOR_CONTROLS.approvalRequest);
    }
    return disabledControls;
  }
};
const enabledMacShortcuts = {
  copy: ['Meta', 'c'],
  paste: ['Meta', 'v'],
};
const enabledWinShortcuts = {
  copy: ['Control', 'c'],
  paste: ['Control', 'v'],
};

export const getNativeShortcuts = () => {
  const checkMacOs = isMacOs();
  if(checkMacOs) {
    return enabledMacShortcuts;
  } else {
    return enabledWinShortcuts;
  }
};

export const convertKoreanKeyToEnglish = (keycode: string) => {
  switch(keycode) {
    case 'ㅂ' :
      return 'q';
    case 'ㅈ':
      return 'w';
    case 'ㄷ':
      return 'e';
    case 'ㄱ':
      return 'r';
    case 'ㅅ':
      return 't';
    case 'ㅛ':
      return 'y';
    case 'ㅕ':
      return 'u';
    case 'ㅑ':
      return 'i';
    case 'ㅐ':
      return 'o';
    case 'ㅔ':
      return 'p';
    case 'ㅁ':
      return 'a';
    case 'ㄴ':
      return 's';
    case 'ㅇ':
      return 'd';
    case 'ㄹ':
      return 'f';
    case 'ㅎ':
      return 'g';
    case 'ㅗ':
      return 'h';
    case 'ㅓ':
      return 'j';
    case 'ㅏ':
      return 'k';
    case 'ㅣ':
      return 'l';
    case 'ㅋ':
      return 'z';
    case 'ㅌ':
      return 'x';
    case 'ㅊ':
      return 'c';
    case 'ㅍ':
      return 'v';
    case 'ㅠ':
      return 'b';
    case 'ㅜ':
      return 'n';
    case 'ㅡ':
      return 'm';
    default:
      return keycode;
  }
};

export const getSegmentAndWordIndex = () => {
  const selectedBlock: any = window.getSelection();
  const selectedBlockNode: any = selectedBlock.anchorNode || selectedBlock.focusNode;
  const selectedBlockId: string = selectedBlockNode?.id || selectedBlockNode?.parentNode?.id;
  if(!selectedBlockNode || !selectedBlockId) return { segmentIndex: 0, wordIndex: 0 };

  const segmentAndWordIndex = selectedBlockId.split('-');
  segmentAndWordIndex.shift();

  return { segmentIndex: Number(segmentAndWordIndex[0]), wordIndex: Number(segmentAndWordIndex[1]) };
};

const inputKeys = [
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",
  "Digit0",
  "KeyA",
  "KeyB",
  "KeyC",
  "KeyD",
  "KeyE",
  "KeyF",
  "KeyG",
  "KeyH",
  "KeyI",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyM",
  "KeyN",
  "KeyO",
  "KeyP",
  "KeyQ",
  "KeyR",
  "KeyS",
  "KeyT",
  "KeyU",
  "KeyV",
  "KeyW",
  "KeyX",
  "KeyY",
  "KeyZ",
  "Comma",
  "Period",
  "Quote",
  "SemiColon",
  "Space",
  "Backspace",
];

export const isInputKey = (keyEvent: KeyboardEvent) => {
  const keyCode = keyEvent.code;
  if(keyEvent.ctrlKey || keyEvent.shiftKey || keyEvent.altKey) return false;
  if(inputKeys.includes(keyCode)) return true;
  return false;
}

