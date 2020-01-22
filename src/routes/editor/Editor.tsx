import { CompositeDecorator, ContentBlock, ContentState, convertFromRaw, convertToRaw, DraftEditorCommand, DraftEntityMutability, DraftHandleValue, DraftStyleMap, Editor as DraftEditor, EditorState, getDefaultKeyBinding, Modifier, RawDraftEntity, RawDraftEntityRange, RichUtils, SelectionState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { Map } from 'immutable';
import { useSnackbar, VariantType } from 'notistack';
import React from 'react';
import { BLOCK_TYPE, EntityMap, ENTITY_TYPE, HANDLE_VALUES, INLINE_STYLE_TYPE, KEY_COMMANDS, MUTABILITY_TYPE, Segment, SegmentAndWordIndex, SNACKBAR_VARIANTS, WordAlignment } from '../../types';
import { BlockInfo, BlockKeyToSegmentId, BlockObject, CharacterDetails, CharacterProperties, CursorContent, EDITOR_CHANGE_TYPE, EntityKeyToWordKey, EntityRangeByEntityKey, REMOVAL_DIRECTION, SegmentBlockData, SegmentIdToBlockKey, TargetSelection, WordAlignmentEntityData, WordKeyToEntityKey } from '../../types/editor.types';
import log from '../../util/log/logger';
import { generateWordKeyString, WordKeyStore } from '../../util/misc';
import { SegmentBlock } from './components/SegmentBlock';
import { ParentMethodResponse, PARENT_METHOD_TYPES } from './EditorPage';

const wordKeyBank = new WordKeyStore();


let entityMap: EntityMap = {};

const getEntityByKey = (entityKey: string) => {
  return entityMap[entityKey];
};


const entityKeyToWordKeyMap: EntityKeyToWordKey = {};
const wordKeyToEntityKeyMap: WordKeyToEntityKey = {};

const blockKeyToSegmentIdMap: BlockKeyToSegmentId = {};
const segmentIdToBlockKeyMap: SegmentIdToBlockKey = {};

/**
 * used to keep track of where a segment Id is in the list of segments
 */
const segmentOrderById: string[] = [];

/**
 * used to get the index of the current segment Id from within the list of segments
 */
const findIndexOfSegmentId = (segmentId: string): number | null => {
  const indexLocation = segmentOrderById.indexOf(segmentId);
  if (indexLocation < 0) {
    return null;
  }
  return indexLocation;
};


const replaceSegmentIdAtIndex = (replacedIndex: number, segmentId: string): string[] => {
  segmentOrderById.splice(replacedIndex, 1, segmentId);
  return segmentOrderById;
};

const insertSegmentIdAtIndex = (insertedIndex: number, wordSplitIndex: number, segmentId: string): string[] => {
  segmentOrderById.splice(insertedIndex, 0, segmentId);
  wordKeyBank.moveKeysAfterSegmentSplit(insertedIndex, wordSplitIndex);
  return segmentOrderById;
};

const removeSegmentIdAtIndexAndShift = (removedIndex: number): string[] => {
  segmentOrderById.splice(removedIndex, 1);
  wordKeyBank.moveKeysAfterSegmentMerge(removedIndex);
  return segmentOrderById;
};


/**
 * updates the segment Id linked with the corresponding block key
 */
const setBlockSegmentId = (blockKey: string, segmentId: string) => {
  blockKeyToSegmentIdMap[blockKey] = segmentId;
};

/**
 * updates the block key linked with the corresponding segment Id
 */
const setSegmentIdBlockKey = (segmentId: string, blockKey: string) => {
  segmentIdToBlockKeyMap[segmentId] = blockKey;
};

const getSegmentIdFromBlockKey = (blockKey: string) => blockKeyToSegmentIdMap[blockKey];

const getBlockKeyFromSegmentId = (segmentId: string) => segmentIdToBlockKeyMap[segmentId];

const getWordKeyFromEntityKey = (entityKey: number) => entityKeyToWordKeyMap[entityKey];

const getEntityKeyFromWordKey = (wordKey: number) => wordKeyToEntityKeyMap[wordKey];

const SPLIT_CHARACTER = '•';
const SPLITTABLE_CHARACTERS = [SPLIT_CHARACTER, ' '];

const segmentIndexesWaitingForResponses = new Set<number>();


let entityKeyCounter = 0;

let prevPlayingEntityKey = -1;


// Custom overrides for "code" style.
const styleMap: DraftStyleMap = {
  [INLINE_STYLE_TYPE.PLAYING]: {
    color: 'blue',
    boxShadow: `0px 0px 0px 1px ${'blue'}`,
    // fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    // fontSize: 16,
    // padding: 2
  },
};

const styles: { [x: string]: React.CSSProperties; } = {
  editor: {
    border: '1px solid #ccc',
    cursor: 'text',
    minHeight: 80,
    padding: 10
  },
  button: {
    marginTop: 10,
    textAlign: 'center'
  },
  immutable: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '2px 0'
  },
  mutable: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    // backgroundColor: 'rgba(204, 204, 255, 1.0)',
    padding: '2px 0'
  },
  segmented: {
    backgroundColor: 'rgba(248, 222, 126, 1.0)',
    padding: '2px 0'
  }
};

function getDecoratedStyle(mutability: DraftEntityMutability) {
  switch (mutability) {
    case MUTABILITY_TYPE.IMMUTABLE:
      return styles.immutable;
    case MUTABILITY_TYPE.MUTABLE:
      return styles.mutable;
    case MUTABILITY_TYPE.SEGMENTED:
      return styles.segmented;
    default:
      return null;
  }
}

interface TokenSpanProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  contentState: ContentState,
  offsetkey: string,
  entityKey: string,
}

const TokenSpan = (props: TokenSpanProps) => {
  const tokenEntity = props.contentState.getEntity(props.entityKey);
  const mutability = tokenEntity.getMutability();
  const targetData: WordAlignmentEntityData = tokenEntity.getData();
  const { wordAlignment } = targetData;
  const { confidence } = wordAlignment;
  const LC = confidence < 0.8;
  let style = getDecoratedStyle(mutability) ?? {};
  if (LC) {
    style = { ...style, backgroundColor: 'rgba(248, 222, 126, 1.0)' };
  }
  return (
    <span data-offset-key={props.offsetkey} style={style}>
      {props.children}
    </span>
  );
};

function getEntityStrategy(mutability: DraftEntityMutability) {
  return function (contentBlock: ContentBlock, callback: (start: number, end: number) => void, contentState: ContentState) {
    contentBlock.findEntityRanges((character) => {
      const entityKey = character.getEntity();
      if (entityKey === null) {
        return false;
      }
      return contentState.getEntity(entityKey).getMutability() === mutability;
    }, callback);
  };
}

/**
 * adds custom key binding types that will be picked up by the editor
 */
function customKeyBindingFunction(event: React.KeyboardEvent): string {
  if (event.key === "Backspace" && event.shiftKey) {
    return KEY_COMMANDS['merge-segments-back'];
  }
  if (event.key === "Delete" && event.shiftKey) {
    return KEY_COMMANDS['merge-segments-forward'];
  }
  if (event.key === "Alt") {
    return KEY_COMMANDS['toggle-popups'];
  }
  return getDefaultKeyBinding(event) as DraftEditorCommand;
}

const decorators = new CompositeDecorator([
  {
    strategy: getEntityStrategy(MUTABILITY_TYPE.IMMUTABLE),
    component: TokenSpan
  }, {
    strategy: getEntityStrategy(MUTABILITY_TYPE.MUTABLE),
    component: TokenSpan
  }, {
    strategy: getEntityStrategy(MUTABILITY_TYPE.SEGMENTED),
    component: TokenSpan
  }
]);

interface EditorProps {
  height?: number;
  /** payload from the parent to handle */
  responseFromParent?: ParentMethodResponse;
  /** let the parent know that we've handled the request */
  onParentResponseHandled: () => void;
  loading?: boolean;
  segments: Segment[];
  playingLocation?: SegmentAndWordIndex;
  updateSegment: (segmentId: string, wordAlignments: WordAlignment[]) => void;
  assignSpeaker: (segmentIndex: number) => void;
  onWordClick: (wordLocation: SegmentAndWordIndex) => void;
  splitSegment: (segmentId: string, segmentIndex: number, splitIndex: number, onSuccess: (updatedSegments: [Segment, Segment]) => void) => Promise<void>;
  mergeSegments: (firstSegmentIndex: number, secondSegmentIndex: number, onSuccess: (segment: Segment) => void) => Promise<void>;
}

export function Editor(props: EditorProps) {
  const {
    height,
    responseFromParent,
    onParentResponseHandled,
    loading,
    segments,
    playingLocation,
    updateSegment,
    assignSpeaker,
    onWordClick,
    splitSegment,
    mergeSegments,
  } = props;
  const { enqueueSnackbar } = useSnackbar();
  const [editorState, setEditorState] = React.useState(
    EditorState.createEmpty()
  );
  const [ready, setReady] = React.useState(false);
  const [showPopups, setShowPopups] = React.useState(false);
  const [previousSelectedCursorContent, setPreviousSelectedCursorContent] = React.useState<CursorContent<WordAlignmentEntityData, SegmentBlockData> | undefined>();
  const [previousEditorState, setPreviousEditorState] = React.useState<EditorState | undefined>();
  const [previousSelectionState, setPreviousSelectionState] = React.useState<SelectionState | undefined>();

  const editorRef = React.useRef<DraftEditor | null>(null);

  const focusEditor = () => {
    editorRef !== null && editorRef.current && editorRef.current.focus();
  };

  /**
   * Creates a new state from the old one with the same selection
   * @param incomingEditorState
   */
  const cloneEditorState = (incomingEditorState?: EditorState) => {
    if (!incomingEditorState) {
      incomingEditorState = editorState;
    }
    const newEditorStateWithSameContentAndSelection = EditorState.forceSelection(incomingEditorState, incomingEditorState.getSelection());
    return newEditorStateWithSameContentAndSelection;
  };

  /**
   * Forces a rerender by creating a new state from the old one with the same selection
   * @param incomingEditorState
   */
  const forceRerender = (incomingEditorState?: EditorState) => {
    if (!incomingEditorState) {
      incomingEditorState = editorState;
    }
    // to force the editor to update
    setEditorState(cloneEditorState(incomingEditorState));
  };

  const displayWarningMessage = (message: string, variant: VariantType = SNACKBAR_VARIANTS.info) => {
    enqueueSnackbar(message, { variant });
  };

  /**
   * used in the custom block to open the speaker dialog
   */
  const assignSpeakerForSegment = (segmentId: string) => {
    const segmentIndex = findIndexOfSegmentId(segmentId);
    if (typeof segmentIndex === 'number') {
      assignSpeaker(segmentIndex);
    }
  };

  function customBlockRenderer(contentBlock: ContentBlock) {
    const type = contentBlock.getType();
    if (type === BLOCK_TYPE.segment) {
      return {
        component: SegmentBlock,
        editable: true,
        props: {
          showPopups,
          assignSpeakerForSegment,
        },
      };
    }
  }


  const createEntity = (wordAlignment: WordAlignment, wordKey: number, key: number) => {
    const data: WordAlignmentEntityData = {
      wordKey,
      wordAlignment,
    };
    const entity: RawDraftEntity = {
      type: ENTITY_TYPE.TOKEN,
      mutability: MUTABILITY_TYPE.MUTABLE,
      data,
    };
    const updatedMap = { ...entityMap, [key]: entity };
    entityMap = { ...updatedMap };
  };

  const generateStateFromSegments = () => {
    console.log('segments', segments);
    let textString = '';
    segments.forEach((segment: Segment, index: number) => {
      if (!index) {
        textString = `${index}`;
      } else {
        textString = textString + `***${index}`;
      }
    });
    wordKeyBank.init(segments);
    const content = ContentState.createFromText(textString, '***');
    const rawContent = convertToRaw(content);
    rawContent.blocks = rawContent.blocks.map((block, index) => {
      const segment = segments[index];
      const newBlock = { ...block };
      newBlock.type = BLOCK_TYPE.segment;
      const data: SegmentBlockData = {
        segment,
      };
      newBlock.data = data;
      let transcript = segment.wordAlignments.map(wordAlignment => wordAlignment.word.replace('|', ' ')).join('•').trim();
      transcript = transcript.split("• ").join(' ').trim();
      newBlock.text = transcript;
      let offsetPosition = 0;
      const entityRanges: RawDraftEntityRange[] = segment.wordAlignments.map((wordAlignment, wordIndex) => {
        const wordLocation: SegmentAndWordIndex = [index, wordIndex];
        const wordKey = wordKeyBank.generateKey(wordLocation);
        entityKeyToWordKeyMap[entityKeyCounter] = wordKey;
        wordKeyToEntityKeyMap[wordKey] = entityKeyCounter;
        createEntity(wordAlignment, wordKey, entityKeyCounter);
        const { word } = wordAlignment;
        const filteredWord = word.replace('|', '');
        const wordLength = filteredWord.length;
        const wordStartIndex = transcript.indexOf(filteredWord);
        const offset = offsetPosition + wordStartIndex;
        const wordOffset = wordStartIndex + wordLength - 1;
        offsetPosition = offsetPosition + wordOffset;
        transcript = transcript.slice(wordOffset);
        const entityRange: RawDraftEntityRange = {
          offset,
          length: wordLength,
          key: entityKeyCounter,
        };
        entityKeyCounter++;
        return entityRange;
      });
      newBlock.entityRanges = entityRanges;
      return newBlock;
    });
    rawContent.entityMap = { ...entityMap };
    const updatedContent = convertFromRaw(rawContent);
    const updatedEditorState = EditorState.createWithContent(updatedContent, decorators);
    console.log('convertToRaw(content)', convertToRaw(content));
    console.log('rawContent', rawContent);

    // to keep track of segment locations within the blocks
    const createdContent = convertToRaw(content);
    createdContent.blocks.forEach((block, index) => {
      const { key } = block;
      const { id } = segments[index];
      setBlockSegmentId(key, id);
      setSegmentIdBlockKey(id, key);
      segmentOrderById.push(id);
    });

    setEditorState(updatedEditorState);
    setReady(true);
  };

  React.useEffect(() => {
    generateStateFromSegments();
    focusEditor();
  }, []);


  React.useEffect(() => {
    log({
      file: `Editor.tsx`,
      caller: `convertToRaw(editorState)`,
      value: convertToRaw(editorState.getCurrentContent()),
      important: false,
      trace: false,
      error: false,
      warn: false,
    });
  }, [editorState]);

  const getTargetSelection = (wordLocation: SegmentAndWordIndex): TargetSelection | null => {
    const contentState = editorState.getCurrentContent();
    // to find the entinty within the correct segment
    const [segmentIndex, wordIndex] = wordLocation;
    const rawContent = convertToRaw(contentState);
    const targetBlock = rawContent.blocks[segmentIndex];
    // to get the target entity key 
    let targetEntityRange: RawDraftEntityRange | undefined;
    for (let i = 0; i < targetBlock.entityRanges.length; i++) {
      const entityRange = targetBlock.entityRanges[i];
      const entityWordKey = getWordKeyFromEntityKey(entityRange.key);
      const entityWordLocation = wordKeyBank.getLocation(entityWordKey);
      // compare strings generated from the tuples because we can't compare the tuples to each other
      if (generateWordKeyString(entityWordLocation) === generateWordKeyString(wordLocation)) {
        targetEntityRange = { ...entityRange };
        break;
      }
    }
    if (!targetEntityRange) {
      return null;
    }
    const { key, offset, length } = targetEntityRange;
    const end = offset + length;

    // to keep track of where the previously played word was
    prevPlayingEntityKey = key;

    const targetSelectionArea = {
      anchorOffset: offset,
      focusOffset: end,
      anchorKey: targetBlock.key,
      focusKey: targetBlock.key,
    };
    return targetSelectionArea;
  };

  const getSelectionOfAll = (): SelectionState => {
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

  const removeStyleFromSelection = (selectionState: SelectionState, styleType: INLINE_STYLE_TYPE): EditorState => {
    // to not allow any changes into the stack
    const noUndoEditorState = EditorState.set(editorState, { allowUndo: false });
    const editorStateWithSelection = EditorState.forceSelection(noUndoEditorState, selectionState);
    const contentState = editorStateWithSelection.getCurrentContent();
    const updatedContentState = Modifier.removeInlineStyle(contentState, selectionState, styleType);
    // add the content change to the editor state
    const updatedEditorState = EditorState.push(editorStateWithSelection, updatedContentState, EDITOR_CHANGE_TYPE['change-inline-style']);
    return updatedEditorState;
  };

  const updateWordForCurrentPlayingLocation = (wordLocation: SegmentAndWordIndex) => {
    const targetSelectionArea = getTargetSelection(wordLocation);

    try {
      // to add the style for the current playing word
      if (targetSelectionArea) {
        const originalSelectionState = editorState.getSelection();
        // to remove the playing style from all content
        const selectAllState = getSelectionOfAll();
        const editorStateWithNoStyling = removeStyleFromSelection(selectAllState, INLINE_STYLE_TYPE.PLAYING);

        const newSelection = originalSelectionState.merge(targetSelectionArea) as SelectionState;
        // select the target area and update style
        const editorStateWithNewTargetSelection = EditorState.forceSelection(editorStateWithNoStyling, newSelection);
        const editorStateWithStyles = RichUtils.toggleInlineStyle(editorStateWithNewTargetSelection, INLINE_STYLE_TYPE.PLAYING);

        // reset to the original selection
        const editorStateWithStylesAndOriginalSelection = EditorState.forceSelection(
          editorStateWithStyles,
          originalSelectionState
        );
        // to re-enable future any changes into the stack
        const undoableEditorStateWithStylesAndOriginalSelection = EditorState.set(editorStateWithStylesAndOriginalSelection, { allowUndo: true });
        setEditorState(undoableEditorStateWithStylesAndOriginalSelection);
      }
    } catch (error) {
      log({
        file: `Editor.tsx`,
        caller: `updateWordForCurrentPlayingLocation`,
        value: error,
        important: true,
      });
    }
  };

  // update the playing location
  React.useEffect(() => {
    if (playingLocation && ready) {
      const wordKey = wordKeyBank.getKey(playingLocation);
      if (typeof wordKey !== 'number') {
        return;
      }
      const entityKey = getEntityKeyFromWordKey(wordKey);
      if (typeof entityKey === 'number' && entityKey !== prevPlayingEntityKey) {
        updateWordForCurrentPlayingLocation(playingLocation);
      }
    }
  }, [playingLocation, ready]);

  /**
   * gets the block object and corrects the character list entity keys. Also gets 
   * additional block info that is only supplied when parsing the raw content
   * - the `characterList` will originally have incorrect entity keys.
   * They are incremented by 1 for some reason. 
   *  **The returned value will have been fixed and will be correct**
   * @returns the adjusted block object
   * @returns the original block
   * @returns the inline style ranges for the block
   * @returns the inline entity ranges for the block
   */
  function getBlockInfoForBlockKey<U>(blockKey: string, contentState: ContentState): BlockInfo<U> {
    // The block in which the selection starts
    const block = contentState.getBlockForKey(blockKey);
    const blockObject: BlockObject<U> = block.toJS();
    // to fix the character list entity values
    // the `blockObject`'s `characterList` will have incorrect entity keys.
    // They will be incremented by 1 for some reason.
    blockObject.characterList = blockObject.characterList.map((characterProperties) => {
      const updatedProperties = { ...characterProperties };
      const { entity } = updatedProperties;
      if (entity) {
        let entityKeyNumber = Number(entity);
        if (typeof entityKeyNumber === 'number') {
          entityKeyNumber--;
          updatedProperties.entity = entityKeyNumber.toString();
        }
      }
      return updatedProperties;
    });

    // get the data that is only surfaces when parsing raw content state
    const rawContent = convertToRaw(contentState);
    let blockIndex = 0;
    for (let i = 0; i < rawContent.blocks.length; i++) {
      const block = rawContent.blocks[i];
      if (block.key === blockKey) {
        blockIndex = i;
        break;
      }
    }
    const { inlineStyleRanges, entityRanges } = rawContent.blocks[blockIndex];

    return { blockObject, block, inlineStyleRanges, entityRanges };
  }

  /**
   * Get the entiy at the current cursor location
   * - checks to the right of the cursor
   * - the `blockObject`'s `characterList` will originally have incorrect entity keys.
   * They are incremented by 1 for some reason. 
   *  **The returned value will have been fixed and will be correct**
   * @param incomingEditorState - will use the current state saved in the store if empty
   * @returns entity is `null` if there is no enity at the selection
   */
  const getCursorContent = <T, U>(incomingEditorState?: EditorState): CursorContent<T, U> => {
    if (!incomingEditorState) {
      incomingEditorState = editorState;
    }
    const selectionState = incomingEditorState.getSelection();
    const selectionBlockStartKey = selectionState.getStartKey();
    const selectionBlockEndKey = selectionState.getEndKey();
    const startOffset = selectionState.getStartOffset();
    const endOffset = selectionState.getEndOffset();
    const contentState = incomingEditorState.getCurrentContent();


    const isNoSelection = (selectionBlockStartKey === selectionBlockEndKey && startOffset === endOffset);

    // The block in which the selection starts
    const { blockObject, block, entityRanges, inlineStyleRanges } = getBlockInfoForBlockKey<U>(selectionBlockStartKey, contentState);
    const blockText = blockObject.text;

    const cursorLocationWithinBlock = selectionState.getAnchorOffset();
    const characterPropertiesAtCursor = blockObject.characterList[cursorLocationWithinBlock];

    let characterAtCursor = blockText[cursorLocationWithinBlock];
    let characterPropertiesBeforeCursor = {} as CharacterProperties;
    let isEndOfBlock = false;
    let isStartOfBlock = false;
    let characterBeforeCursor = '';
    // to handle selecting the end of a block
    if (characterAtCursor === undefined ||
      characterPropertiesAtCursor === undefined ||
      blockObject.characterList.length <= cursorLocationWithinBlock) {
      isEndOfBlock = true;
      characterAtCursor = '';
    }
    if (cursorLocationWithinBlock === 0) {
      isStartOfBlock = true;
    } else {
      characterBeforeCursor = blockText[cursorLocationWithinBlock - 1];
      characterPropertiesBeforeCursor = blockObject.characterList[cursorLocationWithinBlock - 1];
    }

    const characterDetailsAtCursor: CharacterDetails = {
      character: characterAtCursor,
      properties: characterPropertiesAtCursor,
    };
    const characterDetailsBeforeCursor: CharacterDetails = {
      character: characterBeforeCursor,
      properties: characterPropertiesBeforeCursor,
    };
    let entity: RawDraftEntity<T> | null = null;

    // Entity key at the start selection
    const entityKey = block.getEntityAt(startOffset);
    if (entityKey) {
      // The actual entity instance
      const entityInstance = contentState.getEntity(entityKey);
      const type = entityInstance.getType();
      const mutability = entityInstance.getMutability();
      const data: T = entityInstance.getData();
      entity = {
        type,
        mutability,
        data,
      };
    }

    const cursorContent = {
      isNoSelection,
      entity,
      isEndOfBlock,
      isStartOfBlock,
      characterDetailsBeforeCursor,
      characterDetailsAtCursor,
      cursorOffset: cursorLocationWithinBlock,
      blockObject,
      blockEntityRanges: entityRanges,
      blockInlineStyleRanges: inlineStyleRanges,
    };
    return cursorContent;
  };

  const updateBlockSegmentData = (contentState: ContentState, blockKey: string, segment: Segment): ContentState => {
    const emptySelectionAtBlock = SelectionState.createEmpty(blockKey);
    const updatedDataMap = Map({ segment });
    const updatedContentState = Modifier.setBlockData(contentState, emptySelectionAtBlock, updatedDataMap);
    return updatedContentState;
  };

  /**
   * builds the callback to update the manually merged block with the updated segment Id response
   */
  const buildMergeSegmentCallback = (targetBlock: BlockObject<SegmentBlockData>, incomingEditorState: EditorState) => {
    const onMergeSegmentResponse = (updatedSegment: Segment) => {
      const blockKey = targetBlock.key;
      const blockSegment = targetBlock.data.segment as Segment;
      // get the index using the old segment id
      const blockSegmentIndex = findIndexOfSegmentId(blockSegment.id);
      if (typeof blockSegmentIndex !== 'number') {
        log({
          file: `Editor.tsx`,
          caller: `onMergeSegmentResponse`,
          value: 'Failed to get index of segment to update',
          important: true,
        });
        return;
      }
      // update with the new segment Id
      replaceSegmentIdAtIndex(blockSegmentIndex, updatedSegment.id);

      setBlockSegmentId(blockKey, updatedSegment.id);
      setSegmentIdBlockKey(updatedSegment.id, blockKey);
      const contentState = incomingEditorState.getCurrentContent();
      const updatedContentState = updateBlockSegmentData(contentState, blockKey, updatedSegment);

      const noUndoEditorState = EditorState.set(incomingEditorState, { allowUndo: false });
      const updatedContentEditorState = EditorState.push(noUndoEditorState, updatedContentState, EDITOR_CHANGE_TYPE['change-block-data']);
      const allowUndoEditorState = EditorState.set(updatedContentEditorState, { allowUndo: true });
      setEditorState(allowUndoEditorState);
    };
    return onMergeSegmentResponse;
  };

  /**
   * builds the callback to the manually split blocks with the updated segment Ids response
   */
  const buildSplitSegmentCallback = (targetBlock: BlockObject<SegmentBlockData>, newBlock: BlockObject<SegmentBlockData>, wordSplitIndex: number, incomingEditorState: EditorState) => {
    const onSplitSegmentResponse = (updatedSegments: [Segment, Segment]) => {
      const [updatedSegment, newSegment] = updatedSegments;
      const blockKey = targetBlock.key;
      const newBlockKey = newBlock.key;
      const blockSegment = targetBlock.data.segment as Segment;
      // get the index using the old segment id
      const blockSegmentIndex = findIndexOfSegmentId(blockSegment.id);
      if (typeof blockSegmentIndex !== 'number') {
        log({
          file: `Editor.tsx`,
          caller: `onSplitSegmentResponse`,
          value: 'Failed to get index of segment to update',
          important: true,
        });
        return;
      }
      // update with the new segment Id
      replaceSegmentIdAtIndex(blockSegmentIndex, updatedSegment.id);

      const newBlockSegmentIndex = blockSegmentIndex + 1;
      // set the new block segment Id
      replaceSegmentIdAtIndex(newBlockSegmentIndex, newSegment.id);


      setBlockSegmentId(blockKey, updatedSegment.id);
      setBlockSegmentId(newBlockKey, newSegment.id);
      setSegmentIdBlockKey(updatedSegment.id, blockKey);
      setSegmentIdBlockKey(newSegment.id, newBlockKey);

      const contentState = incomingEditorState.getCurrentContent();
      // update segment data
      const updatedContentState = updateBlockSegmentData(contentState, blockKey, updatedSegment);
      const newContentState = updateBlockSegmentData(updatedContentState, newBlockKey, newSegment);

      const noUndoEditorState = EditorState.set(incomingEditorState, { allowUndo: false });
      const updatedContentEditorState = EditorState.push(noUndoEditorState, newContentState, EDITOR_CHANGE_TYPE['change-block-data']);
      const allowUndoEditorState = EditorState.set(updatedContentEditorState, { allowUndo: true });
      setEditorState(allowUndoEditorState);
    };
    return onSplitSegmentResponse;
  };

  const handleKeyCommand = (command: string, incomingEditorState: EditorState, eventTimeStamp: number): DraftHandleValue => {
    console.log('command', command);
    //!
    //TODO
    //!
    //TODO
    // MOVE THESE TO A SWITCH
    //!
    //TODO
    //!
    //TODO
    if (command === KEY_COMMANDS['toggle-popups']) {
      setShowPopups(prevValue => !prevValue);
      // we need to rerender the block components to toggle the popups
      forceRerender(incomingEditorState);
    }
    // don't allow if at end
    if (command === KEY_COMMANDS.delete || command === KEY_COMMANDS['delete-word']) {
      const { isEndOfBlock } = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
      if (isEndOfBlock) {
        return HANDLE_VALUES.handled;
      }
    }
    // don't allow if at start
    if (command === KEY_COMMANDS.backspace ||
      command === KEY_COMMANDS['backspace-word'] ||
      command === KEY_COMMANDS['backspace-to-start-of-line']) {
      const { isStartOfBlock } = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
      if (isStartOfBlock) {
        return HANDLE_VALUES.handled;
      }
    }
    if (command === KEY_COMMANDS['merge-segments-back']) {
      const { isStartOfBlock, blockObject } = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
      const blockSegment = blockObject.data.segment;
      if (!blockSegment) {
        return HANDLE_VALUES.handled;
      }
      const blockSegmentIndex = findIndexOfSegmentId(blockSegment.id);
      if (isStartOfBlock && !loading && typeof blockSegmentIndex === 'number') {
        const contentState = incomingEditorState.getCurrentContent();
        // get the block before this one
        const blockBefore = contentState.getBlockBefore(blockObject.key);

        // if we are already on the first block
        if (!blockBefore) {
          return HANDLE_VALUES.handled;
        }

        const blockBeforeObject: BlockObject<SegmentBlockData> = blockBefore.toJS();
        const blockBeforeSegment = blockBeforeObject.data.segment;
        if (!blockBeforeSegment) {
          return HANDLE_VALUES.handled;
        }
        const blockBeforeSegmentIndex = findIndexOfSegmentId(blockBeforeSegment.id);
        if (typeof blockSegmentIndex === 'number' && typeof blockBeforeSegmentIndex === 'number') {

          // handle the split

          // add empty space to block
          let beforeEndOffset = blockBeforeObject.characterList.length;
          if (beforeEndOffset < 0) {
            beforeEndOffset = 0;
          }
          const endOfBlockSelection = new SelectionState({
            anchorKey: blockBeforeObject.key,
            anchorOffset: beforeEndOffset,
            focusKey: blockBeforeObject.key,
            focusOffset: beforeEndOffset,
          });
          const contentStateWithSpace = Modifier.insertText(
            contentState,
            endOfBlockSelection,
            ' ',
          );

          //  merge the blocks in the editor
          const currentEndOffset = blockObject.characterList.length;
          const currentBlockToMoveSelection = new SelectionState({
            anchorKey: blockObject.key,
            anchorOffset: 0,
            focusKey: blockObject.key,
            focusOffset: currentEndOffset + 1,
          });
          // adding one to account for the inserted empty space
          const updatedBeforeEndOffsetAfterSpace = beforeEndOffset + 1;
          const endOfBlockSelectionAfterUpdate = new SelectionState({
            anchorKey: blockBeforeObject.key,
            anchorOffset: updatedBeforeEndOffsetAfterSpace,
            focusKey: blockBeforeObject.key,
            focusOffset: updatedBeforeEndOffsetAfterSpace,
          });
          const contentStateAfterMove = Modifier.moveText(
            contentStateWithSpace,
            currentBlockToMoveSelection,
            endOfBlockSelectionAfterUpdate,
          );

          // to handle removing the moved block completely
          // moving will leave the moved block with empty text

          // adding one to account for the moved text
          const updatedBeforeEndOffsetAfterMove = updatedBeforeEndOffsetAfterSpace + blockObject.text.length;
          const remainingBlockToRemove = new SelectionState({
            anchorKey: blockBeforeObject.key,
            anchorOffset: updatedBeforeEndOffsetAfterMove,
            focusKey: blockObject.key,
            focusOffset: 0,
          });
          const contentStateAfterRemove = Modifier.removeRange(
            contentStateAfterMove,
            remainingBlockToRemove,
            REMOVAL_DIRECTION.backward,
          );

          // update with new content
          const updatedEditorState = EditorState.push(incomingEditorState, contentStateAfterRemove, EDITOR_CHANGE_TYPE['backspace-character']);
          // set the cursor selection to the correct location
          const updatedEditorStateWithCorrectSelection = EditorState.forceSelection(
            updatedEditorState,
            endOfBlockSelectionAfterUpdate,
          );

          setEditorState(updatedEditorStateWithCorrectSelection);

          const mergeCallback = buildMergeSegmentCallback(blockBeforeObject, updatedEditorStateWithCorrectSelection);

          // update the word id bank and segment id array
          removeSegmentIdAtIndexAndShift(blockSegmentIndex);
          // send the merge request
          mergeSegments(blockBeforeSegmentIndex, blockSegmentIndex, mergeCallback);
        }

      }
      return HANDLE_VALUES.handled;
    }

    const newState = RichUtils.handleKeyCommand(incomingEditorState, command);
    if (newState) {
      setEditorState(newState);
      return HANDLE_VALUES.handled;
    }
    return HANDLE_VALUES['not-handled'];
  };

  const handleChange = (incomingEditorState: EditorState) => {
    const cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
    const { blockObject } = cursorContent;
    console.log('blockObject', blockObject);
    if (!previousSelectedCursorContent || !previousSelectionState) {
      setPreviousSelectedCursorContent(cursorContent);
      setPreviousSelectionState(incomingEditorState.getSelection());
    } else if (previousSelectedCursorContent && previousSelectionState) {
      const blockToCompare = { ...previousSelectedCursorContent.blockObject };
      // check if no longer on previous block
      if (blockToCompare && (blockToCompare.key !== blockObject.key)) {
        // get the current state of the previous block
        const contentState = incomingEditorState.getCurrentContent();
        const currentStateOfPreviousBlockObjectAndBlock = getBlockInfoForBlockKey<SegmentBlockData>(blockToCompare.key, contentState);
        const currentStateOfPreviousBlockObject = currentStateOfPreviousBlockObjectAndBlock.blockObject;
        const currentEntityRangesOfPreviousBlock = currentStateOfPreviousBlockObjectAndBlock.entityRanges;
        console.log('currentStateOfPreviousBlockObject.characterList', currentStateOfPreviousBlockObject.characterList);
        // check for changes between previous state of the prev block and current state of prev block
        if (JSON.stringify(blockToCompare.characterList) !== JSON.stringify(currentStateOfPreviousBlockObject.characterList)) {
          // ensure all characters are within an entity
          const allWordsHaveEntity = currentStateOfPreviousBlockObject.characterList.every((characterProperties, index) => {
            if (characterProperties.entity) {
              return true;
            }
            const character = currentStateOfPreviousBlockObject.text[index];
            return SPLITTABLE_CHARACTERS.includes(character);
          });
          console.log('CHANGES PRESENT');
          console.log('allWordsHaveEntity', allWordsHaveEntity);
          if (!allWordsHaveEntity) {
            //revert to old cursor position and display message
            const prevSelectionEditorState = EditorState.forceSelection(incomingEditorState, previousSelectionState);
            setEditorState(prevSelectionEditorState);
            displayWarningMessage('TEST WORDS MISSING TIME INFO');
            return;
          }

          // build request and submit change
          const { segment } = currentStateOfPreviousBlockObject.data;
          if (segment?.id) {
            const { text, characterList } = currentStateOfPreviousBlockObject;
            const entityRangeByEntityKey: EntityRangeByEntityKey = {};
            currentEntityRangesOfPreviousBlock.forEach(entityRange => {
              entityRangeByEntityKey[entityRange.key] = entityRange;
            });

            // get the entities in the block
            const entityKeysInBlock = new Set<string>();
            characterList.forEach((characterProperties, index) => {
              const entityKeyString = characterProperties.entity;
              const entityKey = Number(entityKeyString);
              if (entityKeyString && typeof entityKey === 'number') {
                entityKeysInBlock.add(entityKeyString);
              }
            });
            const entityKeysArray = Array.from(entityKeysInBlock);

            // update the text of each word alignment and push to the list
            const wordAlignments: WordAlignment[] = [];
            entityKeysArray.forEach((entityKey, index) => {
              const entity = getEntityByKey(entityKey);
              const { wordAlignment } = entity.data;
              const entityRange = entityRangeByEntityKey[entityKey];
              if (wordAlignment && entityRange) {
                const { offset, length } = entityRange;
                const endTextIndex = offset + length + 1;
                const entityText = text.slice(offset, endTextIndex);
                wordAlignment.word = entityText;
                wordAlignments.push(wordAlignment);
              }
            });
            if (wordAlignments.length) {
              updateSegment(segment.id, wordAlignments);
            }
          }

        }

        // update since block focus changed
        setPreviousSelectedCursorContent(cursorContent);
      }

    }
    if (!loading) {
      // update location since we are still in same block
      setPreviousSelectionState(incomingEditorState.getSelection());
      setEditorState(incomingEditorState);
    }
  };

  const handleReturnPress = (event: React.KeyboardEvent, incomingEditorState: EditorState): DraftHandleValue => {
    // only split when holding shift
    if (event.shiftKey && !loading) {

      const cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
      const {
        isNoSelection,
        entity,
        isEndOfBlock,
        isStartOfBlock,
        characterDetailsBeforeCursor,
        characterDetailsAtCursor,
        cursorOffset,
        blockObject,
      } = cursorContent;

      // check if we are at a valid location for splitting segments
      if (isEndOfBlock || isStartOfBlock) {
        return HANDLE_VALUES.handled;
      }

      const beforeEntityId = characterDetailsBeforeCursor.properties?.entity;
      const afterEntityId = characterDetailsAtCursor.properties?.entity;
      const isWithinSameEntity = (beforeEntityId && afterEntityId) && (beforeEntityId === afterEntityId);

      if (isWithinSameEntity) {
        return HANDLE_VALUES.handled;
      }

      let validEntity = entity;

      // to keep track of how far we had to travel and how many 
      // characters to erase if we need to find a valid entity
      let dinstanceFromCursor = 0;

      // no entity at cursor - we must find the nearest entity
      if (!validEntity) {
        // ensure that we are at a valid split point
        const characterAtCursor = blockObject.text[cursorOffset];
        if (!SPLITTABLE_CHARACTERS.includes(characterAtCursor)) {
          return HANDLE_VALUES.handled;
        }
        const characterListToCheck = blockObject.characterList.slice(cursorOffset);
        const charactersToCheck = blockObject.text.slice(cursorOffset);
        let splitEntityKeyString: string | null = null;
        for (let i = 0; i < characterListToCheck.length; i++) {
          const characterProperties = characterListToCheck[i];
          const character = charactersToCheck[i];
          if (characterProperties.entity) {
            splitEntityKeyString = characterProperties.entity;
            dinstanceFromCursor = i;
            break;
          }
          // we have invalid content between the cursor and the next valid word
          if (!SPLITTABLE_CHARACTERS.includes(character)) {
            break;
          }
        }
        const splitEntityKey = Number(splitEntityKeyString);
        // we hit the end before finding a valid entity
        if (!splitEntityKeyString || typeof splitEntityKey !== 'number' || splitEntityKey < 0) {
          return HANDLE_VALUES.handled;
        }
        const splitEntity = getEntityByKey(splitEntityKeyString);

        validEntity = { ...splitEntity };
      }

      // to check that we still have a valid entity to use
      if (validEntity) {
        // use the entity data to get split location
        const { wordKey } = validEntity.data;
        const [segmentIndex, wordIndex] = wordKeyBank.getLocation(wordKey);
        const blockSegment = blockObject.data.segment;
        if (!blockSegment) {
          return HANDLE_VALUES.handled;
        }
        const blockSegmentIndex = findIndexOfSegmentId(blockSegment.id);
        if (typeof segmentIndex === 'number' && typeof wordIndex === 'number' && segmentIndex === blockSegmentIndex) {
          let contentStateToSplit = incomingEditorState.getCurrentContent();
          let characterBeforeOffset = cursorOffset;

          const deleteEndOffset = cursorOffset + dinstanceFromCursor;
          const shouldTrimBefore = SPLITTABLE_CHARACTERS.includes(characterDetailsBeforeCursor.character);
          // remove any split characters that may have existed before
          // if space, determine if the next character to the 
          // left is a split character otherwise determine how
          // many empty space characters to remove
          if (shouldTrimBefore) {
            let numberOfCharactersToRemove = 1;
            if (characterDetailsBeforeCursor.character !== SPLIT_CHARACTER) {
              const { text } = blockObject;
              const startingOffsetToCheck = cursorOffset - (numberOfCharactersToRemove + 1);
              for (let i = startingOffsetToCheck; i >= 0; i--) {
                const character = text[i];
                if (character === ' ') {
                  numberOfCharactersToRemove++;
                } else if (character === SPLIT_CHARACTER) {
                  numberOfCharactersToRemove++;
                  break;
                } else {
                  break;
                }
              }
            }
            characterBeforeOffset = characterBeforeOffset - numberOfCharactersToRemove;
          }
          // to remove if we have valid reason to
          // remove any empty space between the cursor and any found entity
          // remove any empty space before the cursor
          if (shouldTrimBefore || dinstanceFromCursor) {
            const rangeToRemove = new SelectionState({
              anchorKey: blockObject.key,
              anchorOffset: characterBeforeOffset,
              focusKey: blockObject.key,
              focusOffset: deleteEndOffset,
            });
            const contentStateWithRemovedCharaters = Modifier.removeRange(contentStateToSplit, rangeToRemove, REMOVAL_DIRECTION.forward);
            contentStateToSplit = contentStateWithRemovedCharaters;
          }

          // handle the split
          const selectionToSplit = new SelectionState({
            anchorKey: blockObject.key,
            anchorOffset: characterBeforeOffset,
            focusKey: blockObject.key,
            focusOffset: characterBeforeOffset,
          });
          const splitContentState = Modifier.splitBlock(contentStateToSplit, selectionToSplit);
          const editorStateAfterSplit = EditorState.push(incomingEditorState, splitContentState, EDITOR_CHANGE_TYPE['split-block']);
          // get the newly created block
          const newBlock = splitContentState.getBlockAfter(blockObject.key);
          const newBlockKey = newBlock.getKey();
          const newBlockObject: BlockObject<SegmentBlockData> = newBlock.toJS();

          // set cursor postiion
          const newBlockCursorPosition = new SelectionState({
            anchorKey: newBlockKey,
            anchorOffset: 0,
            focusKey: newBlockKey,
            focusOffset: 0,
          });
          const editorStateWithCursorMoved = EditorState.forceSelection(editorStateAfterSplit, newBlockCursorPosition);
          setEditorState(editorStateWithCursorMoved);

          const splitCallback = buildSplitSegmentCallback(blockObject, newBlockObject, wordIndex, editorStateWithCursorMoved);

          // update the word id bank and segment id array
          insertSegmentIdAtIndex(segmentIndex, wordIndex, blockSegment.id);

          splitSegment(blockSegment.id, segmentIndex, wordIndex, splitCallback);

          return HANDLE_VALUES.handled;
        }

      }

    }
    return HANDLE_VALUES.handled;

  };

  const handleFocus = () => {
    console.log('handleFocus');
  };

  const handleBlur = () => {
    console.log('handleBlur');
  };

  const handleClickInsideEditor = () => {
    const { isNoSelection, entity } = getCursorContent<WordAlignmentEntityData, SegmentBlockData>();
    console.log('handleClickInsideEditor', entity);
    if (isNoSelection && typeof entity?.data?.wordKey === 'number') {
      const segmentAndWordIndex = wordKeyBank.getLocation(entity.data.wordKey);
      onWordClick(segmentAndWordIndex);
    }
  };

  React.useEffect(() => {
    if (responseFromParent && responseFromParent instanceof Object) {
      onParentResponseHandled();
      const { type, payload } = responseFromParent;
      const { segment } = payload;
      const currentContentState = editorState.getCurrentContent();
      let blockKey: string | undefined;
      let updatedContentState: ContentState | undefined;
      switch (type) {
        case PARENT_METHOD_TYPES.speaker:
          blockKey = getBlockKeyFromSegmentId(segment.id);
          if (blockKey) {
            updatedContentState = updateBlockSegmentData(currentContentState, blockKey, segment);
          }
          break;
      }
      // set our updated state
      if (updatedContentState) {
        const noUndoEditorState = EditorState.set(editorState, { allowUndo: false });
        const updatedContentEditorState = EditorState.push(noUndoEditorState, updatedContentState, EDITOR_CHANGE_TYPE['change-block-data']);
        const allowUndoEditorState = EditorState.set(updatedContentEditorState, { allowUndo: true });
        setEditorState(allowUndoEditorState);
      }
    }
  }, [responseFromParent]);

  //!
  //TODO
  // don't let user to input bullet character
  //!
  //TODO
  // space when at the end of an entity breaks out of it

  return (
    <div
      onClick={handleClickInsideEditor}
      style={{
        height,
        overflowY: 'auto',
      }}
    >
      {ready &&
        <DraftEditor
          ref={editorRef}
          editorState={editorState}
          customStyleMap={styleMap}
          keyBindingFn={customKeyBindingFunction}
          blockRendererFn={customBlockRenderer}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          handleReturn={handleReturnPress}
          handleKeyCommand={handleKeyCommand}
        />
      }
    </div>
  );
};