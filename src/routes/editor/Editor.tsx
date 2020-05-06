import { Backdrop } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
import { DraftHandleValue, Editor as DraftEditor, EditorState,RichUtils, SelectionState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { useSnackbar, VariantType } from 'notistack';
import Draggable from 'react-draggable';
import React, { useGlobal } from 'reactn';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { useWindowSize } from '../../hooks/window/useWindowSize';
import { CustomTheme } from '../../theme/index';
import {
  BLOCK_TYPE,
  EntityMap,
  ENTITY_TYPE,
  HANDLE_VALUES,
  KEY_COMMANDS,
  MUTABILITY_TYPE,
  Segment,
  SegmentAndWordIndex,
  SNACKBAR_VARIANTS,
  WordAlignment } from '../../types';
import {
  BlockInfo,
  BlockKeyToSegmentId,
  BlockObject,
  CharacterDetails,
  CharacterProperties,
  CursorContent,
  EDITOR_CHANGE_TYPE,
  EntityKeyToWordKey,
  EntityRangeByEntityKey,
  REMOVAL_DIRECTION,
  SegmentBlockData,
  SegmentIdToBlockKey,
  Time,
  Word,
  WordAlignmentEntityData,
  WordKeyToEntityKey } from '../../types/editor.types';
import { SEGMENTS_STORE_KEY } from "../../common/constants";
import log from '../../util/log/logger';
import { getRandomColor } from '../../util/misc';
import { EDITOR_CONTROLS } from './components/EditorControls';
import { SegmentBlock, SegmentBlockSubProps } from './components/SegmentBlock';
import { SegmentSplitPicker } from './components/SegmentSplitPicker';
import { SegmentTimePicker } from './components/SegmentTimePicker';
import { WordTimePicker } from './components/WordTimePicker';
import { ParentMethodResponse, PARENT_METHOD_TYPES, SplitTimePickerRootProps, TimePickerRootProps } from './EditorPage';
import {
  buildStyleMap,
  cloneEditorState,
  customKeyBindingFunction,
  editorChangeNoop,
  generateDecorators,
  getWithinSegmentTimes,
  updateBlockSegmentData,
  WordKeyStore } from './helpers/editor.helper';
import './styles/editor.css';
import { SegmentBlockV2 } from './components/SegmentBlockV2';
import localForage from 'localforage';

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

  const getSegmentAndWordIndex = () => {
    const selectedBlock: any = window.getSelection();
    const selectedBlockId: string = selectedBlock.focusNode.parentElement?.id;


    if(!selectedBlockId) return;
    const segmentAndWordIndex = selectedBlockId.split('-');
    segmentAndWordIndex.shift();

    return segmentAndWordIndex.map(index => Number(index));
  };

  const updateCaretLocation = (segmentIndex: number, wordIndex: number) => {
    console.log('updateCaretLocation in editor after caret change : ',segmentIndex, wordIndex);

    onWordClick([segmentIndex, wordIndex]);
  };

  const updatePlayingLocation = () => {
    const playingBlock = document.getElementById(`word-${playingLocation[0]}-${playingLocation[1]}`);
    const selection = window.getSelection();
    const range = document.createRange();
    console.log('playingBlock in updatePlayingLocation : ',playingBlock);

    if(playingBlock) {
      range.selectNodeContents(playingBlock);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    // if(playingBlock) {
    //   playingBlock.focus();
    // }
  };

  const saveSegmentStateBeforeChange = (segmentIndex: number, wordIndex: number) => {
    const savedSegmentsState = localForage.getItem(SEGMENTS_STORE_KEY);
  };

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
    const segmentAndWordIndex = getSegmentAndWordIndex();
    if (segmentAndWordIndex) {
      assignSpeaker(segmentAndWordIndex[0]);
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
  const buildMergeSegmentCallback = () => {
  };

  /**
   * builds the callback to the manually split blocks with the updated segment Ids response
   */
  const buildSplitSegmentCallback = () => {

  };

  const handleSegmentMergeCommand = () => {
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
    setShowEditorPopups(!showEditorPopups);
  };

  const handleClickInsideEditor = () => {
    onWordClick(getSegmentAndWordIndex());
  };

  const handleKeyCommand = (command: string, incomingEditorState: EditorState, eventTimeStamp: number): DraftHandleValue => {
    if (readOnlyEditorState) {
      return HANDLE_VALUES.handled;
    }
    const cursorContent = getSegmentAndWordIndex() || [];
    switch (command) {
      case KEY_COMMANDS['toggle-popups']:
        break;
      case KEY_COMMANDS.delete:
      case KEY_COMMANDS['delete-word']:
        // don't allow if at end
        if (cursorContent[1] === segments[cursorContent[0]].length - 1) {
          return HANDLE_VALUES.handled;
        }
        break;
      case KEY_COMMANDS.backspace:
        if (cursorContent[1] === 0) {
          return HANDLE_VALUES.handled;
        }
        break;
      case KEY_COMMANDS['backspace-word']:
      case KEY_COMMANDS['backspace-to-start-of-line']:
        if (cursorContent[1] === 0) {
          return HANDLE_VALUES.handled;
        }
        break;
      case KEY_COMMANDS['merge-segments-back']:
        handleSegmentMergeCommand();
        return HANDLE_VALUES.handled;
      case KEY_COMMANDS['edit-segment-time']:
        // prepareSegmentTimePicker();
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
  };

  const handleWordTimeCreation = () => {
  };

  const updateChange = (segmentIndex: number, wordIndex: number, word: string) => {
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

  const findWordAlignmentIndexToPrevSegment = (segmentIndex: number, currentLocation: number) => {
    if(segmentIndex >= segments.length) {return;}
    const prevSegmentWordAlignments = segments[segmentIndex].wordAlignments;
    let wordCount = 0;

    for(let i = 0; i < prevSegmentWordAlignments.length + 1; i++) {
      if (wordCount < currentLocation) {
        if (i === prevSegmentWordAlignments.length) return prevSegmentWordAlignments.length - 1;

        const word = prevSegmentWordAlignments[i].word;
        wordCount += word.length;
      } else if (wordCount > currentLocation) {
        return i - 1;
      } else {
        return i;
      }
    }
  };

  const getLastAlignmentIndexInSegment = (segmentIndex: number) => {
    const lastWordAlignment = segments[segmentIndex]['wordAlignments'];

    return { index: lastWordAlignment.length - 1, word: lastWordAlignment[lastWordAlignment.length - 1].word };
  };

  // handle any api requests made by the parent
  // used for updating after the speaker has been set
  React.useEffect(() => {
    if (responseFromParent && responseFromParent instanceof Object) {
      onParentResponseHandled();
      const { type, payload } = responseFromParent;
      const segment = payload?.segment;
      switch (type) {
        case PARENT_METHOD_TYPES.speaker:
        case PARENT_METHOD_TYPES.highRisk:
          break;
        case PARENT_METHOD_TYPES.speakerCancel:
          break;
      }
    }
  }, [responseFromParent]);

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
  }, []);

  // keep track of focus to prevent the keypress listeners
  // from firing twice in the editor controls component
  React.useEffect(() => {
    setEditorFocussed(focussed);
  }, [focussed]);

  React.useEffect(() => {
    console.log('playingLocation : ', playingLocation);
    updatePlayingLocation();
  }, [playingLocation, ready]);

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
                                 updateCaretLocation={updateCaretLocation}
                                 updateChange={updateChange}
                                 findWordAlignmentIndexToPrevSegment={findWordAlignmentIndexToPrevSegment}
                                 getLastAlignmentIndexInSegment={getLastAlignmentIndexInSegment}
                                 removeHighRiskValueFromSegment={removeHighRiskValueFromSegment} />
        })
        }
    </div>
  );
};