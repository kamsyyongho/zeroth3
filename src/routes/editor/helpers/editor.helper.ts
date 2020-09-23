import {
  CompositeDecorator,
  ContentBlock,
  ContentState,
  DraftEditorCommand,
  DraftEntityMutability,
  EditorState,
  getDefaultKeyBinding,
  Modifier,
  SelectionState,
} from 'draft-js';
import { CustomTheme } from '../../../theme';
import {
  EDITOR_CHANGE_TYPE,
  HANDLE_VALUES,
  INLINE_STYLE_TYPE,
  KEY_COMMANDS,
  MUTABILITY_TYPE,
  Segment,
  SegmentAndWordIndex,
  WordKeyLocation3DArray,
  WordKeyStoreContent,
} from '../../../types';
import { EntityContent } from '../components/EntityContent';

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

/**
 * adds custom key binding types that will be picked up by the editor
 */
export function customKeyBindingFunction(event: React.KeyboardEvent): string {
  if (event.key === 'Backspace' && event.shiftKey) {
    return KEY_COMMANDS['merge-segments-back'];
  }
  if (event.key === 'Delete' && event.shiftKey) {
    return KEY_COMMANDS['merge-segments-forward'];
  }
  if (event.key === 'Alt' && !event.shiftKey) {
    return KEY_COMMANDS['toggle-popups'];
  }
  if (event.key === 'Alt' && event.shiftKey) {
    return KEY_COMMANDS['edit-segment-time'];
  }
  return getDefaultKeyBinding(event) as DraftEditorCommand;
}

/** used when generating decorators */
function getEntityStrategy(mutability: DraftEntityMutability) {
  return function(
    contentBlock: ContentBlock,
    callback: (start: number, end: number) => void,
    contentState: ContentState,
  ) {
    contentBlock.findEntityRanges(character => {
      const entityKey = character.getEntity();
      if (entityKey === null) {
        return false;
      }
      return contentState.getEntity(entityKey).getMutability() === mutability;
    }, callback);
  };
}

export const getSegmentAndWordIndex = () => {
  const selectedBlock: any = window.getSelection();
  const selectedBlockNode: any = selectedBlock.anchorNode || selectedBlock.focusNode;
  const selectedBlockId: string = selectedBlockNode?.id || selectedBlockNode?.parentNode?.id;
  if(!selectedBlockNode || !selectedBlockId) return { segmentIndex: 0, wordIndex: 0 };

  const segmentAndWordIndex = selectedBlockId.split('-');
  segmentAndWordIndex.shift();

  return { segmentIndex: Number(segmentAndWordIndex[0]), wordIndex: Number(segmentAndWordIndex[1]) };
};

export const getSelectionOfAll = (editorState: EditorState): SelectionState => {
  const currentContent = editorState.getCurrentContent();
  const firstBlock = currentContent.getBlockMap().first();
  const lastBlock = currentContent.getBlockMap().last();
  const firstBlockKey = firstBlock.getKey();
  const lastBlockKey = lastBlock.getKey();
  const lengthOfLastBlock = lastBlock.getLength();

  const selection = new SelectionState({
    anchorKey: firstBlockKey,
    anchorOffset: 0,
    focusKey: lastBlockKey,
    focusOffset: lengthOfLastBlock,
  });

  return selection;
};

/** prevents changing of the editor state */
export const editorChangeNoop = () => HANDLE_VALUES.handled;
