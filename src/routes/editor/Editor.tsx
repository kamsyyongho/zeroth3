import { Backdrop } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
import { ContentBlock, ContentState, convertFromRaw, convertToRaw, DraftHandleValue, Editor as DraftEditor, EditorState, Modifier, RawDraftEntity, RawDraftEntityRange, RichUtils, SelectionState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { useSnackbar, VariantType } from 'notistack';
import Draggable from 'react-draggable';
import React, { useGlobal } from 'reactn';
import { SPLITTABLE_CHARACTERS, SPLIT_CHARACTER, SPLIT_CHARACTER_REGEX } from '../../constants';
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
import { SegmentBlockV2 } from './components/SegmentBlockV2';


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
  onSpeakersUpdate: (speakers: string[]) => void;
  onUpdateUndoRedoStack: (canUndo: boolean, canRedo: boolean) => void;
  loading?: boolean;
  segments: Segment[];
  playingLocation?: SegmentAndWordIndex;
  updateSegment: (segmentId: string, wordAlignments: WordAlignment[], transcript: string, segmentIndex: number, onSuccess: (segment: Segment) => void) => void;
  updateSegmentTime: (segmentId: string, segmentIndex: number, start: number, length: number, onSuccess: (segment: Segment) => void) => void;
  assignSpeaker: (segmentIndex: number) => void;
  removeHighRiskFromSegment: (segmentIndex: number, segmentId: string) => void;
  onWordClick: (wordLocation: number[]) => void;
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
    onSpeakersUpdate,
    onUpdateUndoRedoStack,
    loading,
    segments,
    playingLocation,
    updateSegment,
    updateSegmentTime,
    assignSpeaker,
    removeHighRiskFromSegment,
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
  const [editorFocussed, setEditorFocussed] = useGlobal('editorFocussed');
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

  /**
   * gets the segment location from the cursor location
   * - saves the current cursor selection so we can restore 
   * it after the dialog is closed
   */
  const assignSpeakerFromShortcut = (incomingEditorState: EditorState) => {
  };

  /**
   * used in the custom block to delete high-risk segment value
   */
  const removeHighRiskValueFromSegment = (segmentId: string) => {
  };

  const styleMap = React.useMemo(() => {
    return buildStyleMap(theme);
  }, []);

  /**
   * build new entity and key maps when Draft.js changes the enity key map
   * - Draft.js will sometimes reorder and rename 
   * the keys, so our maps will be out of sync
   */
  const rebuildEntityMapFromContentState = () => {
  };

  /** updates the undo/redo button status and rebuilds the entity map */
  const onEditorStateUpdate = () => {
  };

  /**
   * creates an entity and applies it to the current selection
   * @returns the newly created entity key
   */
  const setEntityAtSelection = () => {
  };

  const removeEntitiesAtSelection = () => {
  };

  const displayInvalidTimeMessage = () => displayMessage(translate('editor.validation.invalidTimeRange'));

  /**
   * builds the callback to update the block's stored segment with the new segment
   */
  const buildUpdateSegmentCallback = () => {
  };

  /**
   * builds the callback to update the manually merged block with the updated segment Id response
   */
  const buildMergeSegmentCallback = (targetBlock: BlockObject<SegmentBlockData>, incomingEditorState: EditorState) => {
    const onMergeSegmentResponse = (updatedSegment: Segment) => {
      const blockKey = targetBlock.key;
      const blockSegment = targetBlock.data.segment as Segment;
      // get the index using the old segment id
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

      const contentState = incomingEditorState.getCurrentContent();
      const updatedContentState = updateBlockSegmentData(contentState, blockKey, updatedSegment);

      const noUndoEditorState = EditorState.set(incomingEditorState, { allowUndo: false });
      const updatedContentEditorState = EditorState.push(noUndoEditorState, updatedContentState, EDITOR_CHANGE_TYPE['change-block-data']);
      const allowUndoEditorState = EditorState.set(updatedContentEditorState, { allowUndo: true });
      setEditorState(allowUndoEditorState);

      // to account for the previous blocks and keys changing after success
      setPreviousSelectionState(allowUndoEditorState.getSelection());
      setPreviousSelectedCursorContent(cursorContent);
    };
    return onMergeSegmentResponse;
  };

  /**
   * builds the callback to the manually split blocks with the updated segment Ids response
   */
  const buildSplitSegmentCallback = () => {

  };

  const handleSegmentMergeCommand = () => {
  };

  const createWordTime = () => {
  };

  const prepareSegmentTimePicker = () => {
  };

  const prepareSegmentForSplit = () => {
  };

  const openSegmentSplitTimePicker = () => {
  };

  const closeSegmentSplitTimePicker = () => {
  };

  /** handle a successfully selected split time */
  const splitSegmentPickerSuccess = () => {
  };

  const togglePopups = () => {
  };

  const handleClickInsideEditor = () => {

    // const segmentAndWordIndex = [segmentIndex, wordAlignmentIndex];
    //
    // onWordClick(segmentAndWordIndex);
  };

  const handleKeyCommand = (command: string, incomingEditorState: EditorState, eventTimeStamp: number): DraftHandleValue => {
    if (readOnlyEditorState) {
      return HANDLE_VALUES.handled;
    }
    let cursorContent: CursorContent<WordAlignmentEntityData, SegmentBlockData> | undefined;
    switch (command) {
      case KEY_COMMANDS['toggle-popups']:
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
  const updateSegmentOnChange = () => {
  };

  const closeWordTimePicker = () => {
  };

  const closeSegmentTimePicker = () => {
  };

  const handleSegmentTimeUpdate = () => {
    }
  };

  const handleWordTimeCreation = () => {
  };

  const handleChange = (incomingEditorState: EditorState) => {
    // if (readOnlyEditorState) {
    //   return;
    // }
    // let canUpdate = true;
    // const cursorContent = getCursorContent<WordAlignmentEntityData, SegmentBlockData>(incomingEditorState);
    // if (loading || !previousSelectedCursorContent || !previousSelectionState) {
    //   setPreviousSelectedCursorContent(cursorContent);
    //   setPreviousSelectionState(incomingEditorState.getSelection());
    // } else if (previousSelectedCursorContent && previousSelectionState) {
    //   canUpdate = updateSegmentOnChange(incomingEditorState, cursorContent);
    // }
    // if (!loading && canUpdate) {
    //   // update location since we are still in same block
    //   setPreviousSelectionState(incomingEditorState.getSelection());
    //   setEditorStateBeforeBlur(cloneEditorState(incomingEditorState));
    //   setEditorState(incomingEditorState);
    // }
  };

  /**
   * determines if we are in a valid split location and calls the split methods if we are
   */
  const handleSegmentSplitCommand = () => {
  };

  /** calls the split command if the editor is in a valid state */
  const handleReturnPress = () => {
  };

  const findWordAlignmentIndexToPrevSegment = () => {
  };

  const getLastAlignmentIndexInSegment = () => {
  };

  // handle any api requests made by the parent
  // used for updating after the speaker has been set
  React.useEffect(() => {
    if (responseFromParent && responseFromParent instanceof Object) {
      onParentResponseHandled();
      const { type, payload } = responseFromParent;
      const segment = payload?.segment;
      const currentContentState = editorState.getCurrentContent();
      let blockKey: string | undefined;
      let updatedContentState: ContentState | undefined;
      switch (type) {
        case PARENT_METHOD_TYPES.speaker:
        case PARENT_METHOD_TYPES.highRisk:
          if (!segment) break;
          blockKey = getBlockKeyFromSegmentId(segment.id);
          if (blockKey) {
            updatedContentState = updateBlockSegmentData(currentContentState, blockKey, segment);
          }
          break;
        case PARENT_METHOD_TYPES.speakerCancel:
          // refocus editor on speaker assign cancel
          if (previousSelectionState) {
            const updatedEditorState = EditorState.forceSelection(
              editorState,
              previousSelectionState,
            );
            setPreviousSelectionState(undefined);
            setEditorState(updatedEditorState);
            focusEditor();
          }
          break;
      }

      // set our updated state
      if (updatedContentState) {
        const noUndoEditorState = EditorState.set(editorState, { allowUndo: false });
        const updatedContentEditorState = EditorState.push(noUndoEditorState,
            updatedContentState, EDITOR_CHANGE_TYPE['change-block-data']);
        const allowUndoEditorState = EditorState.set(updatedContentEditorState, { allowUndo: true });
        let editorStateToUse = allowUndoEditorState;
        if (previousSelectionState) {
          editorStateToUse = EditorState.forceSelection(
            allowUndoEditorState,
            previousSelectionState,
          );
        }
        setPreviousSelectionState(undefined);
        setEditorState(editorStateToUse);
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
        case EDITOR_CONTROLS.speaker:
          assignSpeakerFromShortcut(editorState);
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

  // initial mount and unmount logic
  React.useEffect(() => {
    setReady(true);
    focusEditor();
    // reset everything on dismount;
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
      setEditorFocussed(false);
    };
  }, []);

  // keep track of focus to prevent the keypress listeners
  // from firing twice in the editor controls component
  React.useEffect(() => {
    setEditorFocussed(focussed);
  }, [focussed]);

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
        segments.map( (segment: Segment, index: number) => {
          return <SegmentBlockV2 key={`segment-block-${index}`}
                                 segment={segment}
                                 segmentIndex={index}
                                 assignSpeakerForSegment={assignSpeakerForSegment}
                                 // onChange={handleChange}
                                 readOnly={readOnly}
                                 findWordAlignmentIndexToPrevSegment={findWordAlignmentIndexToPrevSegment}
                                 getLastAlignmentIndexInSegment={getLastAlignmentIndexInSegment}
                                 removeHighRiskValueFromSegment={removeHighRiskValueFromSegment} />
        })
        }
    </div>
  );
};