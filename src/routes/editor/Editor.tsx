import {Backdrop, TextField, Typography, Grid, Button} from '@material-ui/core';
import Card from '@material-ui/core/Card';
import LaunchIcon from '@material-ui/icons/Launch';
import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
import clsx from 'clsx';
import 'draft-js/dist/Draft.css';
import {useSnackbar, VariantType} from 'notistack';
import Draggable from 'react-draggable';
import React, {useGlobal} from 'reactn';
import {I18nContext} from '../../hooks/i18n/I18nContext';
import { ApiContext } from '../../hooks/api/ApiContext';
import {useWindowSize} from '../../hooks/window/useWindowSize';
import {CustomTheme} from '../../theme/index';
import { useHistory } from 'react-router-dom';
import {CONTENT_STATUS, Segment, SegmentAndWordIndex, SNACKBAR_VARIANTS, WordAlignment, Time, VoiceData, SnackbarError, PATHS} from '../../types';
import { Word } from '../../types/editor.types';
import {DECODER_DIFF_CLASSNAME} from "../../constants";
import {EDITOR_CONTROLS} from './components/EditorControls';
import {SegmentSplitPicker} from './components/SegmentSplitPicker';
import {SegmentTimePicker} from './components/SegmentTimePicker';
import {WordTimePicker} from './components/WordTimePicker';
import {SplitTimePickerRootProps, TimePickerRootProps} from './EditorPage';
import './styles/editor.css';
import {MemoizedSegmentBlock} from './components/SegmentBlockV2';
import {MemoizedDecoderSegmentBlock} from './components/DecoderSegmentBlock';
import { getRandomColor } from '../../util/misc';
import { getSegmentAndWordIndex } from './helpers/editor-page.helper';
import log from '../../util/log/logger';
import { useSelector, useDispatch } from 'react-redux';

const AUDIO_PLAYER_HEIGHT = 384;
const DIFF_TITLE_HEIGHT = 77;
const COMMENT_HEIGHT = 40;
const EDITOR_MARGIN_TOP = 25;

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
    editor: theme.editor,
    diffEditor: theme.diffEditor,
    diffTextArea: {
      border: '2px solid #d8d8d8',
      overflowY: 'auto',
      alignItems: 'center',
      width: '50%',
    },
    diffTitle: {
      height: `${DIFF_TITLE_HEIGHT}px`
    },
    commentField: {
      height: '40px !important',
      width: '750px',
      borderColor: '#d8d8d8',
    },
    diffTitleContainer: {
      margin: '5px 30px 5px',
      flex: 4,
    },
    diffTitleText: {
      color: '#909090',
      fontSize: '20px',
      fontWeight: 500,
      padding: '0',
    },
    commentGridItem: {
      marginTop: '16px',
      marginBottom: '16px',
      marginLeft: '10px',
      maxWidth: '100%',
      overflow: 'hidden',
    },
    diffTitleButton: {
      flex: 2,
      marginRight: '30px',
    },
    button: {
      marginLeft: '10px',
    },
    buttonReject: {
      backgroundColor: '#c33636',
    },
  }),
);

interface WordPickerOptions {
  word: Word;
  segmentIndex: number;
  entityKeyAfterCursor?: number;
  isWordUpdate?: boolean;
}
export interface SegmentPickerOptions {
  segmentWord: Word;
  segment: Segment;
}

interface SegmentSplitOptions {
  segmentIndex: number;
}

interface EditorProps {
  height?: number;
  readOnly?: boolean;
  isDiff?: boolean;
  setIsDiff: (isDiff: boolean) => void;
  /** let the parent know that we've handled the request */
  editorCommand?: EDITOR_CONTROLS;
  /** let the parent know that we've handled the request */
  onCommandHandled: () => void;
  handleSegmentUpdate: (updatedSegment: Segment, segmentIndex: number) => void,
  onReady: (ready: boolean) => void;
  onWordTimeCreationClose: () => void;
  onSpeakersUpdate: (speakers: string[]) => void;
  onUpdateUndoRedoStack: (canUndo: boolean, canRedo: boolean) => void;
  isLoadingAdditionalSegment: boolean;
  loading?: boolean;
  setLoading: (isLoading: boolean) => void;
  isAudioPlaying: boolean;
  voiceData: VoiceData;
  playingLocation?: SegmentAndWordIndex;
  updateSegment: (segmentId: string, wordAlignments: WordAlignment[], transcript: string, segmentIndex: number) => void;
  updateSegmentTime: (segmentId: string, segmentIndex: number, start: number, length: number) => void;
  assignSpeaker: (segmentIndex: number) => void;
  removeHighRiskFromSegment: (segmentIndex: number, segmentId: string) => void;
  onWordClick: (wordLocation: SegmentAndWordIndex, onForce?: boolean) => void;
  splitSegmentByTime: (segmentId: string, segmentIndex: number, time: number, wordStringSplitIndex: number, onSuccess: (updatedSegments: [Segment, Segment]) => void, ) => Promise<void>;
  timePickerRootProps: TimePickerRootProps;
  splitTimePickerRootProps: SplitTimePickerRootProps;
  getNextSegment: () => void;
  getPrevSegment: () => void;
  projectId?: string;
}

export function Editor(props: EditorProps) {
  const {
    height,
    readOnly,
    isDiff,
    setIsDiff,
    editorCommand,
    onCommandHandled,
    onReady,
    onWordTimeCreationClose,
    onSpeakersUpdate,
    onUpdateUndoRedoStack,
    isLoadingAdditionalSegment,
    loading,
    setLoading,
    isAudioPlaying,
    voiceData,
    playingLocation,
    handleSegmentUpdate,
    updateSegment,
    updateSegmentTime,
    assignSpeaker,
    removeHighRiskFromSegment,
    onWordClick,
    splitSegmentByTime,
    timePickerRootProps,
    splitTimePickerRootProps,
    getNextSegment,
    getPrevSegment,
    projectId,
  } = props;
  const [showEditorPopups, setShowEditorPopups] = useGlobal('showEditorPopups');
  const [editorContentHeight, setEditorContentHeight] = useGlobal('editorContentHeight');
  const [playingWordKey, setPlayingWordKey] = useGlobal('playingWordKey');
  const [editorFocussed, setEditorFocussed] = useGlobal('editorFocussed');
  const [autoSeekDisabled, setAutoSeekDisabled] = useGlobal('autoSeekDisabled');
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const windowSize = useWindowSize();
  const windowWidth = windowSize.width;
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const classes = useStyles();
  const theme: CustomTheme = useTheme();
  const [ready, setReady] = React.useState(false);
  const [focussed, setFocussed] = React.useState(false);
  const [overlayStyle, setOverlayStyle] = React.useState<React.CSSProperties | undefined>();
  const [wordTimePickerOptions, setWordTimePickerOptions] = React.useState<WordPickerOptions | undefined>();
  const [segmentPickerOptions, setSegmentPickerOptions] = React.useState<SegmentPickerOptions | undefined>();
  const [segmentSplitOptions, setSegmentSplitOptions] = React.useState<SegmentSplitOptions | undefined>();
  const [readOnlyEditorState, setReadOnlyEditorState] = React.useState(false);
  const [isCommentEnabled, setIsCommentEnabled] = React.useState<boolean>(false);
  const [commentInfo, setCommentInfo] = React.useState<any>({});
  const [reason, setReason] = React.useState<string>('');
  const segments = useSelector((state: any) => state.EditorReducer.segments);
  const dispatch = useDispatch();

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const commentRef = React.useRef<HTMLInputElement | null>(null);
  const diffTextHeight = windowSize.height && (windowSize?.height - AUDIO_PLAYER_HEIGHT - DIFF_TITLE_HEIGHT - EDITOR_MARGIN_TOP - COMMENT_HEIGHT - 13);

  const getIndexOfSegmentId = (segmentId: string): number | null => {
    const indexLocation = segments.map((segment: Segment, index: number) => {
      if(segment.id === segmentId) {
        return index
      }
    });
    if (!indexLocation || indexLocation[0] === undefined || indexLocation[0] < 0) {return null;}
    return indexLocation[0];
  };

  const updateCaretLocation = (segmentIndex: number, wordIndex: number, isForce: boolean = false) => {
    onWordClick({ segmentIndex, wordIndex }, isForce);
  };

  const updatePlayingLocation = () => {
    if(playingLocation) {
      const playingBlock = document.getElementById(`word-${playingLocation.segmentIndex}-${playingLocation.wordIndex}`);
      const selection = window.getSelection();
      const range = document.createRange();

      if(playingBlock) {
        range.selectNodeContents(playingBlock);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  const displayMessage = (message: string, variant: VariantType = SNACKBAR_VARIANTS.info) => {
    enqueueSnackbar(message, { variant });
  };

  /**
   * used in the custom block to open the speaker dialog
   */
  const assignSpeakerForSegment = (segmentIndex: string) => {
    const segmentAndWordIndex = getSegmentAndWordIndex();
    if (segmentAndWordIndex) {
      assignSpeaker(segmentAndWordIndex.segmentIndex);
    }
  };

  /**
   * gets the segment location from the cursor location
   * - saves the current cursor selection so we can restore
   * it after the dialog is closed
   */
  const assignSpeakerFromShortcut = () => {
  };

  /**
   * used in the custom block to delete high-risk segment value
   */
  const removeHighRiskValueFromSegment = (segmentId: string) => {
    const segmentIndex = getIndexOfSegmentId(segmentId);
    if (typeof segmentIndex === 'number') {
      removeHighRiskFromSegment(segmentIndex, segmentId);
    }
  };

  const displayInvalidTimeMessage = () => displayMessage(translate('editor.validation.invalidTimeRange'));

  const openSegmentSplitTimePicker = () => {
      if (playingLocation) {
        const cursorContent = segments[playingLocation.segmentIndex].wordAlignments[playingLocation.wordIndex].word;
        const segmentSplitOptions: SegmentSplitOptions = {
          segmentIndex: playingLocation.segmentIndex,
        }
      }
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
    const playingLocation: SegmentAndWordIndex = getSegmentAndWordIndex();
    if(playingLocation && !autoSeekDisabled) onWordClick(playingLocation);
  };
  /** updates the word alignment data once selected segment / blocks have changed
   * @returns if we should update the editor state
   */
  const updateSegmentOnChange = () => {
  };

  const closeWordTimePicker = () => {
    setWordTimePickerOptions(undefined);
    onWordTimeCreationClose();
  };

  const closeSegmentTimePicker = () => {
    setSegmentPickerOptions(undefined);
    setReadOnlyEditorState(false);
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
      updateSegmentTime(segment.id, segmentIndex, start, length);
      closeSegmentTimePicker();
    }
  };

  const handleWordTimeCreation = () => {
  };

  const handleTextSelection = (segmentId:string, indexFrom: number, indexTo: number) => {
    if(isDiff) {
      setIsCommentEnabled(true);
      setCommentInfo({segmentId, indexFrom, indexTo});
      setTimeout(() => {
        if(commentRef?.current) commentRef.current.focus();
      }, 20);
    }
  };

  const updateChange = async (segmentIndex: number, wordIndex: number, word: string) => {
    const updatedSegment = segments[segmentIndex];
    updatedSegment.wordAlignments[wordIndex].word = word;
    handleSegmentUpdate(updatedSegment, segmentIndex);
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

  const prepareSegmentTimePicker = (segmentIndex: number) => {
    if(!segmentIndex) return;
    const segment = segments[segmentIndex];
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
      };
      setSegmentPickerOptions(segmentPickerOptions);
      setReadOnlyEditorState(true);
    }
  };

  const handleComment = async () => {
    if (api?.voiceData && voiceData && commentInfo) {
      const {segmentId, indexFrom, indexTo} = commentInfo;
      setLoading(true);
      const response = await api.voiceData.updateRejectReason(voiceData.projectId, voiceData.id, segmentId, indexFrom, indexTo, reason);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
      } else {
        log({
          file: `Editor.tsx`,
          caller: `handleComment - failed to updateReason`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      setLoading(false);
      setIsCommentEnabled(false);
      setReason('');
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
    }
  };

  const handleConfirmation = async () => {
    if(api?.voiceData && voiceData) {
      setLoading(true);
      const response = await api.voiceData.confirmData(voiceData.projectId, voiceData.id);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
        //redirect to transcript management
        PATHS.transcription.to && history.push(PATHS.transcription.to);
      } else {
        log({
          file: `Editor.tsx`,
          caller: `confirmData - failed to confirm segments`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if(api?.voiceData && voiceData) {
      setLoading(true);
      const response = await api.voiceData.rejectData(voiceData.projectId, voiceData.id);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
        //redirect to transcript management
        PATHS.transcription.to && history.push(PATHS.transcription.to);
      } else {
        log({
          file: `Editor.tsx`,
          caller: `confirmData - failed to confirm segments`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setLoading(false);
    }
  };

  const handleScrollEvent = (event: any) => {
    const element = event.target;
    if(!isLoadingAdditionalSegment && Math.floor(element.scrollHeight - element.scrollTop) <= element.clientHeight) {
      getNextSegment();
    }
    if(!isLoadingAdditionalSegment && element.scrollTop === 0) {
      getPrevSegment();
    }
  };

  const handleCommentCancel = () => {
    setCommentInfo({});
    setReason('');
    setIsCommentEnabled(false);
  };

  const handleGoToEditMode = () => {
    setIsDiff(false);
  };

  const getDiffCount = () => {
    return 'Diff ' +  document.getElementsByClassName(DECODER_DIFF_CLASSNAME).length + ' 개'
  };

  React.useEffect(() => {
    if(editorCommand) {
      if(editorCommand === EDITOR_CONTROLS.editSegmentTime) {
        let editTimeSegmentIndex;
        if(!playingLocation?.segmentIndex) {
          const cursorLocation = getSegmentAndWordIndex()
          editTimeSegmentIndex = cursorLocation.segmentIndex;
          onWordClick(cursorLocation, true);
        } else {
          editTimeSegmentIndex = playingLocation.segmentIndex;
        }
        prepareSegmentTimePicker(editTimeSegmentIndex);
      }
      onCommandHandled();
      if(readOnlyEditorState || readOnly) {
        return;
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
    onReady(true);
    return () => {
      onReady(false);
      setEditorFocussed(false);
    };
  }, []);

  // keep track of focus to prevent the keypress listeners
  // from firing twice in the editor controls component
  React.useEffect(() => {
    setEditorFocussed(focussed);
  }, [focussed]);

  return (
    <div
      id={'scroll-container'}
      ref={containerRef}
      onClick={handleClickInsideEditor}
      onScroll={handleScrollEvent}
      style={{
        height,
        overflowY: 'auto',
      }}>
      <Backdrop
        className={classes.backdrop}
        style={overlayStyle}
        open={!!readOnlyEditorState}
        onClick={() => {
          return undefined;
        }}>
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
      {
        isDiff ?
        <>
          <div className={classes.diffTitle}>
            <Grid container direction='row' justify='flex-start' >
              <Grid container
                    item
                    className={classes.diffTitleContainer}
                    direction='column'
                    justify='flex-start'
                    alignItems='flex-start'
              >
                <Grid
                    container
                    style={{ margin: '0' }}
                    item
                    direction='column'>
                  <Typography className={classes.diffTitleText}>{voiceData.originalFilename}</Typography>
                </Grid>
                <Grid
                    container
                    item
                    direction='row'
                    style={{ marginTop: '5px' }}>
                  <div style={{ backgroundColor: '#ffe190', width: '30px' }} />
                  <Typography style={{  paddingLeft: '5px' }}>{getDiffCount()}</Typography>
                </Grid>
              </Grid>
              <Grid
                  container
                  item
                  className={classes.diffTitleButton}
                  direction='row'
                  justify='flex-end'
                  alignItems='center'>
                <Grid item>
                  <Button
                      className={classes.button}
                      variant='contained'
                      color="primary"
                      disabled={voiceData.status === CONTENT_STATUS.REJECTED}
                      size='medium'
                      onClick={handleConfirmation}>
                    {translate('common.confirm')}
                  </Button>
                  <Button
                      className={[classes.button, classes.buttonReject].join(' ')}
                      color='secondary'
                      disabled={voiceData.status === CONTENT_STATUS.REJECTED}
                      variant='contained'
                      size='medium'
                      onClick={handleReject}>
                    {translate('common.reject')}
                  </Button>
                  <Button
                      color='primary'
                      variant='contained'
                      size='medium'
                      startIcon={<LaunchIcon />}
                      onClick={handleGoToEditMode}
                      style={{ marginLeft: '10px', float: 'right' }}>
                    {translate('editor.editor')}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </div>
          <div className={classes.diffEditor}>
            {ready &&
            <div className={classes.diffTextArea} style={{ height: `${diffTextHeight}px`, overflowY: 'scroll' }}>
              {
                segments.map((segment: Segment, index: number) => {
                  return <MemoizedDecoderSegmentBlock key={`decoder-segment-block-${index}`}
                                               segment={segment}
                                               segmentIndex={index}
                                               assignSpeakerForSegment={assignSpeaker}
                                               readOnly={true}
                                               removeHighRiskValueFromSegment={removeHighRiskValueFromSegment}
                                               playingLocation={playingLocation} />
                })
              }

            </div>
            }
            {ready &&
            <div className={classes.diffTextArea} style={{ height: `${diffTextHeight}px`, overflowY: 'scroll' }}>
              {
                segments.map((segment: Segment, index: number) => {
                  return <MemoizedSegmentBlock key={`segment-block-${index}`}
                                               segment={segment}
                                               segmentIndex={index}
                                               assignSpeakerForSegment={assignSpeaker}
                                               isDiff={isDiff}
                                               editorCommand={editorCommand}
                                               isAudioPlaying={isAudioPlaying}
                                               isCommentEnabled={isCommentEnabled}
                                               handleTextSelection={handleTextSelection}
                                               readOnly={readOnly}
                                               onUpdateUndoRedoStack={onUpdateUndoRedoStack}
                                               updateCaretLocation={updateCaretLocation}
                                               updateChange={updateChange}
                                               updateSegment={updateSegment}
                                               onCommandHandled={onCommandHandled}
                                               findWordAlignmentIndexToPrevSegment={findWordAlignmentIndexToPrevSegment}
                                               getLastAlignmentIndexInSegment={getLastAlignmentIndexInSegment}
                                               removeHighRiskValueFromSegment={removeHighRiskValueFromSegment}
                                               playingLocation={playingLocation} />
                })
              }
            </div>
            }

          </div>
          <div style={{ height: `${COMMENT_HEIGHT}px`, maxWidth: '100%' }}>
            <Grid
                container
                direction='row'
                justify='flex-start'
                alignItems='flex-start'
            >
              <Grid
                  item
                  className={classes.commentGridItem}
                  justify='flex-start'
              >
                <Typography style={{ fontWeight: 600, color: '#272727' }}>{'@Transcribers'}</Typography>
              </Grid>
              <Grid
                  item
                  className={classes.commentGridItem}
                  justify='flex-start'
              >
                <TextField
                    placeholder='Comment'
                    id='comment-text-field'
                    inputRef={commentRef}
                    disabled={!isCommentEnabled}
                    variant="outlined"
                    className={classes.commentField}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    inputProps={{
                      style: {
                        padding: '5px'
                      }
                    }}
                />
              </Grid>
              <Grid
                  item
                  className={classes.commentGridItem}
                  justify='flex-start'
              >
                <Button
                    color='primary'
                    variant='outlined'
                    size='small'
                    disabled={!isCommentEnabled}
                    onClick={handleCommentCancel}
                >
                  {translate('common.cancel')}
                </Button>
                <Button
                    color='primary'
                    variant='contained'
                    size='small'
                    disabled={!isCommentEnabled}
                    onClick={handleComment}
                    style={{ marginLeft: '10px' }}
                >
                  {translate('common.comment')}
                </Button>
              </Grid>
            </Grid>
          </div>
        </>
          :
            ready && segments.map( (segment: Segment, index: number) => {
              return <MemoizedSegmentBlock
              key={`segment-block-${index}`}
              segment={segment}
              segmentIndex={index}
              assignSpeakerForSegment={assignSpeaker}
              editorCommand={editorCommand}
             isAudioPlaying={isAudioPlaying}
             isDiff={!!isDiff}
              isCommentEnabled={isCommentEnabled}
             handleTextSelection={handleTextSelection}
              readOnly={!!readOnly}
              onUpdateUndoRedoStack={onUpdateUndoRedoStack}
              updateCaretLocation={updateCaretLocation}
              updateChange={updateChange}
              updateSegment={updateSegment}
              onCommandHandled={onCommandHandled}
              findWordAlignmentIndexToPrevSegment={findWordAlignmentIndexToPrevSegment}
              getLastAlignmentIndexInSegment={getLastAlignmentIndexInSegment}
              removeHighRiskValueFromSegment={removeHighRiskValueFromSegment}
              playingLocation={playingLocation} />
          })
      }
    </div>
  );
}
