import { Backdrop } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
import { ContentBlock, ContentState, convertFromRaw, convertToRaw, DraftHandleValue, Editor as DraftEditor, EditorState, Modifier, RawDraftEntity, RawDraftEntityRange, RichUtils, SelectionState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { useSnackbar, VariantType } from 'notistack';
import Draggable from 'react-draggable';
import React, { useGlobal } from 'reactn';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { useWindowSize } from '../../hooks/window/useWindowSize';
import { CustomTheme } from '../../theme/index';
import { BLOCK_TYPE, EntityMap, ENTITY_TYPE, HANDLE_VALUES, KEY_COMMANDS, MUTABILITY_TYPE, Segment, SegmentAndWordIndex, SNACKBAR_VARIANTS, WordAlignment } from '../../types';
import { BlockInfo, BlockKeyToSegmentId, BlockObject, CharacterDetails, CharacterProperties, CursorContent, EDITOR_CHANGE_TYPE, EntityKeyToWordKey, EntityRangeByEntityKey, REMOVAL_DIRECTION, SegmentBlockData, SegmentIdToBlockKey, Time, Word, WordAlignmentEntityData, WordKeyToEntityKey } from '../../types/editor.types';
import log from '../../util/log/logger';
import { getRandomColor } from '../../util/misc';
import { EDITOR_CONTROLS } from './components/EditorControls';
import { SegmentBlock, SegmentBlockSubProps } from './components/SegmentBlock';
import { SegmentSplitPicker } from './components/SegmentSplitPicker';
import { SegmentTimePicker } from './components/SegmentTimePicker';
import { WordTimePicker } from './components/WordTimePicker';
import { ParentMethodResponse, PARENT_METHOD_TYPES, SplitTimePickerRootProps, TimePickerRootProps } from './EditorPage';
import { buildStyleMap, cloneEditorState, customKeyBindingFunction, editorChangeNoop, generateDecorators, getWithinSegmentTimes, updateBlockSegmentData, WordKeyStore } from './helpers/editor.helper';
import './styles/editor.css';


const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    draggable: {
      "&:hover": {
        cursor: 'all-scroll',
      },
    },
    backdrop: {
      zIndex: theme.zIndex.drawer - 1,
      color: theme.shadows[1],
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
  }),
);

let wordKeyBank = new WordKeyStore();
let entityMap: EntityMap = {};
const getEntityByKey = (entityKey: string) => {
  return entityMap[entityKey];
};
const setEntityByKey = (entityKey: string, entity: RawDraftEntity<WordAlignmentEntityData>) => {
  return entityMap[entityKey] = entity;
};
let entityKeyToWordKeyMap: EntityKeyToWordKey = {};
let wordKeyToEntityKeyMap: WordKeyToEntityKey = {};
let blockKeyToSegmentIdMap: BlockKeyToSegmentId = {};
let segmentIdToBlockKeyMap: SegmentIdToBlockKey = {};
/**
 * used to keep track of where a segment Id is in the list of segments
 */
let segmentOrderById: string[] = [];
/**
 * used to get the index of the current segment Id from within the list of segments
 */
const getIndexOfSegmentId = (segmentId: string): number | null => {
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
const linkEntityKeyAndWordKey = (entityKey: number, wordKey: number) => {
  entityKeyToWordKeyMap[entityKey] = wordKey;
  wordKeyToEntityKeyMap[wordKey] = entityKey;
};
const getSegmentIdFromBlockKey = (blockKey: string) => blockKeyToSegmentIdMap[blockKey];
const getBlockKeyFromSegmentId = (segmentId: string) => segmentIdToBlockKeyMap[segmentId];
const getWordKeyFromEntityKey = (entityKey: number) => entityKeyToWordKeyMap[entityKey];
const getEntityKeyFromWordKey = (wordKey: number) => wordKeyToEntityKeyMap[wordKey];
const SPLIT_CHARACTER = '•';
const SPLITTABLE_CHARACTERS = [SPLIT_CHARACTER, ' '];
const SPLIT_CHARACTER_REGEX = new RegExp(SPLIT_CHARACTER, "g");
let entityKeyCounter = 0;
const prevPlayingEntityKey = -1;
// used to force updating of the segment
let newWordWasCreated = false;

/**
 * gets the block object and corrects the character list entity keys. Also gets 
 * additional block info that is only supplied when parsing the raw content
 * - the `characterList` will sometimes have incorrect entity keys.
 *  They are incremented by 1 for some reason. 
 * - if they are different, we will decrement them.
 * - **ONLY FOR THE ORIGINALLY CREATED ENTITIES**
 * - NEWLY CREATED ENTITIES WILL HAVE TO DECREMENT THEIR VALUES AFTER CREATION,
 * BUT BEFORE STORING THE VALUES
 *  **The returned value will have been fixed and will be correct**
 * @returns the adjusted block object
 * @returns the original block
 * @returns the inline style ranges for the block
 * @returns the inline entity ranges for the block
 */
function getBlockInfoForBlockKey<U>(blockKey: string, contentState: ContentState): BlockInfo<U> {
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

  entityMap = { ...rawContent.entityMap as EntityMap };

  // The block in which the selection starts
  const block = contentState.getBlockForKey(blockKey);
  const blockObject: BlockObject<U> = block.toJS();

  const foundEntities = new Set<number>();

  // to fix the character list entity values
  // the `blockObject`'s `characterList` will have incorrect entity keys.
  // They will be incremented by 1 for some reason.
  blockObject.characterList = blockObject.characterList.map((characterProperties) => {
    const updatedProperties = { ...characterProperties };
    const { entity } = updatedProperties;
    if (entity) {
      let entityKeyNumber = Number(entity);
      if (typeof entityKeyNumber === 'number') {
        foundEntities.add(entityKeyNumber);
        const entityKeyIndex = foundEntities.size - 1;
        const entityKeyDifferent = entityRanges[entityKeyIndex].key !== entityKeyNumber;
        if (entityKeyDifferent) {
          entityKeyNumber--;
          updatedProperties.entity = entityKeyNumber.toString();
        }
      }
    }
    return updatedProperties;
  });
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
const getCursorContent = <T, U>(incomingEditorState: EditorState): CursorContent<T, U> => {
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

  const selectionCharacterDetails: CharacterDetails[] = [];
  if (startOffset < endOffset) {
    for (let i = startOffset; i < endOffset; i++) {
      const character = blockText[i];
      const characterProperties = blockObject.characterList[i];
      const characterDetails: CharacterDetails = {
        character: character,
        properties: characterProperties,
      };
      selectionCharacterDetails.push(characterDetails);
    }
  }
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
    selectionCharacterDetails,
    blockObject,
    blockEntityRanges: entityRanges,
    blockInlineStyleRanges: inlineStyleRanges,
  };
  return cursorContent;
};


interface WordPickerOptions {
  word: Word;
  segmentIndex: number;
  entityKeyAfterCursor?: number;
  isWordUpdate?: boolean;
}
interface SegmentPickerOptions {
  segmentWord: Word;
  segment: Segment;
  cursorContent: CursorContent<WordAlignmentEntityData, SegmentBlockData>;
}

interface SegmentSplitOptions {
  segmentIndex: number;
  cursorContent: CursorContent<WordAlignmentEntityData, SegmentBlockData>;
}

interface EditorProps {
  height?: number;
  readOnly?: boolean;
  /** payload from the parent to handle */
  responseFromParent?: ParentMethodResponse;
  /** let the parent know that we've handled the request */
  onParentResponseHandled: () => void;
  editorCommand?: EDITOR_CONTROLS;
  /** let the parent know that we've handled the request */
  onCommandHandled: () => void;
  onReady: (ready: boolean) => void;
  onWordTimeCreationClose: () => void;
  onUpdateUndoRedoStack: (canUndo: boolean, canRedo: boolean) => void;
  loading?: boolean;
  segments: Segment[];
  playingLocation?: SegmentAndWordIndex;
  updateSegment: (segmentId: string, wordAlignments: WordAlignment[], transcript: string, segmentIndex: number, onSuccess: (segment: Segment) => void) => void;
  updateSegmentTime: (segmentId: string, segmentIndex: number, start: number, length: number, onSuccess: (segment: Segment) => void) => void;
  assignSpeaker: (segmentIndex: number) => void;
  onWordClick: (wordLocation: SegmentAndWordIndex) => void;
  splitSegment: (segmentId: string, segmentIndex: number, splitIndex: number, onSuccess: (updatedSegments: [Segment, Segment]) => void, ) => Promise<void>;
  splitSegmentByTime: (segmentId: string, segmentIndex: number, time: number, wordStringSplitIndex: number, onSuccess: (updatedSegments: [Segment, Segment]) => void, ) => Promise<void>;
  mergeSegments: (firstSegmentIndex: number, secondSegmentIndex: number, onSuccess: (segment: Segment) => void) => Promise<void>;
  timePickerRootProps: TimePickerRootProps;
  splitTimePickerRootProps: SplitTimePickerRootProps;
}

export function Editor(props: EditorProps) {
  const {
    height,
    readOnly,
    responseFromParent,
    onParentResponseHandled,
    editorCommand,
    onCommandHandled,
    onReady,
    onWordTimeCreationClose,
    onUpdateUndoRedoStack,
    loading,
    segments,
    playingLocation,
    updateSegment,
    updateSegmentTime,
    assignSpeaker,
    onWordClick,
    splitSegment,
    splitSegmentByTime,
    mergeSegments,
    timePickerRootProps,
    splitTimePickerRootProps,
  } = props;
  const [showEditorPopups, setShowEditorPopups] = useGlobal('showEditorPopups');
  const [editorContentHeight, setEditorContentHeight] = useGlobal('editorContentHeight');
  const [playingWordKey, setPlayingWordKey] = useGlobal('playingWordKey');
  const { enqueueSnackbar } = useSnackbar();
  const windowSize = useWindowSize();
  const windowWidth = windowSize.width;
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();
  const theme: CustomTheme = useTheme();
  const [editorState, setEditorState] = React.useState(
    EditorState.createEmpty()
  );
  const [ready, setReady] = React.useState(false);
  const [focussed, setFocussed] = React.useState(false);
  const [editorStateBeforeBlur, setEditorStateBeforeBlur] = React.useState<EditorState | undefined>();
  const [overlayStyle, setOverlayStyle] = React.useState<React.CSSProperties | undefined>();
  const [wordTimePickerOptions, setWordTimePickerOptions] = React.useState<WordPickerOptions | undefined>();
  const [segmentPickerOptions, setSegmentPickerOptions] = React.useState<SegmentPickerOptions | undefined>();
  const [segmentSplitOptions, setSegmentSplitOptions] = React.useState<SegmentSplitOptions | undefined>();
  const [readOnlyEditorState, setReadOnlyEditorState] = React.useState<EditorState | undefined>();
  const [previousSelectedCursorContent, setPreviousSelectedCursorContent] = React.useState<CursorContent<WordAlignmentEntityData, SegmentBlockData> | undefined>();
  const [previousSelectionState, setPreviousSelectionState] = React.useState<SelectionState | undefined>();

  const editorRef = React.useRef<DraftEditor | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const focusEditor = () => {
    editorRef !== null && editorRef.current && editorRef.current.focus();
  };

  const displayMessage = (message: string, variant: VariantType = SNACKBAR_VARIANTS.info) => {
    enqueueSnackbar(message, { variant });
  };

  /**
   * used in the custom block to open the speaker dialog
   */
  const assignSpeakerForSegment = (segmentId: string) => {
    const segmentIndex = getIndexOfSegmentId(segmentId);
    if (typeof segmentIndex === 'number') {
      assignSpeaker(segmentIndex);
    }
  };

  const styleMap = React.useMemo(() => {
    return buildStyleMap(theme);
  }, []);

  /** custom renderer function for segment blocks */
  function customBlockRenderer(contentBlock: ContentBlock) {
    const type = contentBlock.getType();
    if (type === BLOCK_TYPE.segment) {
      return {
        component: SegmentBlock,
        editable: true,
        props: {
          readOnly,
          assignSpeakerForSegment,
        } as SegmentBlockSubProps,
      };
    }
  };

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
      let transcript = segment.wordAlignments.map(wordAlignment => wordAlignment.word.trim().replace('|', ' ')).join(SPLIT_CHARACTER).trim();
      transcript = transcript.split("• ").join(' ').replace(SPLIT_CHARACTER_REGEX, '').trim();
      const onlyOneWord = segment.wordAlignments.length < 2;
      if (onlyOneWord) {
        transcript = segment.wordAlignments[0].word.replace('|', '');
      }
      newBlock.text = transcript;
      let offsetPosition = 0;
      const entityRanges: RawDraftEntityRange[] = segment.wordAlignments.map((wordAlignment, wordIndex) => {
        const wordLocation: SegmentAndWordIndex = [index, wordIndex];
        const wordKey = wordKeyBank.generateKey(wordLocation);
        linkEntityKeyAndWordKey(entityKeyCounter, wordKey);
        // in case there are spaces that were introduced at any point
        const trimmedWordAlignment = { ...wordAlignment };
        trimmedWordAlignment.word = trimmedWordAlignment.word.trim();
        createEntity(trimmedWordAlignment, wordKey, entityKeyCounter);
        const { word } = trimmedWordAlignment;
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
    const updatedEditorState = EditorState.createWithContent(updatedContent, generateDecorators());
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
    onReady(true);
  };


  /**
   * build new entity and key maps when Draft.js changes the enity key map
   * - Draft.js will sometimes reorder and rename 
   * the keys, so our maps will be out of sync
   */
  const rebuildEntityMapFromContentState = (contentState: ContentState) => {
    const rawContent = convertToRaw(contentState);
    const incomingEntityMap = rawContent.entityMap;
    // only rebuild if the internal entity map has changed
    if (JSON.stringify(incomingEntityMap) === JSON.stringify(entityMap)) {
      return;
    }
    const entityKeys = Object.keys(incomingEntityMap);
    entityKeys.forEach(entityKey => {
      const entityKeyNumber = Number(entityKey);
      const data = incomingEntityMap[entityKey].data as WordAlignmentEntityData;
      if (typeof data?.wordKey === 'number') {
        linkEntityKeyAndWordKey(entityKeyNumber, data.wordKey);
      }
    });
    entityMap = { ...incomingEntityMap } as EntityMap;
  };

  /** updates the undo/redo button status and rebuilds the entity map */
  const onEditorStateUpdate = (editorState: EditorState) => {
    const contentState = editorState.getCurrentContent();
    rebuildEntityMapFromContentState(contentState);
    const undoStack = editorState.getUndoStack();
    const redoStack = editorState.getRedoStack();
    const canUndo = undoStack.size > 0;
    const canRedo = redoStack.size > 0;
    onUpdateUndoRedoStack(canUndo, canRedo);
  };

  /**
   * creates an entity and applies it to the current selection
   * @returns the newly created entity key
   */
  const setEntityAtSelection = (draftEntity: RawDraftEntity, incomingEditorState: EditorState): {
    entityKey: string;
    updatedEditorState: EditorState;
  } => {
    const { type, mutability, data } = draftEntity;
    const contentState = incomingEditorState.getCurrentContent();
    // Returns ContentState record updated to include the newly created DraftEntity record in it's EntityMap.
    let newContentState = contentState.createEntity(type, mutability, data);
    // Call getLastCreatedEntityKey to get the key of the newly created DraftEntity record.
    const entityKey = contentState.getLastCreatedEntityKey();
    // Get the current selection
    const selectionState = incomingEditorState.getSelection();
    // Add the created entity to the current selection, for a new contentState
    newContentState = Modifier.applyEntity(
      newContentState,
      selectionState,
      entityKey
    );
    // Add newContentState to the existing editorState, for a new editorState
    const newEditorState = EditorState.push(
      incomingEditorState,
      newContentState,
      EDITOR_CHANGE_TYPE['apply-entity']
    );
    // to handle read-only for word alignment creation
    if (type === ENTITY_TYPE.TEMP) {
      setReadOnlyEditorState(newEditorState);
    }
    setEditorState(newEditorState);
    return {
      entityKey,
      updatedEditorState: newEditorState,
    };
  };

  const removeEntitiesAtSelection = (incomingEditorState: EditorState, selectionState?: SelectionState): EditorState => {
    const contentState = incomingEditorState.getCurrentContent();
    if (!selectionState) {
      selectionState = incomingEditorState.getSelection();
    }
    //Unlink Entity
    const newContentState = Modifier.applyEntity(contentState, selectionState, null);
    const noUndoEditorState = EditorState.set(incomingEditorState, { allowUndo: false });
    const updatedEditorState = EditorState.push(noUndoEditorState, newContentState, EDITOR_CHANGE_TYPE['apply-entity']);
    const undoableEditorState = EditorState.set(updatedEditorState, { allowUndo: true });
    setReadOnlyEditorState(undefined);
    return undoableEditorState;
  };

  const displayInvalidTimeMessage = () => displayMessage(translate('editor.validation.invalidTimeRange'));

  /**
   * builds the callback to update the block's stored segment with the new segment
   */
  const buildUpdateSegmentCallback = (targetBlock: BlockObject<SegmentBlockData>, incomingEditorState: EditorState) => {
    const onUpdateSegmentResponse = (updatedSegment: Segment) => {
      const blockKey = targetBlock.key;
      const blockSegment = targetBlock.data.segment as Segment;
      // get the index using the old segment id
      const blockSegmentIndex = getIndexOfSegmentId(blockSegment.id);
      if (typeof blockSegmentIndex !== 'number') {
        log({
          file: `Editor.tsx`,
          caller: `onUpdateSegmentResponse`,
          value: 'Failed to get index of segment to update',
          important: true,
        });
        return;
      }
      const contentState = incomingEditorState.getCurrentContent();
      const updatedContentState = updateBlockSegmentData(contentState, blockKey, updatedSegment);

      const noUndoEditorState = EditorState.set(incomingEditorState, { allowUndo: false });
      const updatedContentEditorState = EditorState.push(noUndoEditorState, updatedContentState, EDITOR_CHANGE_TYPE['change-block-data']);
      const allowUndoEditorState = EditorState.set(updatedContentEditorState, { allowUndo: true });
      setEditorState(allowUndoEditorState);

      // to account for the previous blocks and keys changing after success
      const cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(allowUndoEditorState);
      setPreviousSelectionState(allowUndoEditorState.getSelection());
      setPreviousSelectedCursorContent(cursorContent);
    };
    return onUpdateSegmentResponse;
  };

  /**
   * builds the callback to update the manually merged block with the updated segment Id response
   */
  const buildMergeSegmentCallback = (targetBlock: BlockObject<SegmentBlockData>, incomingEditorState: EditorState) => {
    const onMergeSegmentResponse = (updatedSegment: Segment) => {
      const blockKey = targetBlock.key;
      const blockSegment = targetBlock.data.segment as Segment;
      // get the index using the old segment id
      const blockSegmentIndex = getIndexOfSegmentId(blockSegment.id);
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

      // to account for the previous blocks and keys changing after success
      const cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(allowUndoEditorState);
      setPreviousSelectionState(allowUndoEditorState.getSelection());
      setPreviousSelectedCursorContent(cursorContent);
    };
    return onMergeSegmentResponse;
  };

  /**
   * builds the callback to the manually split blocks with the updated segment Ids response
   */
  const buildSplitSegmentCallback = (targetBlock: BlockObject<SegmentBlockData>, newBlock: BlockObject<SegmentBlockData>, incomingEditorState: EditorState) => {
    const onSplitSegmentResponse = (updatedSegments: [Segment, Segment]) => {
      const [updatedSegment, newSegment] = updatedSegments;
      const blockKey = targetBlock.key;
      const newBlockKey = newBlock.key;
      const blockSegment = targetBlock.data.segment as Segment;
      // get the index using the old segment id
      const blockSegmentIndex = getIndexOfSegmentId(blockSegment.id);
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

      // to account for the previous blocks and keys changing after success
      const cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(allowUndoEditorState);
      setPreviousSelectionState(allowUndoEditorState.getSelection());
      setPreviousSelectedCursorContent(cursorContent);
    };
    return onSplitSegmentResponse;
  };

  const handleSegmentMergeCommand = (incomingEditorState: EditorState) => {
    const { isStartOfBlock, blockObject } = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
    const blockSegment = blockObject.data.segment;
    if (!blockSegment) {
      displayMessage(translate('editor.validation.invalidMergeLocation'));
      return;
    }
    const blockSegmentIndex = getIndexOfSegmentId(blockSegment.id);
    if (isStartOfBlock && !loading && typeof blockSegmentIndex === 'number') {
      const contentState = incomingEditorState.getCurrentContent();
      // get the block before this one
      const blockBefore = contentState.getBlockBefore(blockObject.key);

      // if we are already on the first block
      if (!blockBefore) {
        displayMessage(translate('editor.validation.invalidMergeLocation'));
        return;
      }

      const blockBeforeObject: BlockObject<SegmentBlockData> = blockBefore.toJS();
      const blockBeforeSegment = blockBeforeObject.data.segment;
      if (!blockBeforeSegment) {
        displayMessage(translate('editor.validation.invalidMergeLocation'));
        return;
      }
      const blockBeforeSegmentIndex = getIndexOfSegmentId(blockBeforeSegment.id);
      // handle the split
      if (typeof blockSegmentIndex === 'number' && typeof blockBeforeSegmentIndex === 'number') {
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

        // update with new content and remove undo stack
        const updatedEditorState = EditorState.createWithContent(contentStateAfterRemove, generateDecorators());
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
        return;
      }
    }
    displayMessage(translate('editor.validation.invalidMergeLocation'));
    return;
  };

  const createWordTime = (incomingEditorState: EditorState) => {
    if (!focussed && editorStateBeforeBlur) {
      incomingEditorState = editorStateBeforeBlur;
    }
    const cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
    const {
      blockObject,
      isNoSelection,
      entity,
      blockEntityRanges,
      cursorOffset,
      selectionCharacterDetails,
    } = cursorContent;
    if (isNoSelection && !entity) {
      displayMessage(translate('editor.validation.noSelection'));
      return;
    }
    if (isNoSelection && entity) {
      const { data } = entity;
      const { segment } = blockObject.data;
      if (!segment) {
        return;
      }
      const color = getRandomColor();
      const time: Time = {
        start: segment.start + data.wordAlignment.start,
        end: segment.start + data.wordAlignment.start + data.wordAlignment.length,
      };
      const wordToCreateTimeFor: Word = {
        color,
        text: data.wordAlignment.word.replace('|', ''),
        time,
      };
      const blockSegmentId = blockObject.data?.segment?.id;
      const segmentIndex = getIndexOfSegmentId(blockSegmentId as string);
      if (typeof segmentIndex === 'number') {
        const wordPickerOptions: WordPickerOptions = {
          word: wordToCreateTimeFor,
          segmentIndex,
          isWordUpdate: true,
        };
        setWordTimePickerOptions(wordPickerOptions);
        setReadOnlyEditorState(incomingEditorState);
      }
      return;
    }
    // if same block with non-entity selection
    if (!isNoSelection && !entity) {
      // to ensure our selection doesn't include any entities or invalid characters
      const noEntityWhithinSelection = selectionCharacterDetails.every((characterDetail) => {
        const noEntity = !characterDetail.properties?.entity;
        const validCharacter = !SPLITTABLE_CHARACTERS.includes(characterDetail.character);
        if (!validCharacter) {
          displayMessage(translate('editor.validation.invalidCharacterRange'));
        }
        return noEntity && validCharacter;
      });
      if (noEntityWhithinSelection) {
        const draftEntity: RawDraftEntity = {
          type: ENTITY_TYPE.TEMP,
          mutability: MUTABILITY_TYPE.MUTABLE,
          data: {}
        };
        const blockSegmentId = blockObject.data?.segment?.id;
        const segmentIndex = getIndexOfSegmentId(blockSegmentId as string);
        if (typeof segmentIndex === 'number') {
          //!
          //TODO
          // UTILIZE A SAFER WAY TO GET THIS TEXT
          const text = window?.getSelection()?.toString() || '';
          const color = getRandomColor();
          const wordToCreateTimeFor: Word = {
            color,
            text,
          };
          // find the next entity after the selection
          // will be used to determine where to insert the new wordAlignment
          let entityKeyAfterCursor: number | undefined;
          for (let i = 0; i < blockEntityRanges.length; i++) {
            const blockEntityRange = blockEntityRanges[i];
            const { offset, key } = blockEntityRange;
            if (offset > cursorOffset) {
              entityKeyAfterCursor = key;
              break;
            }
          }
          const wordPickerOptions: WordPickerOptions = {
            word: wordToCreateTimeFor,
            segmentIndex,
            entityKeyAfterCursor,
          };
          setWordTimePickerOptions(wordPickerOptions);
          setEntityAtSelection(draftEntity, incomingEditorState);
        }
        return;
      }
    }
  };

  const prepareSegmentTimePicker = (incomingEditorState: EditorState) => {
    if (!focussed && editorStateBeforeBlur) {
      incomingEditorState = editorStateBeforeBlur;
    }
    const cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);

    const { segment } = cursorContent.blockObject.data;
    if (segment) {
      const start = segment.start;
      const end = start + segment.length;
      const color = getRandomColor();
      const time: Time = {
        start,
        end,
      };
      const segmentWord: Word = {
        color,
        time,
        text: '',
      };
      const segmentPickerOptions: SegmentPickerOptions = {
        segmentWord,
        segment,
        cursorContent,
      };
      setSegmentPickerOptions(segmentPickerOptions);
      setReadOnlyEditorState(incomingEditorState);
    }
  };

  const prepareSegmentForSplit = (cursorContent: CursorContent<WordAlignmentEntityData, SegmentBlockData>, incomingEditorState: EditorState, splitByTime?: { time: number; wordStringSplitIndex: number; }) => {
    const {
      entity,
      characterDetailsBeforeCursor,
      cursorOffset,
      blockObject,
    } = cursorContent;
    let validEntity = entity;
    // to keep track of how far we had to travel and how many 
    // characters to erase if we need to find a valid entity
    let dinstanceFromCursor = 0;
    // no entity at cursor - we must find the nearest entity
    if (!validEntity) {
      // ensure that we are at a valid split point
      const characterAtCursor = blockObject.text[cursorOffset];
      if (!SPLITTABLE_CHARACTERS.includes(characterAtCursor)) {
        displayMessage(translate('editor.validation.invalidSplitLocation'));
        return;
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
        displayMessage(translate('editor.validation.invalidSplitLocation'));
        return;
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
        return;
      }
      const blockSegmentIndex = getIndexOfSegmentId(blockSegment.id);
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
        // reset the undo stack
        const editorStateAfterSplit = EditorState.createWithContent(splitContentState, generateDecorators());
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
        const splitCallback = buildSplitSegmentCallback(blockObject, newBlockObject, editorStateWithCursorMoved);
        // update the word id bank and segment id array
        insertSegmentIdAtIndex(segmentIndex, wordIndex, blockSegment.id);
        if (splitByTime?.time && splitByTime?.wordStringSplitIndex) {
          splitSegmentByTime(blockSegment.id, segmentIndex, splitByTime.time, splitByTime.wordStringSplitIndex, splitCallback);
        } else {
          splitSegment(blockSegment.id, segmentIndex, wordIndex, splitCallback);
        }
        return;
      }
    }
  };

  const openSegmentSplitTimePicker = (incomingSegmentSplitOptions: SegmentSplitOptions, incomingEditorState: EditorState) => {
    setSegmentSplitOptions(incomingSegmentSplitOptions);
    setReadOnlyEditorState(incomingEditorState);
  };

  const closeSegmentSplitTimePicker = () => {
    setReadOnlyEditorState(undefined);
    setSegmentSplitOptions(undefined);
  };

  /** handle a successfully selected split time */
  const splitSegmentPickerSuccess = (time: number) => {
    if (!segmentSplitOptions) {
      return;
    }
    const { cursorContent, segmentIndex } = segmentSplitOptions;
    const segment = segments[segmentIndex];
    const { start, length } = segment;
    const end = start + length;
    const adjustedTime = time - start;
    if (adjustedTime > 0 && time > start && time < end) {
      const segmentSplitInfo = {
        time: adjustedTime,
        wordStringSplitIndex: cursorContent.cursorOffset,
      };
      prepareSegmentForSplit(cursorContent, editorState, segmentSplitInfo);
      closeSegmentSplitTimePicker();
    }
  };

  const togglePopups = () => {
    setShowEditorPopups(!showEditorPopups);
  };

  const handleKeyCommand = (command: string, incomingEditorState: EditorState, eventTimeStamp: number): DraftHandleValue => {
    if (readOnlyEditorState) {
      return HANDLE_VALUES.handled;
    }
    let cursorContent: CursorContent<WordAlignmentEntityData, SegmentBlockData> | undefined;
    switch (command) {
      case KEY_COMMANDS['toggle-popups']:
        togglePopups();
        break;
      case KEY_COMMANDS.delete:
      case KEY_COMMANDS['delete-word']:
        cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
        // don't allow if at end
        if (cursorContent?.isEndOfBlock) {
          return HANDLE_VALUES.handled;
        }
        break;
      case KEY_COMMANDS.backspace:
        cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
        if (cursorContent?.isStartOfBlock && cursorContent?.isNoSelection) {
          return HANDLE_VALUES.handled;
        }
        break;
      case KEY_COMMANDS['backspace-word']:
      case KEY_COMMANDS['backspace-to-start-of-line']:
        cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
        if (cursorContent?.isStartOfBlock) {
          return HANDLE_VALUES.handled;
        }
        break;
      case KEY_COMMANDS['merge-segments-back']:
        handleSegmentMergeCommand(incomingEditorState);
        return HANDLE_VALUES.handled;
      case KEY_COMMANDS['edit-segment-time']:
        prepareSegmentTimePicker(incomingEditorState);
        return HANDLE_VALUES.handled;
      default:
        break;
    }
    RichUtils.handleKeyCommand(incomingEditorState, command);
    return HANDLE_VALUES['not-handled'];
  };

  /** updates the word alignment data once selected segment / blocks have changed 
   * @returns if we should update the editor state
   */
  const updateSegmentOnChange = (incomingEditorState: EditorState, cursorContent?: CursorContent<WordAlignmentEntityData, SegmentBlockData>, forceUpdate = false): boolean => {
    if (!previousSelectedCursorContent || !previousSelectionState) {
      return false;
    }
    if (!cursorContent) {
      cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
    }
    const {
      blockObject,
    } = cursorContent;
    const blockToCompare = { ...previousSelectedCursorContent.blockObject };
    // check if no longer on previous block
    if (forceUpdate || (blockToCompare && (blockToCompare.key !== blockObject.key))) {
      // get the current state of the previous block
      const contentState = incomingEditorState.getCurrentContent();
      const currentStateOfPreviousBlockObjectAndBlock = getBlockInfoForBlockKey<SegmentBlockData>(blockToCompare.key, contentState);
      const currentStateOfPreviousBlockObject = currentStateOfPreviousBlockObjectAndBlock.blockObject;
      const currentEntityRangesOfPreviousBlock = currentStateOfPreviousBlockObjectAndBlock.entityRanges;
      const differentNumberOfValidWords = currentStateOfPreviousBlockObject.data.segment?.wordAlignments.length !== currentEntityRangesOfPreviousBlock.length;
      // check for changes between previous state of the prev block and current state of prev block
      if (forceUpdate || JSON.stringify(blockToCompare.characterList) !== JSON.stringify(currentStateOfPreviousBlockObject.characterList) ||
        differentNumberOfValidWords) {
        // ensure all characters are within an entity
        const allWordsHaveEntity = currentStateOfPreviousBlockObject.characterList.every((characterProperties, index) => {
          if (characterProperties.entity) {
            return true;
          }
          const character = currentStateOfPreviousBlockObject.text[index];
          return SPLITTABLE_CHARACTERS.includes(character);
        });
        // to squash all the content into one large word alignment
        if (!allWordsHaveEntity) {
          const { segment } = currentStateOfPreviousBlockObject.data;
          if (segment?.id) {
            const segmentIndex = getIndexOfSegmentId(segment.id) as number;
            const originalSelectionState = editorState.getSelection();
            const filteredText = currentStateOfPreviousBlockObject.text.replace(SPLIT_CHARACTER_REGEX, '').trim();
            const blockSelectionState = new SelectionState({
              anchorKey: currentStateOfPreviousBlockObject.key,
              anchorOffset: 0,
              focusKey: currentStateOfPreviousBlockObject.key,
              focusOffset: currentStateOfPreviousBlockObject.characterList.length,
            });
            const removedEntitiesEditorState = removeEntitiesAtSelection(incomingEditorState, blockSelectionState);
            const replacedTextContentState = Modifier.replaceText(removedEntitiesEditorState.getCurrentContent(), blockSelectionState, filteredText);
            const replacedTextEditorState = EditorState.createWithContent(replacedTextContentState, generateDecorators());
            const updatedRawContent = convertToRaw(replacedTextEditorState.getCurrentContent());
            const newBlock = updatedRawContent.blocks[segmentIndex];
            const updatedBlockSelectionState = new SelectionState({
              anchorKey: newBlock.key,
              anchorOffset: 0,
              focusKey: newBlock.key,
              focusOffset: newBlock.text.length,
            });
            const replacedTextEditorStateWithSelection = EditorState.forceSelection(replacedTextEditorState, updatedBlockSelectionState);
            const wordAlignment: WordAlignment = {
              confidence: 1,
              length: segment.length,
              start: 0,
              word: filteredText,
            };
            const newWordKey = wordKeyBank.generateKeyAndClearSegment(segmentIndex);
            // create the new word entity
            const draftEntity: RawDraftEntity<WordAlignmentEntityData> = {
              type: ENTITY_TYPE.TOKEN,
              mutability: MUTABILITY_TYPE.MUTABLE,
              data: {
                wordKey: newWordKey,
                wordAlignment,
              },
            };
            // save the word entity
            const { entityKey, updatedEditorState } = setEntityAtSelection(draftEntity, replacedTextEditorStateWithSelection);
            let entityKeyNumber = Number(entityKey);
            // we must decrement the values because we are adjusting the origially incorrect values
            entityKeyNumber--;
            const adjustedEntityKey = entityKeyNumber.toString();
            // store all info
            linkEntityKeyAndWordKey(entityKeyNumber, newWordKey);
            setEntityByKey(adjustedEntityKey, draftEntity);
            const editorStateWithCursorMoved = EditorState.forceSelection(updatedEditorState, originalSelectionState);
            const updatedContentState = editorStateWithCursorMoved.getCurrentContent();
            const editorStateWithNoUndo = EditorState.createWithContent(updatedContentState, generateDecorators());
            setEditorState(editorStateWithNoUndo);
            const updateCallback = buildUpdateSegmentCallback(currentStateOfPreviousBlockObject, editorStateWithNoUndo);
            updateSegment(segment.id, [wordAlignment], wordAlignment.word, segmentIndex, updateCallback);
            return false;
          }
        }
        // build request and submit change
        const { segment } = currentStateOfPreviousBlockObject.data;
        if (segment?.id) {
          const { text } = currentStateOfPreviousBlockObject;
          const entityRangeByEntityKey: EntityRangeByEntityKey = {};
          const entityKeysInBlock: string[] = [];
          // get the entities in the block
          currentEntityRangesOfPreviousBlock.forEach(entityRange => {
            entityKeysInBlock.push(entityRange.key.toString());
            entityRangeByEntityKey[entityRange.key] = entityRange;
          });
          // update the text of each word alignment and push to the list
          const wordAlignments: WordAlignment[] = [];
          let wordContentHasChanged = false;
          entityKeysInBlock.forEach((entityKey) => {
            const entity = getEntityByKey(entityKey);
            const { wordAlignment } = entity.data;
            const entityRange = entityRangeByEntityKey[entityKey];
            if (wordAlignment && entityRange) {
              const { word } = wordAlignment;
              const { offset, length } = entityRange;
              const endTextIndex = offset + length;
              let entityText = text.slice(offset, endTextIndex);
              const wordHasPipe = word[0] === '|';
              // the original content might still contain the pipes
              const filteredWordText = word.replace('|', '');
              if (!wordContentHasChanged && filteredWordText !== entityText) {
                wordContentHasChanged = true;
              }
              // to replace the pipe because the backend will not regenerate this data
              if (wordHasPipe) {
                entityText = `|${entityText}`;
              }
              wordAlignment.word = entityText;
              wordAlignments.push(wordAlignment);
            }
          });
          // submit if passed all checks
          if (wordAlignments.length &&
            (forceUpdate || wordContentHasChanged || differentNumberOfValidWords || newWordWasCreated)) {
            newWordWasCreated = false;
            const editorStateWithNoUndo = EditorState.createWithContent(contentState, generateDecorators());
            setEditorState(editorStateWithNoUndo);
            const segmentIndex = getIndexOfSegmentId(segment.id) as number;
            const updateCallback = buildUpdateSegmentCallback(currentStateOfPreviousBlockObject, editorStateWithNoUndo);
            updateSegment(segment.id, wordAlignments, text, segmentIndex, updateCallback);
            return false;
          }
        }
      }
      // update since block focus changed
      setPreviousSelectedCursorContent(cursorContent);
      return true;
    }
    return true;
  };

  const closeWordTimePicker = () => {
    // remove the temp entity
    const removedEntityEditorState = removeEntitiesAtSelection(readOnlyEditorState || editorState);
    setEditorState(removedEntityEditorState);
    setWordTimePickerOptions(undefined);
    onWordTimeCreationClose();
  };

  const closeSegmentTimePicker = () => {
    if (readOnlyEditorState) {
      setEditorState(readOnlyEditorState);
    } else {
      setEditorState(cloneEditorState(editorState));
    }
    setSegmentPickerOptions(undefined);
    setReadOnlyEditorState(undefined);
    onWordTimeCreationClose();
  };

  const handleSegmentTimeUpdate = (segmentWord: Word, segment: Segment) => {
    const segmentIndex = getIndexOfSegmentId(segment.id);
    const { time } = segmentWord;
    if (segmentPickerOptions &&
      typeof segmentIndex === 'number' &&
      typeof time?.start === 'number' &&
      typeof time?.end === 'number') {
      let { start, end } = time;
      // set to 2 sig figs
      start = Number(start.toFixed(2));
      end = Number(end.toFixed(2));
      const length = end - start;
      const { cursorContent } = segmentPickerOptions;
      const updateSegmentCallback = buildUpdateSegmentCallback(cursorContent.blockObject, editorState);
      updateSegmentTime(segment.id, segmentIndex, start, length, updateSegmentCallback);
      closeSegmentTimePicker();
    }
  };

  const handleWordTimeCreation = (wordToCreate: Word, segment: Segment) => {
    // create the word alignment
    const { text, time } = wordToCreate;
    let { start, end } = time as Time;
    if (!wordTimePickerOptions || typeof start !== 'number' || typeof end !== 'number') {
      return;
    }
    // set to 2 sig figs
    start = Number(start.toFixed(2));
    end = Number(end.toFixed(2));
    const startTime = getWithinSegmentTimes(start, segment);
    let length = end - start;
    length = Number(length.toFixed(2));
    const newWordAlignment: WordAlignment = {
      word: text,
      start: startTime,
      length,
      confidence: 1, // max confidence for user created words
    };
    // figure out word alignment location within the segment
    const { entityKeyAfterCursor, segmentIndex } = wordTimePickerOptions;
    let newWordKey: number | undefined;
    // to handle if there were no entities after our selection
    // it will be appended to the end
    if (typeof entityKeyAfterCursor !== 'number') {
      newWordKey = wordKeyBank.generateKeyForEndOfSegment(segmentIndex);
    } else {
      const followingWordKey = getWordKeyFromEntityKey(entityKeyAfterCursor);
      const followingEntityLocation = wordKeyBank.getLocation(followingWordKey);
      newWordKey = wordKeyBank.generateKey(followingEntityLocation, true);
    }
    if (newWordKey === undefined) {
      return;
    }
    // remove the old entity
    const removedEntityEditorState = removeEntitiesAtSelection(readOnlyEditorState || editorState);
    // create the new word entity
    const draftEntity: RawDraftEntity<WordAlignmentEntityData> = {
      type: ENTITY_TYPE.TOKEN,
      mutability: MUTABILITY_TYPE.MUTABLE,
      data: {
        wordKey: newWordKey,
        wordAlignment: newWordAlignment,
      }
    };
    // save the word entity
    const { entityKey, updatedEditorState } = setEntityAtSelection(draftEntity, removedEntityEditorState);
    let entityKeyNumber = Number(entityKey);
    // we must decrement the values because we are adjusting the origially incorrect values
    entityKeyNumber--;
    const adjustedEntityKey = entityKeyNumber.toString();
    // store all info
    linkEntityKeyAndWordKey(entityKeyNumber, newWordKey);
    setEntityByKey(adjustedEntityKey, draftEntity);
    let editorStateToUse = updatedEditorState;
    // update the wordAlignment times if was in between other words
    if (typeof entityKeyAfterCursor === 'number') {
      const newWordLocation = wordKeyBank.getLocation(newWordKey);
      const [newSegmentIndex, newWordIndex] = newWordLocation;
      let contentState = editorStateToUse.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      const currentBlock = rawContent.blocks[newSegmentIndex];
      const numberOfWords = currentBlock.entityRanges.length;
      let currentLength = 0;
      // to calculate the length up to the new word
      for (let i = 0; i <= newWordIndex; i++) {
        const entityKey = currentBlock.entityRanges[i].key;
        const entityKeyString = entityKey.toString();
        const currentEntity = contentState.getEntity(entityKeyString);
        const currentData: WordAlignmentEntityData = currentEntity.getData();
        currentLength += currentData.wordAlignment.length;
      }
      for (let i = newWordIndex + 1; i < numberOfWords; i++) {
        const entityKey = currentBlock.entityRanges[i].key;
        const entityKeyString = entityKey.toString();
        const currentEntity = contentState.getEntity(entityKeyString);
        const currentData: WordAlignmentEntityData = currentEntity.getData();
        // only adjust the time if it is overlapping
        if (currentData.wordAlignment.start < currentLength) {
          currentLength += currentData.wordAlignment.length;
          const newStart = currentData.wordAlignment.start + length;
          const newWordAlignment = { ...currentData.wordAlignment, start: newStart };
          const updatedData = { ...currentData, wordAlignment: newWordAlignment };
          contentState = contentState.replaceEntityData(entityKeyString, { ...updatedData });
        }
      }
      editorStateToUse = EditorState.createWithContent(contentState);
    }
    newWordWasCreated = true;
    closeWordTimePicker();
    const cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(editorStateToUse);
    const canUpdate = updateSegmentOnChange(editorStateToUse, cursorContent, true);
    if (!loading && canUpdate) {
      // update location 
      setPreviousSelectionState(editorStateToUse.getSelection());
      setEditorState(editorStateToUse);
    }
  };

  const handleChange = (incomingEditorState: EditorState) => {
    if (readOnlyEditorState) {
      return;
    }
    let canUpdate = true;
    const cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
    if (loading || !previousSelectedCursorContent || !previousSelectionState) {
      setPreviousSelectedCursorContent(cursorContent);
      setPreviousSelectionState(incomingEditorState.getSelection());
    } else if (previousSelectedCursorContent && previousSelectionState) {
      canUpdate = updateSegmentOnChange(incomingEditorState, cursorContent);
    }
    if (!loading && canUpdate) {
      // update location since we are still in same block
      setPreviousSelectionState(incomingEditorState.getSelection());
      setEditorStateBeforeBlur(cloneEditorState(incomingEditorState));
      setEditorState(incomingEditorState);
    }
  };

  /**
   * determines if we are in a valid split location and calls the split methods if we are
   */
  const handleSegmentSplitCommand = (incomingEditorState: EditorState) => {
    const cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
    const {
      blockObject,
      isEndOfBlock,
      isStartOfBlock,
      characterDetailsBeforeCursor,
      characterDetailsAtCursor,
    } = cursorContent;
    // check if we are at a valid location for splitting segments
    if (isEndOfBlock || isStartOfBlock) {
      displayMessage(translate('editor.validation.invalidSplitLocation'));
      return;
    }
    const beforeEntityId = characterDetailsBeforeCursor.properties?.entity;
    const afterEntityId = characterDetailsAtCursor.properties?.entity;
    const isWithinSameEntity = (beforeEntityId && afterEntityId) && (beforeEntityId === afterEntityId);
    // open segment time selector
    if (isWithinSameEntity) {
      if (blockObject.data?.segment && blockObject.data.segment?.wordAlignments?.length < 2) {
        const splitSegmentIndex = getIndexOfSegmentId(blockObject.data.segment.id);
        if (typeof splitSegmentIndex === 'number') {
          const splitOptions = {
            segmentIndex: splitSegmentIndex,
            cursorContent,
          };
          openSegmentSplitTimePicker(splitOptions, incomingEditorState);
        }
      } else {
        displayMessage(translate('editor.validation.invalidSplitLocation'));
      }
      return;
    }
    prepareSegmentForSplit(cursorContent, incomingEditorState);
  };

  /** calls the split command if the editor is in a valid state */
  const handleReturnPress = (event: React.KeyboardEvent, incomingEditorState: EditorState): DraftHandleValue => {
    if (readOnlyEditorState) {
      return HANDLE_VALUES.handled;
    }
    // only split when holding shift
    if (event.shiftKey && !loading) {
      handleSegmentSplitCommand(incomingEditorState);
    }
    return HANDLE_VALUES.handled;
  };

  const handleFocus = () => {
    setFocussed(true);
  };

  /** saves a copy of the editor state that can be used if 
   * the user triggers commands while the editor is not focussed
   * @example if the user clicks an editor command button
   */
  const handleBlur = () => {
    if (focussed) {
      setFocussed(false);
      setEditorStateBeforeBlur(cloneEditorState(editorState));
    }
  };

  /**
   * navigate to the correct timestamp if there is an entity at the cursor
   */
  const handleClickInsideEditor = () => {
    if (readOnlyEditorState || readOnly) {
      return;
    }
    const { isNoSelection, entity } = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(editorState);
    if (isNoSelection && typeof entity?.data?.wordKey === 'number') {
      const segmentAndWordIndex = wordKeyBank.getLocation(entity.data.wordKey);
      onWordClick(segmentAndWordIndex);
    }
  };

  // handle any api requests made by the parent
  // used for updating after the speaker has been set
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

  // used to call commands from the control bar's button presses
  React.useEffect(() => {
    if (editorCommand) {
      onCommandHandled();
      if (readOnlyEditorState || readOnly) {
        return;
      }
      let updatedEditorState: EditorState | null = null;
      switch (editorCommand) {
        case EDITOR_CONTROLS.save:
          updateSegmentOnChange(editorState, undefined, true);
          break;
        case EDITOR_CONTROLS.toggleMore:
          togglePopups();
          break;
        case EDITOR_CONTROLS.split:
          handleSegmentSplitCommand(editorState);
          break;
        case EDITOR_CONTROLS.merge:
          handleSegmentMergeCommand(editorState);
          break;
        case EDITOR_CONTROLS.createWord:
          createWordTime(editorState);
          break;
        case EDITOR_CONTROLS.editSegmentTime:
          prepareSegmentTimePicker(editorState);
          break;
        case EDITOR_CONTROLS.undo: ;
          updatedEditorState = EditorState.undo(editorState);
          break;
        case EDITOR_CONTROLS.redo:
          updatedEditorState = EditorState.redo(editorState);
          break;
        default:
          break;
      }
      if (updatedEditorState) {
        handleChange(updatedEditorState);
      }
    }
  }, [editorCommand]);

  // used to calculate the exact dimensions of the root div
  // so we can make the overlay the exact same size
  React.useEffect(() => {
    if (containerRef.current) {
      const { offsetHeight, offsetWidth, offsetLeft, offsetTop } = containerRef.current;
      const overlayPositionStyle: React.CSSProperties = {
        top: offsetTop,
        left: offsetLeft,
        width: offsetWidth,
        height: offsetHeight,
      };
      setOverlayStyle(overlayPositionStyle);
      setEditorContentHeight(offsetHeight);
    }
  }, [containerRef, windowWidth]);

  // reset everything on dismount
  React.useEffect(() => {
    return () => {
      wordKeyBank = new WordKeyStore();
      entityMap = {};
      entityKeyToWordKeyMap = {};
      wordKeyToEntityKeyMap = {};
      blockKeyToSegmentIdMap = {};
      segmentIdToBlockKeyMap = {};
      segmentOrderById = [];
      newWordWasCreated = false;
      onReady(false);
    };
  }, []);

  // update the playing location
  React.useEffect(() => {
    if (playingLocation && ready) {
      const wordKey = wordKeyBank.getKey(playingLocation);
      if (typeof wordKey !== 'number') {
        return;
      }
      const entityKey = getEntityKeyFromWordKey(wordKey);
      if (typeof entityKey === 'number' && entityKey !== prevPlayingEntityKey) {
        setPlayingWordKey(wordKeyBank.getKey(playingLocation));
      }
    }
  }, [playingLocation, ready]);

  React.useEffect(() => {
    generateStateFromSegments();
    focusEditor();
  }, []);

  // handle editor state changes
  React.useEffect(() => {
    onEditorStateUpdate(editorState);
  }, [editorState]);

  return (
    <div
      id={'scroll-container'}
      ref={containerRef}
      onClick={handleClickInsideEditor}
      style={{
        height,
        overflowY: 'auto',
      }}
    >
      <Backdrop
        className={classes.backdrop}
        style={overlayStyle}
        open={!!readOnlyEditorState}
        onClick={() => {
          return undefined;
        }}
      >
        <Draggable
          axis="both"
          defaultPosition={{ x: 0, y: 0 }}
          position={undefined}
          bounds={'parent'}
          offsetParent={containerRef.current ?? undefined}
          scale={1}
        >
          <Card className={clsx(classes.draggable, 'box')}>
            {wordTimePickerOptions && <WordTimePicker
              segments={segments}
              segmentIndex={wordTimePickerOptions.segmentIndex}
              wordToCreateTimeFor={wordTimePickerOptions.word}
              onClose={closeWordTimePicker}
              onSuccess={handleWordTimeCreation}
              onInvalidTime={displayInvalidTimeMessage}
              {...timePickerRootProps}
            />}
            {segmentPickerOptions &&
              <SegmentTimePicker
                segment={segmentPickerOptions.segment}
                segmentToCreateTimeFor={segmentPickerOptions.segmentWord}
                onClose={closeSegmentTimePicker}
                onSuccess={handleSegmentTimeUpdate}
                onInvalidTime={displayInvalidTimeMessage}
                {...timePickerRootProps}
              />}
            {segmentSplitOptions &&
              <SegmentSplitPicker
                segments={segments}
                segmentIndex={segmentSplitOptions.segmentIndex}
                onClose={closeSegmentSplitTimePicker}
                onSuccess={splitSegmentPickerSuccess}
                onInvalidTime={displayInvalidTimeMessage}
                {...splitTimePickerRootProps}
              />}
          </Card>
        </Draggable>
      </Backdrop>
      {ready &&
        <DraftEditor
          ref={editorRef}
          editorState={editorState}
          customStyleMap={styleMap}
          keyBindingFn={customKeyBindingFunction}
          blockRendererFn={customBlockRenderer}
          onChange={readOnly ? editorChangeNoop : handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          handleReturn={readOnly ? editorChangeNoop : handleReturnPress}
          handleKeyCommand={readOnly ? editorChangeNoop : handleKeyCommand}
          handlePastedText={editorChangeNoop}
        />
      }
    </div>
  );
};