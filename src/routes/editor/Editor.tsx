import { Box, Button, Container, Grid } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import ErrorIcon from '@material-ui/icons/Error';
import { useSnackbar } from 'notistack';
import React from "react";
import { BulletList } from 'react-content-loader';
import ErrorBoundary from 'react-error-boundary';
import AutosizeInput from 'react-input-autosize';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, ListRowProps } from 'react-virtualized';
import 'react-virtualized/styles.css'; // for the editor's lists
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { useWindowSize } from '../../hooks/window/useWindowSize';
import { ICONS } from '../../theme/icons';
import { CustomTheme } from '../../theme/index';
import { CONTENT_STATUS, ModelConfig, Segment, Time, VoiceData, Word, WordAlignment, WordsbyRangeStartAndEndIndexes, WordToCreateTimeFor } from '../../types';
import { SnackbarError } from '../../types/snackbar.types';
import log from '../../util/log/logger';
import { formatSecondsDuration } from '../../util/misc';
import { AudioPlayer } from '../shared/AudioPlayer';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { NotFound } from '../shared/NotFound';
import { PageErrorFallback } from '../shared/PageErrorFallback';
import { SiteLoadingIndicator } from '../shared/SiteLoadingIndicator';
import { EditorControls, EDITOR_CONTROLS } from './components/EditorControls';
import { EditorFetchButton } from './components/EditorFetchButton';
import { HighRiskSegmentEdit } from './components/HighRiskSegmentEdit';
import { StarRating } from './components/StarRating';


export interface ModelConfigsById {
  [x: number]: ModelConfig;
}

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    container: {
      // flex: 1,
      // padding: 0,
    },
    list: {
      outline: 'none', // removes the focus outline
    },
    segment: {
      // padding: 10,
    },
    segmentTimeButton: {
      borderColor: `${theme.palette.background.paper} !important`,
    },
    segmentTime: {
      color: '#939393',
    },
    splitButton: {
      maxWidth: 24,
      minWidth: 24,
      marginTop: -5,
      paddingTop: 0,
      paddingBottom: 0,
    },
    highRiskSegmentButton: {
      color: theme.editor.highlight,
      maxWidth: 24,
      minWidth: 24,
      marginTop: -5,
      marginLeft: theme.spacing(1),
      paddingTop: 0,
      paddingBottom: 0,
    },
  }),
);

const virtualListCache = new CellMeasurerCache({
  fixedWidth: true,
  defaultHeight: 50,
});

/**
 * reference used to reset focus to the first input 
 * when tabbing should wrap around to the beginning
 */
let firstLCWordReference: HTMLInputElement | null = null;

/**
 * reference used to reset focus to the last input 
 * when shift-tabbing should wrap around to the end
 */
let lastLCWordReference: HTMLInputElement | null = null;

/**
 * ensures that the selected word will be correctly
 * highlighted when setting the audio player seek 
 * from a text input focus
 */
const SEEK_SLOP = 0.01;

const DEFAULT_LC_THRESHOLD = 0.8;
// const DEFAULT_LC_THRESHOLD = 0.5;

const WORD_KEY_SEPARATOR = '-';

const parseWordKey = (key: string) => {
  const [segmentIndex, wordIndex] = key.split(WORD_KEY_SEPARATOR);
  return { segmentIndex: Number(segmentIndex), wordIndex: Number(wordIndex) };
};

const generateWordKey = (segmentIndex: number, wordIndex: number) => {
  const key = `${segmentIndex}${WORD_KEY_SEPARATOR}${wordIndex}`;
  return key;
};

interface SegmentWordProperties {
  [x: number]: {
    [x: number]: {
      edited?: boolean,
      focussed?: boolean;
    };
  };
}

interface SegmentSplitLocation {
  segmentId: string;
  segmentIndex: number;
  splitIndex: number;
}

export enum EDITOR_MODES {
  none,
  edit,
  merge,
  split,
}


export function Editor() {
  const { translate } = React.useContext(I18nContext);
  const windowSize = useWindowSize();
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();
  const [canPlayAudio, setCanPlayAudio] = React.useState(false);
  const [playbackTime, setPlaybackTime] = React.useState(0);
  const [timeToSeekTo, setTimeToSeekTo] = React.useState<number | undefined>();
  const [openWordKey, setOpenWordKey] = React.useState<string | undefined>();
  const [wordsClosed, setWordsClosed] = React.useState<boolean | undefined>();
  const [wordToCreateTimeFor, setWordToCreateTimeFor] = React.useState<WordToCreateTimeFor | undefined>();
  const [wordToUpdateTimeFor, setWordToUpdateTimeFor] = React.useState<WordToCreateTimeFor | undefined>();
  const [segmentIdToDelete, setSegmentIdToDelete] = React.useState<string | undefined>();
  const [deleteAllWordSegments, setDeleteAllWordSegments] = React.useState<boolean | undefined>();
  const [splitLocation, setSplitLocation] = React.useState<SegmentSplitLocation | undefined>();
  const [highRiskSegment, setHighRiskSegment] = React.useState<Segment | undefined>();
  // const [isSegmentEdit, setIsSegmentEdit] = React.useState(false);
  const [words, setWords] = React.useState<WordsbyRangeStartAndEndIndexes>({});
  const [discardDialogOpen, setDiscardDialogOpen] = React.useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  // to force a state change that will rerender the segment buttons
  const [numberOfSegmentsSelected, setNumberOfSegmentsSelected] = React.useState(0);
  const [editorMode, setEditorMode] = React.useState<EDITOR_MODES>(EDITOR_MODES.none);
  const [pendingEditorMode, setPendingEditorMode] = React.useState<EDITOR_MODES | undefined>();
  const [voiceDataLoading, setVoiceDataLoading] = React.useState(false);
  const [initialFetchDone, setInitialFetchDone] = React.useState(false);
  const [noAssignedData, setNoAssignedData] = React.useState(false);
  const [noRemainingContent, setNoRemainingContent] = React.useState(false);
  const [segmentsLoading, setSegmentsLoading] = React.useState(true);
  const [saveSegmentsLoading, setSaveSegmentsLoading] = React.useState(false);
  const [confirmSegmentsLoading, setConfirmSegmentsLoading] = React.useState(false);
  const [projectId, setProjectId] = React.useState<string | undefined>();
  const [voiceData, setVoiceData] = React.useState<VoiceData | undefined>();
  const [segments, setSegments] = React.useState<Segment[]>([]);
  const [initialSegments, setInitialSegments] = React.useState<Segment[]>([]);
  const [segmentWordProperties, setSegmentWordProperties] = React.useState<SegmentWordProperties>({});

  const theme: CustomTheme = useTheme();
  const classes = useStyles();

  /**
   * used to keep track of which segments to send when updating
   */
  const editedSegmentIndexes = React.useMemo(() => new Set<number>(), []);

  /**
   * used to keep track of which segments are selected for merging
   */
  const segmentMergeIndexes = React.useMemo(() => new Set<number>(), []);

  /**
   * Only `CONFIRMED` data can be rated, so we won't show if not
   */
  const alreadyConfirmed = React.useMemo(() => voiceData && voiceData.status === CONTENT_STATUS.CONFIRMED, [voiceData]);


  ///////////////////////////////////////////////
  // CALCULATE FIRST AND LAST WORD `tabIndex`s //
  ///////////////////////////////////////////////
  // to keep track of word focus and to reset the loop while tabbing through

  /** tuple in the form of `[segmentIndex, wordIndex]` */
  let firstWordLocation: [number, number] = React.useMemo(() => [0, 0], []);
  /** tuple in the form of `[segmentIndex, wordIndex]` */
  let lastWordLocation: [number, number] = React.useMemo(() => [0, 0], []);
  /** the current word index counter */
  let wordTabIndex = React.useMemo(() => 1, []);
  /** the first word index */
  let firstWordTabIndex = React.useMemo<undefined | number>(() => undefined, []);
  /** the last word index */
  let lastWordTabIndex = React.useMemo<undefined | number>(() => undefined, []);


  const openDiscardDialog = () => setDiscardDialogOpen(true);
  const closeDiscardDialog = () => setDiscardDialogOpen(false);

  const openConfirmDialog = () => setConfirmDialogOpen(true);
  const closeConfirmDialog = () => setConfirmDialogOpen(false);

  const changeEditMode = (newMode: EDITOR_MODES) => {
    setPendingEditorMode(undefined);
    if (editorMode === EDITOR_MODES.merge) {
      // to reset selected merge segments
      segmentMergeIndexes.clear();
    }
    if (editorMode === EDITOR_MODES.split) {
      // to reset our selected segment
      setSplitLocation(undefined);
    }
    if (newMode === editorMode) {
      setEditorMode(EDITOR_MODES.none);
    } else {
      setEditorMode(newMode);
    }
  };

  /**
   * resets our words to their original state
   * - the `pendingEditorMode` was saved before the dialog was opened
   */
  const discardWordChanges = () => {
    setSegments(initialSegments);
    editedSegmentIndexes.clear();
    if (pendingEditorMode) {
      changeEditMode(pendingEditorMode);
    }
    closeDiscardDialog();
  };

  const handleModeChange = (newMode: EDITOR_MODES) => {
    if (newMode !== EDITOR_MODES.edit && editedSegmentIndexes.size) {
      setPendingEditorMode(newMode);
      openDiscardDialog();
    } else {
      changeEditMode(newMode);
    }
  };

  const handleSegmentToMergeClick = (segmentIndex: number) => {
    if (segmentMergeIndexes.has(segmentIndex)) {
      segmentMergeIndexes.delete(segmentIndex);
    } else if ((segmentMergeIndexes.size === 0) ||
      // to only select segments that are next to each other
      (Math.abs(segmentIndex - Array.from(segmentMergeIndexes)[0]) === 1)) {
      segmentMergeIndexes.add(segmentIndex);
    }
    setNumberOfSegmentsSelected(segmentMergeIndexes.size);
  };

  const getAssignedData = async () => {
    if (api?.voiceData) {
      setVoiceDataLoading(true);
      const response = await api.voiceData.getAssignedData();
      if (response.kind === 'ok') {
        setNoAssignedData(response.noContent);
        setVoiceData(response.voiceData);
        if (response.voiceData?.projectId) {
          setProjectId(response.voiceData.projectId);
        }
      } else {
        log({
          file: `Editor.tsx`,
          caller: `getAssignedData - failed to get assigned data`,
          value: response,
          important: true,
        });
      }
      setVoiceDataLoading(false);
      setInitialFetchDone(true);
    }
  };

  const fetchMoreVoiceData = async () => {
    if (api?.voiceData) {
      setVoiceDataLoading(true);
      const response = await api.voiceData.fetchUnconfirmedData();
      if (response.kind === 'ok') {
        setNoAssignedData(response.noContent);
        setNoRemainingContent(response.noContent);
        setVoiceData(response.voiceData);
        if (response.voiceData?.projectId) {
          setProjectId(response.voiceData.projectId);
        }
      } else {
        log({
          file: `Editor.tsx`,
          caller: `fetchMoreVoiceData - failed to get voiceData`,
          value: response,
          important: true,
        });
      }
      setVoiceDataLoading(false);
      setInitialFetchDone(true);
    };
  };

  // subsequent fetches
  React.useEffect(() => {
    if (!voiceDataLoading && !voiceData && initialFetchDone && !noRemainingContent && !noAssignedData) {
      getAssignedData();
    }
  }, [voiceData, initialFetchDone, voiceDataLoading, noRemainingContent, noAssignedData]);

  // initial fetch
  React.useEffect(() => {
    getAssignedData();
  }, []);

  React.useEffect(() => {
    const getSegments = async () => {
      if (api?.voiceData && projectId && voiceData) {
        setSegmentsLoading(true);
        const response = await api.voiceData.getSegments(projectId, voiceData.id);
        if (response.kind === 'ok') {
          setInitialSegments(response.segments);
          setSegments(response.segments);
        } else {
          log({
            file: `Editor.tsx`,
            caller: `getSegments - failed to get segments`,
            value: response,
            important: true,
          });
        }
        setSegmentsLoading(false);
      }
    };
    getSegments();
  }, [voiceData, projectId]);

  const confirmData = async () => {
    if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
      setConfirmSegmentsLoading(true);
      closeConfirmDialog();
      const response = await api.voiceData.confirmData(projectId, voiceData.id);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });

        // to trigger the `useEffect` to fetch more
        setVoiceData(undefined);
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
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setConfirmSegmentsLoading(false);
    }
  };

  const submitSegmentUpdates = async () => {
    if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);

      // to build which segments to send
      const editedSegmentsToUpdate: Segment[] = [];
      editedSegmentIndexes.forEach(segmentIndex => editedSegmentsToUpdate.push(segments[segmentIndex]));

      const response = await api.voiceData.updateSegments(projectId, voiceData.id, editedSegmentsToUpdate);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        // to reset our list
        editedSegmentIndexes.clear();
        // reset our new default baseline
        setInitialSegments(segments);
      } else {
        log({
          file: `Editor.tsx`,
          caller: `submitSegmentUpdates - failed to update segments`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setSaveSegmentsLoading(false);
    }
  };

  const submitSegmentMerge = async () => {
    if (numberOfSegmentsSelected !== 2) {
      return;
    }
    if (api?.voiceData && projectId && voiceData && segments.length && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);

      const segmentIndexesToMerge: number[] = Array.from(segmentMergeIndexes);
      let firstSegmentIndex = 0;
      let secondSegmentIndex = 0;
      if (segmentIndexesToMerge[0] < segmentIndexesToMerge[1]) {
        firstSegmentIndex = segmentIndexesToMerge[0];
        secondSegmentIndex = segmentIndexesToMerge[1];
      } else {
        firstSegmentIndex = segmentIndexesToMerge[1];
        secondSegmentIndex = segmentIndexesToMerge[0];
      }

      const firstSegmentId = segments[firstSegmentIndex].id;
      const secondSegmentId = segments[secondSegmentIndex].id;

      const response = await api.voiceData.mergeTwoSegments(projectId, voiceData.id, firstSegmentId, secondSegmentId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        // to reset our list
        segmentMergeIndexes.clear();
        setNumberOfSegmentsSelected(0);

        //cut out and replace the old segments
        const mergedSegments = [...segments];
        const NUMBER_OF_MERGE_SEGMENTS_TO_REMOVE = 2;
        mergedSegments.splice(firstSegmentIndex, NUMBER_OF_MERGE_SEGMENTS_TO_REMOVE, response.segment);

        // reset our new default baseline
        setSegments(mergedSegments);
        setInitialSegments(mergedSegments);
      } else {
        log({
          file: `Editor.tsx`,
          caller: `submitSegmentMerge - failed to merge segments`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setSaveSegmentsLoading(false);
    }
  };

  const submitSegmentSplit = async () => {
    if (!splitLocation) return;
    if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);
      const { segmentId, segmentIndex, splitIndex } = splitLocation;
      const response = await api.voiceData.splitSegment(projectId, voiceData.id, segmentId, splitIndex);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });

        // to reset our selected segment
        setSplitLocation(undefined);

        //cut out and replace the old segment
        const splitSegments = [...segments];
        const [firstSegment, secondSegment] = response.segments;
        const NUMBER_OF_SPLIT_SEGMENTS_TO_REMOVE = 1;
        splitSegments.splice(segmentIndex, NUMBER_OF_SPLIT_SEGMENTS_TO_REMOVE, firstSegment, secondSegment);

        // reset our new default baseline
        setSegments(splitSegments);
        setInitialSegments(splitSegments);
      } else {
        log({
          file: `Editor.tsx`,
          caller: `submitSegmentSplit - failed to split segment`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setSaveSegmentsLoading(false);
    }
  };

  const handleSaveClick = () => {
    switch (editorMode) {
      case EDITOR_MODES.split:
        submitSegmentSplit();
        break;
      case EDITOR_MODES.merge:
        submitSegmentMerge();
        break;
      case EDITOR_MODES.edit:
        submitSegmentUpdates();
        break;
    }
  };

  const handleActionClick = (confirm = false) => {
    if (confirm) {
      openConfirmDialog();
    } else {
      handleSaveClick();
    }
  };

  const getDisabledControls = () => {
    const disabledControls: EDITOR_CONTROLS[] = [];
    const mergeDisabled = segments.length < 2;
    if (mergeDisabled) {
      disabledControls.push(EDITOR_CONTROLS.merge);
    }
    const splitDisabled = !segments.some(segment => segment.wordAlignments.length > 1);
    if (splitDisabled) {
      disabledControls.push(EDITOR_CONTROLS.split);
    }
    if (saveSegmentsLoading || confirmSegmentsLoading) {
      disabledControls.push(EDITOR_CONTROLS.save);
      disabledControls.push(EDITOR_CONTROLS.confirm);
    }
    return disabledControls;
  };

  const calculateWordTime = (segmentIndex: number, wordIndex: number) => {
    const segment = segments[segmentIndex];
    const word = segment.wordAlignments[wordIndex];
    const segmentTime = segment.start;
    const wordTime = word.start;
    const totalTime = segmentTime + wordTime;
    return totalTime;
  };

  const calculateIsPlaying = (segmentIndex: number, wordIndex: number) => {
    if (!canPlayAudio) return false;

    const totalTime = calculateWordTime(segmentIndex, wordIndex);
    if (playbackTime < totalTime) {
      return false;
    }
    const isLastWord = !(wordIndex < segments[segmentIndex].wordAlignments.length - 1);
    const isLastSegment = !(segmentIndex < segments.length - 1);
    if (isLastWord && isLastSegment) {
      return true;
    }

    let nextTotalTime = totalTime;
    if (!isLastWord) {
      nextTotalTime = calculateWordTime(segmentIndex, wordIndex + 1);
    } else if (!isLastSegment) {
      nextTotalTime = calculateWordTime(segmentIndex + 1, 0);
    }
    if (playbackTime < nextTotalTime) {
      return true;
    }
    return false;
  };

  const updateSegmentsOnChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    segment: Segment,
    wordAlignment: WordAlignment,
    segmentIndex: number,
    wordIndex: number,
  ) => {
    // to allow us to use the original synthetic event multiple times
    // prevents a react error
    // See https://fb.me/react-event-pooling for more information. 
    event.persist();

    // to track which segments have been edited
    editedSegmentIndexes.add(segmentIndex);

    // update all segment values
    setSegments(prevSegments => {
      const updatedWord: WordAlignment = {
        ...wordAlignment,
        word: event.target.value,
      };
      const updatedWordAlignments = [...segment.wordAlignments];
      updatedWordAlignments.splice(wordIndex, 1, updatedWord);

      const updatedSegment = {
        ...segment,
        wordAlignments: updatedWordAlignments,
      };
      const updatedSegments = [...prevSegments];
      updatedSegments.splice(segmentIndex, 1, updatedSegment);

      return updatedSegments;
    });
  };

  const getWordFocussed = (segmentIndex: number, wordIndex: number) => {
    let focussed = false;
    if (segmentWordProperties &&
      segmentWordProperties[segmentIndex] &&
      segmentWordProperties[segmentIndex][wordIndex]) {
      focussed = !!segmentWordProperties[segmentIndex][wordIndex].focussed;
    }
    return focussed;
  };

  const getWordStyle = (focussed: boolean, isLC: boolean, isPlaying: boolean) => {
    const LC_COLOR = theme.editor.LC;
    const PLAYING_COLOR = theme.editor.playing;
    const PLAYING_SHADOW_COLOR = theme.palette.primary.light;
    const FOCUS_COLOR = theme.editor.focussed;
    const wordStyle: React.CSSProperties = {
      outline: 'none',
      border: 0,
      backgroundColor: theme.palette.background.paper,
    };
    if (isLC) {
      wordStyle.backgroundColor = LC_COLOR;
    }
    if (isPlaying) {
      wordStyle.color = PLAYING_COLOR;
      wordStyle.boxShadow = `inset 0px 0px 0px 2px ${PLAYING_SHADOW_COLOR}`;
    }
    if (focussed) {
      wordStyle.boxShadow = `inset 0px 0px 0px 2px ${FOCUS_COLOR}`;
    }
    return wordStyle;
  };


  /**
   * Determines if an input field can be accessed via tabbing
   * @param segmentIndex 
   * @param wordIndex 
   */
  const getTabIndex = (segmentIndex: number, wordIndex: number) => {
    const [maxSegmentIndex, maxWordIndex] = lastWordLocation;
    wordTabIndex++;
    // in a new later segment
    if (segmentIndex > maxSegmentIndex) {
      lastWordLocation = [segmentIndex, wordIndex];
      // write the new tab index
      if (lastWordTabIndex === undefined || lastWordTabIndex < wordTabIndex) {
        lastWordTabIndex = wordTabIndex;
      }
    }
    // in the same segment but a new later word
    if (segmentIndex === maxSegmentIndex && wordIndex > maxWordIndex) {
      lastWordLocation = [segmentIndex, wordIndex];
      // write the new tab index
      if (lastWordTabIndex === undefined || lastWordTabIndex < wordTabIndex) {
        lastWordTabIndex = wordTabIndex;
      }
    }
    // write the values for the first initial word
    if (firstWordTabIndex === undefined) {
      firstWordTabIndex = wordTabIndex;
      firstWordLocation = [segmentIndex, wordIndex];
    }
    return wordTabIndex;
  };


  /**
   * Sets the the focus state of the the word based on its location in the segments
   * @param isFocussed - the focus state of the word
   */
  const setFocus = (segmentIndex: number, wordIndex: number, isFocussed = true) => {
    setSegmentWordProperties((prevValue) => {
      if (prevValue && prevValue[segmentIndex]) {
        if (prevValue[segmentIndex][wordIndex]) {
          prevValue[segmentIndex][wordIndex].focussed = isFocussed;
        } else {
          prevValue[segmentIndex][wordIndex] = {
            focussed: isFocussed,
          };
        }
      } else {
        prevValue[segmentIndex] = {
          [wordIndex]: {
            focussed: isFocussed,
          }
        };
      }
      return prevValue;
    });
  };

  const handleTabKeyCatch = (
    event: React.KeyboardEvent<HTMLInputElement>,
    segmentIndex: number,
    wordIndex: number,
  ) => {
    const [firstSegmentIndex, firstWordIndex] = firstWordLocation;
    const [lastSegmentIndex, lastWordIndex] = lastWordLocation;
    const isLastWord = segmentIndex === lastSegmentIndex && wordIndex === lastWordIndex;
    const isFirstWord = segmentIndex === firstSegmentIndex && wordIndex === firstWordIndex;
    if (isLastWord && !event.shiftKey && event.key === 'Tab') {
      event.preventDefault();
      firstLCWordReference && firstLCWordReference.focus();
    } else if (isFirstWord && event.shiftKey && event.key === 'Tab') {
      event.preventDefault();
      lastLCWordReference && lastLCWordReference.focus();
    }
  };

  /**
   * - sets the seek time in the audio player
   */
  const handleWordClick = (
    segmentIndex: number,
    wordIndex: number,
  ) => {
    const wordTime = calculateWordTime(segmentIndex, wordIndex);
    setTimeToSeekTo(wordTime + SEEK_SLOP);
  };

  /**
   * - sets which word is focussed
   * - sets the seek time in the audio player
   */
  const handleFocus = (
    segmentIndex: number,
    wordIndex: number,
  ) => {
    setFocus(segmentIndex, wordIndex);
    handleWordClick(segmentIndex, wordIndex);
  };

  /**
   * - sets the word focus
   * - resets the seek time in the audio player
   */
  const handleBlur = (
    segmentIndex: number,
    wordIndex: number,
  ) => {
    setFocus(segmentIndex, wordIndex, false);
    setTimeToSeekTo(undefined);
  };

  const handlePlayerRendered = () => setCanPlayAudio(true);

  const handleSplitLocationPress = (segmentId: string, segmentIndex: number, splitIndex: number) => {
    if (splitLocation && (
      (segmentId === (splitLocation.segmentId)) &&
      (segmentIndex === (splitLocation.segmentIndex)) &&
      (splitIndex === (splitLocation.splitIndex))
    )) {
      setSplitLocation(undefined);
    } else {
      setSplitLocation({
        segmentId,
        segmentIndex,
        splitIndex,
      });
    }
  };

  const editHighRiskSegment = (segment: Segment) => {
    setHighRiskSegment(segment);
  };

  const stopHighRiskSegmentEdit = () => {
    setHighRiskSegment(undefined);
    setDeleteAllWordSegments(true);
    setWords({});
    setWordsClosed(undefined);
    setSegmentIdToDelete(undefined);
    setWordToCreateTimeFor(undefined);
  };

  const renderWords = (segment: Segment, segmentIndex: number) => {
    const words = segment.wordAlignments.map((wordAlignment, wordIndex) => {
      const key = generateWordKey(segmentIndex, wordIndex);
      const isFocussed = getWordFocussed(segmentIndex, wordIndex);
      const isLC = wordAlignment.confidence < DEFAULT_LC_THRESHOLD;
      const isPlaying = calculateIsPlaying(segmentIndex, wordIndex);
      const wordStyle = getWordStyle(isFocussed, isLC, isPlaying);
      const tabIndex = getTabIndex(segmentIndex, wordIndex);

      const isFirstWord = firstWordTabIndex === tabIndex;
      const isLastWord = lastWordTabIndex === tabIndex;
      const { highRisk } = segment;
      const isLastWordInSegment = (segment.wordAlignments.length - 1) === wordIndex;


      let isSplitSelected = false;
      if (splitLocation &&
        splitLocation.segmentId === segment.id &&
        splitLocation.segmentIndex === segmentIndex &&
        splitLocation.splitIndex === wordIndex &&
        editorMode === EDITOR_MODES.split) {
        isSplitSelected = true;
      }

      const content = <AutosizeInput
        inputRef={
          isFirstWord ?
            ((inputRef) => firstLCWordReference = inputRef) :
            (isLastWord ?
              ((inputRef) => lastLCWordReference = inputRef) : undefined)}
        disabled={editorMode !== EDITOR_MODES.edit}
        tabIndex={tabIndex}
        key={key}
        name={key}
        value={wordAlignment.word}
        minWidth={5}
        inputStyle={{
          ...theme.typography.body1, // font styling
          ...wordStyle,
          margin: theme.spacing(0.25),
          marginTop: 5, // to keep the text even with the split buttons
        }}
        autoFocus={isFocussed}
        onClick={(event) => handleWordClick(segmentIndex, wordIndex)}
        onFocus={(event) => handleFocus(segmentIndex, wordIndex)}
        onBlur={(event) => handleBlur(segmentIndex, wordIndex)}
        onKeyDown={(event) => handleTabKeyCatch(event, segmentIndex, wordIndex)}
        onChange={(event) =>
          updateSegmentsOnChange(event, segment, wordAlignment, segmentIndex, wordIndex)
        }
      />;

      return (<React.Fragment key={key}>
        {!!wordIndex && (
          <Button
            aria-label="split-button"
            size="small"
            disabled={editorMode !== EDITOR_MODES.split}
            color={'primary'}
            variant={isSplitSelected ? 'contained' : undefined}
            onClick={() => handleSplitLocationPress(segment.id, segmentIndex, wordIndex)}
            className={classes.splitButton}
          >
            <ICONS.InlineSplit />
          </Button>
        )}
        {content}
        {highRisk && isLastWordInSegment && (
          <IconButton
            aria-label="high-risk-segment-button"
            size="small"
            onClick={() => editHighRiskSegment(segment)}
            className={classes.highRiskSegmentButton}
          >
            <ErrorIcon />
          </IconButton>
        )}
      </React.Fragment>);
    });
    return words;
  };

  function rowRenderer({ key, index, style, parent }: ListRowProps) {
    const isRowSelected = segmentMergeIndexes.has(index);
    const isMergeMode = editorMode === EDITOR_MODES.merge;
    const { highRisk } = segments[index];

    return (
      segments[index] && <CellMeasurer
        key={key}
        style={style}
        parent={parent}
        cache={virtualListCache}
        columnIndex={0}
        rowIndex={index}
      >
        <Grid container spacing={2} >
          <Grid item>
            <Button
              className={!isMergeMode ? classes.segmentTimeButton : undefined}
              color='primary'
              disabled={!isMergeMode}
              variant={isRowSelected ? 'contained' : 'outlined'}
              onClick={() => handleSegmentToMergeClick(index)}
            >
              {formatSecondsDuration(segments[index].start)}
            </Button>
          </Grid>
          <Grid item xs={12} sm container>
            <Box
              border={highRisk ? 1 : 0}
              borderColor={theme.editor.highlight}
              borderRadius={5}
            >
              {renderWords(segments[index], index)}
            </Box>
          </Grid>
        </Grid>
      </CellMeasurer>
    );
  }

  /**
   * keeps track of where the timer is
   * - used to keep track of which word is currently playing
   * @params time
   */
  const handlePlaybackTimeChange = (time: number) => {
    setPlaybackTime(time);
    // to allow us to continue to force seeking the same word during playback
    setTimeToSeekTo(undefined);
  };
  
  const handleWordUpdate = (newWordValues: WordsbyRangeStartAndEndIndexes) => {
    setWords({ ...newWordValues });
  };

  const createWordTimeSection = (wordToAddTimeTo: Word, timeToCreateAt: number, wordKey: string) => {
    setWordToCreateTimeFor({ ...wordToAddTimeTo, segmentStartTime: timeToCreateAt, wordKey });
  };

  const updateWordTimeSection = (wordToAddTimeTo: Word, startTime: number, endTime: number, wordKey: string) => {
    setWordToUpdateTimeFor({ ...wordToAddTimeTo, segmentStartTime: startTime, segmentEndTime: endTime, wordKey });
  };

  const handleWordsReset = () => {
    setWords({});
    setDeleteAllWordSegments(true);
  };

  const handleWordOpen = (openWordKey: string) => {
    setOpenWordKey(openWordKey);

  };

  const handleWordClose = () => setWordsClosed(true);

  /**
   * to reset the value once the peaks has made the segment uneditable
   * - for when a word edit popper is closed
   */
  const handleSegmentStatusEditChange = () => setWordsClosed(undefined);

  const handleSegmentDelete = () => {
    setSegmentIdToDelete(undefined);
    setDeleteAllWordSegments(undefined);
  };

  const handleSegmentCreate = () => setWordToCreateTimeFor(undefined);

  const handleSegmentUpdate = () => setWordToUpdateTimeFor(undefined);

  const deleteWordTimeSection = (wordKey: string) => {
    setSegmentIdToDelete(wordKey);
  };

  const handleSectionChange = (time: Time, wordKey: string) => {
    setWords(prevWords => {
      const updatedWords = { ...prevWords };
      const updatedWord = updatedWords[wordKey];
      if (updatedWord) {
        updatedWord.time = time;
      }
      return { ...updatedWords, [wordKey]: updatedWord };
    });
  };

  if (voiceDataLoading) {
    return <SiteLoadingIndicator />;
  }

  if (initialFetchDone && noAssignedData && !noRemainingContent) {
    return <EditorFetchButton onClick={fetchMoreVoiceData} />;
  }

  if (noRemainingContent || !voiceData || !projectId) {
    return <NotFound text={translate('editor.nothingToTranscribe')} />;
  }

  const disabledControls = getDisabledControls();

  return (
    <>
      <EditorControls
        onModeChange={handleModeChange}
        onAction={handleActionClick}
        editorMode={editorMode}
        disabledControls={disabledControls}
        loading={saveSegmentsLoading || confirmSegmentsLoading}
      />
      {alreadyConfirmed && (<StarRating
        voiceData={voiceData}
        projectId={projectId}
      />)}
      <Container
        className={classes.container}
      >
        <Paper
          style={{ marginTop: 25 }}
          elevation={5}
        >
          <div style={{
            padding: 15,
            // height: 500,
            height: windowSize.height && (windowSize?.height - 384),
            minHeight: 250,
          }}>
            {segmentsLoading ? <BulletList /> :
              (highRiskSegment ?
                <HighRiskSegmentEdit
                  words={words}
                  updateWords={handleWordUpdate}
                  createWordTimeSection={createWordTimeSection}
                  updateWordTimeSection={updateWordTimeSection}
                  deleteWordTimeSection={deleteWordTimeSection}
                  onWordOpen={handleWordOpen}
                  onWordClose={handleWordClose}
                  onReset={handleWordsReset}
                  onClose={stopHighRiskSegmentEdit}
                  segment={highRiskSegment}
                  projectId={projectId}
                  dataId={voiceData.id}
                />
                : <AutoSizer>
                  {({ height, width }) => {
                    return (
                      <List
                        className={classes.list}
                        height={height}
                        rowCount={segments.length}
                        rowHeight={virtualListCache.rowHeight}
                        rowRenderer={rowRenderer}
                        width={width}
                        deferredMeasurementCache={virtualListCache}
                      />
                    );
                  }}
                </AutoSizer>)
            }
          </div>

          {!!voiceData.length && <ErrorBoundary
            key={voiceData.id}
            FallbackComponent={PageErrorFallback}
          >
            <AudioPlayer
              key={voiceData.id}
              url={voiceData.audioUrl}
              length={voiceData.length}
              timeToSeekTo={timeToSeekTo}
              openWordKey={openWordKey}
              segmentIdToDelete={segmentIdToDelete}
              wordsClosed={wordsClosed}
              deleteAllWordSegments={deleteAllWordSegments}
              onSegmentDelete={handleSegmentDelete}
              onSegmentCreate={handleSegmentCreate}
              onSegmentUpdate={handleSegmentUpdate}
              onSegmentStatusEditChange={handleSegmentStatusEditChange}
              wordToCreateTimeFor={wordToCreateTimeFor}
              wordToUpdateTimeFor={wordToUpdateTimeFor}
              onTimeChange={handlePlaybackTimeChange}
              onSectionChange={handleSectionChange}
              onReady={handlePlayerRendered}
            />
          </ErrorBoundary>}
        </Paper>
      </Container >
      <ConfirmationDialog
        destructive
        titleText={`${translate('editor.discardChanges')}?`}
        submitText={translate('common.discard')}
        open={discardDialogOpen}
        onSubmit={discardWordChanges}
        onCancel={closeDiscardDialog}
      />
      <ConfirmationDialog
        titleText={`${translate('editor.confirmTranscript')}?`}
        submitText={translate('editor.confirm')}
        open={confirmDialogOpen}
        onSubmit={confirmData}
        onCancel={closeConfirmDialog}
      />
    </>
  );
};
