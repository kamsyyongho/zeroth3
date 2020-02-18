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
import { Map } from 'immutable';
import { CustomTheme } from '../../../theme/index';
import {
  INLINE_STYLE_TYPE,
  KEY_COMMANDS,
  MUTABILITY_TYPE,
  Segment,
} from '../../../types';
import { EDITOR_CHANGE_TYPE, HANDLE_VALUES } from '../../../types/editor.types';
import { EntityContent } from '../components/EntityContent';

// Custom overrides for "playing" style.
export const buildStyleMap = (theme: CustomTheme) => {
  return {
    [INLINE_STYLE_TYPE.PLAYING]: {
      color: theme.editor.playing,
      boxShadow: `0px 0px 0px 1px ${theme.editor.playing}`,
    },
  };
};

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

/** generates the custom entity components */
export const generateDecorators = () =>
  new CompositeDecorator([
    {
      strategy: getEntityStrategy(MUTABILITY_TYPE.IMMUTABLE),
      component: EntityContent,
      props: {},
    },
    {
      strategy: getEntityStrategy(MUTABILITY_TYPE.MUTABLE),
      component: EntityContent,
      props: {},
    },
    {
      strategy: getEntityStrategy(MUTABILITY_TYPE.SEGMENTED),
      component: EntityContent,
      props: {},
    },
  ]);

/**
 * Creates a new state from the old one with the same selection
 * @param incomingEditorState
 */
export const cloneEditorState = (
  incomingEditorState: EditorState,
): EditorState => {
  const newEditorStateWithSameContentAndSelection = EditorState.forceSelection(
    incomingEditorState,
    incomingEditorState.getSelection(),
  );
  return newEditorStateWithSameContentAndSelection;
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

const removeStyleFromSelection = (
  editorState: EditorState,
  selectionState: SelectionState,
  styleType: INLINE_STYLE_TYPE,
): EditorState => {
  // to not allow any changes into the stack
  const noUndoEditorState = EditorState.set(editorState, { allowUndo: false });
  const editorStateWithSelection = EditorState.forceSelection(
    noUndoEditorState,
    selectionState,
  );
  const contentState = editorStateWithSelection.getCurrentContent();
  const updatedContentState = Modifier.removeInlineStyle(
    contentState,
    selectionState,
    styleType,
  );
  // add the content change to the editor state
  const updatedEditorState = EditorState.push(
    editorStateWithSelection,
    updatedContentState,
    EDITOR_CHANGE_TYPE['change-inline-style'],
  );
  return updatedEditorState;
};

export const getEditorStateWithAllStylingRemoved = (
  editorState: EditorState,
) => {
  // to remove the playing style from all content
  const selectAllState = getSelectionOfAll(editorState);
  const editorStateWithNoStyling = removeStyleFromSelection(
    editorState,
    selectAllState,
    INLINE_STYLE_TYPE.PLAYING,
  );
  return editorStateWithNoStyling;
};

/** calculates the time within the segment from overall time */
export const getWithinSegmentTimes = (
  absoluteTime: number,
  segment: Segment,
): number => {
  const adjustedTime = absoluteTime - segment.start;
  return adjustedTime;
};

/** updates the attached segment within a block */
export const updateBlockSegmentData = (
  contentState: ContentState,
  blockKey: string,
  segment: Segment,
): ContentState => {
  const emptySelectionAtBlock = SelectionState.createEmpty(blockKey);
  const updatedDataMap = Map({ segment });
  const updatedContentState = Modifier.setBlockData(
    contentState,
    emptySelectionAtBlock,
    updatedDataMap,
  );
  return updatedContentState;
};

/** prevents changing of the editor state */
export const editorChangeNoop = () => HANDLE_VALUES.handled;
