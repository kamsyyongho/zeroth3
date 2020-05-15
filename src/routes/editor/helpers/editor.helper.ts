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

export const getSegmentAndWordIndex = () => {
  const selectedBlock: any = window.getSelection();
  const selectedBlockNode: any = selectedBlock.anchorNode || selectedBlock.focusNode;
  const selectedBlockId: string = selectedBlockNode.id || selectedBlockNode.parentNode.id;
  if(!selectedBlockNode || !selectedBlockId) return;

  const segmentAndWordIndex = selectedBlockId.split('-');
  segmentAndWordIndex.shift();

  return segmentAndWordIndex.map(index => Number(index));
};

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

export const updatePlayingLocation = (playingLocation: any) => {
  if(playingLocation) {
    const playingBlock = document.getElementById(`word-${playingLocation[0]}-${playingLocation[1]}`);
    const selection = window.getSelection();
    const range = document.createRange();

    if(playingBlock) {
      range.selectNodeContents(playingBlock);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }
  // if(playingBlock) {
  //   playingBlock.focus();
  // }
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

export class WordKeyStore {
  keys: { [x: number]: SegmentAndWordIndex } = {};
  keyCounter = 0;
  wordKeyLocations: WordKeyLocation3DArray = [];

  /**
   * Updates the word key location within the 3D array
   * - push new segments or words if they don't already exist
   * @param insert - will insert instead of replacing values
   */
  private updateWordKeyLocations = (
    wordKey: number,
    wordLocation: SegmentAndWordIndex,
    insert = false,
  ) => {
    const [segmentIndex, wordIndex] = wordLocation;
    const tempWordKeyLocations = [...this.wordKeyLocations];
    const tempSegmentWordKeys = tempWordKeyLocations[segmentIndex];
    if (!tempSegmentWordKeys) {
      tempWordKeyLocations.push([wordKey]);
    } else {
      const numberOfWordsInSegment = tempSegmentWordKeys.length;
      if (numberOfWordsInSegment - 1 < wordIndex) {
        tempSegmentWordKeys.push(wordKey);
      } else {
        tempSegmentWordKeys.splice(wordIndex, insert ? 0 : 1, wordKey);
      }
      tempWordKeyLocations.splice(segmentIndex, 1, tempSegmentWordKeys);
    }
    this.wordKeyLocations = [...tempWordKeyLocations];
  };

  /**
   * inserts a key at the specified location and
   * updates the locations for any keys down the line
   * that it displaces
   */
  private moveKeysAndInsert = (
    wordKey: number,
    wordLocation: SegmentAndWordIndex,
  ) => {
    let currentWordKeyAtLocation: number | undefined = this.getKey(
      wordLocation,
    );
    let newLocation: SegmentAndWordIndex | undefined;
    while (currentWordKeyAtLocation !== undefined) {
      if (!newLocation) {
        newLocation = [wordLocation[0], wordLocation[1] + 1];
      } else {
        newLocation = [newLocation[0], newLocation[1] + 1];
      }
      this.keys[currentWordKeyAtLocation] = newLocation;
      currentWordKeyAtLocation = this.getKey(newLocation);
    }
    this.updateWordKeyLocations(wordKey, wordLocation, true);
  };

  getLocationMap = () => [...this.wordKeyLocations];

  getKeyMap = () => ({ ...this.keys });

  /** build the initial multi-dimentional array for the word keys */
  init = (segments: Segment[]) => {
    const tempWordKeyLocations: WordKeyLocation3DArray = [];
    segments.forEach(segment => {
      const tempWords = new Array(segment.wordAlignments.length).fill(-1);
      tempWordKeyLocations.push(tempWords);
    });
    this.wordKeyLocations = tempWordKeyLocations;
    return true;
  };

  initWithContent = (wordKeyStoreContent: WordKeyStoreContent) => {
    this.keys = wordKeyStoreContent.keys;
    this.keyCounter = wordKeyStoreContent.keyCounter;
    this.wordKeyLocations = wordKeyStoreContent.wordKeyLocations;
  };

  /** exports the content to be initialized in a different instance
   * - used to pass a class instance's content to/from a webworker
   */
  exportContent = (): WordKeyStoreContent => {
    return {
      keys: this.keys,
      keyCounter: this.keyCounter,
      wordKeyLocations: this.wordKeyLocations,
    };
  };

  /** Generates a new key for a given location
   * @param insert - will insert instead of replacing values
   * @returns the new word key
   */
  generateKey = (wordLocation: SegmentAndWordIndex, insert = false) => {
    const wordKey = this.keyCounter;
    this.keyCounter++;
    this.keys[wordKey] = wordLocation;
    if (insert) {
      // increment the the keys then insert
      this.moveKeysAndInsert(wordKey, wordLocation);
    } else {
      this.updateWordKeyLocations(wordKey, wordLocation);
    }
    return wordKey;
  };

  /** Generates a key that for a word that will replace all existing keys in the segment
   */
  generateKeyAndClearSegment = (segmentIndex: number): number => {
    const wordLocation: SegmentAndWordIndex = [segmentIndex, 0];
    const wordKey = this.generateKey(wordLocation);
    const tempWordKeyLocations = [...this.wordKeyLocations];
    const numberOfWords = tempWordKeyLocations[segmentIndex].length;
    tempWordKeyLocations[segmentIndex] = [wordKey];
    this.wordKeyLocations = [...tempWordKeyLocations];
    return wordKey;
  };

  /** Generates a key that for a word that will be pushed the end of a segment
   */
  generateKeyForEndOfSegment = (segmentIndex: number): number => {
    const nextWordIndex = this.wordKeyLocations[segmentIndex].length;
    const nextWordLocation: SegmentAndWordIndex = [segmentIndex, nextWordIndex];
    return this.generateKey(nextWordLocation);
  };

  /** Get the word location from the word key */
  getLocation = (wordKey: number): SegmentAndWordIndex => {
    return this.keys[wordKey];
  };

  /**
   * Update the word location for the given word key
   * - updates the key bank object and 3D array
   */
  setLocation = (wordKey: number, wordLocation: SegmentAndWordIndex) => {
    this.keys[wordKey] = wordLocation;
    this.updateWordKeyLocations(wordKey, wordLocation);
  };

  /** Get the word key from the word location */
  getKey = (wordLocation: SegmentAndWordIndex) => {
    const [segmentIndex, wordIndex] = wordLocation;
    return this.wordKeyLocations[segmentIndex][wordIndex];
  };

  /**
   * Concats the word locations from the merged segment to the previous one
   * - updates the word keys for the updated locations for the merged segments
   * and the segments that have been shifted up after the merge
   */
  moveKeysAfterSegmentMerge = (removedSegmentIndex: number) => {
    const wordLocations = [...this.wordKeyLocations];
    const segmentToMerge = [...wordLocations[removedSegmentIndex]];
    const locationsAfterMerge = [...wordLocations];
    if (removedSegmentIndex) {
      const prevSegmentIndex = removedSegmentIndex - 1;
      const segmentToMergeInto = locationsAfterMerge[prevSegmentIndex];
      const mergedSegment = segmentToMergeInto.concat(segmentToMerge);
      // to remove the two old and replace with the merged
      locationsAfterMerge.splice(prevSegmentIndex, 2, mergedSegment);
      // to update the moved key locations
      let numberOfWordsInSegmentToMergeInto = segmentToMergeInto.length;
      segmentToMerge.forEach(wordKey => {
        const newLocation: SegmentAndWordIndex = [
          prevSegmentIndex,
          numberOfWordsInSegmentToMergeInto,
        ];
        this.keys[wordKey] = newLocation;
        numberOfWordsInSegmentToMergeInto++;
      });
      // to move the shifted key locations in the word key object
      const shiftedSegments = locationsAfterMerge.slice(removedSegmentIndex);
      shiftedSegments.forEach(segment => {
        segment.forEach(wordKey => {
          const [prevSegmentIndex, prevWordIndex] = this.keys[wordKey];
          const updatedLocation: SegmentAndWordIndex = [
            prevSegmentIndex - 1,
            prevWordIndex,
          ];
          this.keys[wordKey] = updatedLocation;
        });
      });
    }
    this.wordKeyLocations = [...locationsAfterMerge];
  };

  /**
   *
   */
  moveKeysAfterSegmentSplit = (
    segmentIndexToSplit: number,
    splitWordIndex: number,
  ) => {
    const wordLocations = [...this.wordKeyLocations];
    const segmentToSplit = [...wordLocations[segmentIndexToSplit]];
    const slicedOriginalSegment = segmentToSplit.slice(0, splitWordIndex);
    const newSegmentContent = segmentToSplit.slice(splitWordIndex);
    // to update the original segment
    wordLocations[segmentIndexToSplit] = [...slicedOriginalSegment];
    // to insert the new segment
    const segmentIndexToInsert = segmentIndexToSplit + 1;
    wordLocations.splice(segmentIndexToInsert, 0, newSegmentContent);

    // update the moved locations for word key object
    newSegmentContent.forEach((wordKey, index) => {
      const updatedLocation: SegmentAndWordIndex = [segmentIndexToSplit, index];
      this.keys[wordKey] = updatedLocation;
    });
    // update the shifted locations for word key object
    const shiftedSegments = wordLocations.slice(segmentIndexToInsert);
    shiftedSegments.forEach(segment => {
      segment.forEach(wordKey => {
        const [prevSegmentIndex, prevWordIndex] = this.getLocation(wordKey);
        const updatedLocation: SegmentAndWordIndex = [
          prevSegmentIndex + 1,
          prevWordIndex,
        ];
        this.keys[wordKey] = updatedLocation;
      });
    });

    this.wordKeyLocations = [...wordLocations];
  };
}
