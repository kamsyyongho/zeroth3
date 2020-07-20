import {Container} from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
/* eslint import/no-webpack-loader-syntax: off */
// this lint rule is from create-react-app
import * as workerPath from "file-loader?name=[name].js!./workers/editor-page.worker";
import {useSnackbar, VariantType} from 'notistack';
import {BulletList} from 'react-content-loader';
import ErrorBoundary from 'react-error-boundary';
import React, {useGlobal} from "reactn";
import {PERMISSIONS} from '../../constants';
import {ApiContext} from '../../hooks/api/ApiContext';
import {I18nContext} from '../../hooks/i18n/I18nContext';
import {KeycloakContext} from '../../hooks/keycloak/KeycloakContext';
import {useWindowSize} from '../../hooks/window/useWindowSize';
import {CustomTheme} from '../../theme/index';
import {
  CONTENT_STATUS,
  DataSet,
  PlayingTimeData,
  Segment,
  SegmentAndWordIndex,
  SNACKBAR_VARIANTS,
  SnackbarError,
  Time,
  VoiceData,
  Word,
  WordAlignment,
  WordToCreateTimeFor
} from '../../types';
import {ProblemKind} from '../../services/api/types';
import log from '../../util/log/logger';
import {setPageTitle} from '../../util/misc';
import {ConfirmationDialog} from '../shared/ConfirmationDialog';
import {Forbidden} from '../shared/Forbidden';
import {NotFound} from '../shared/NotFound';
import {PageErrorFallback} from '../shared/PageErrorFallback';
import {SiteLoadingIndicator} from '../shared/SiteLoadingIndicator';
import {AudioPlayer} from './AudioPlayer';
import {AssignSpeakerDialog} from './components/AssignSpeakerDialog';
import {EDITOR_CONTROLS, EditorControls} from './components/EditorControls';
import {EditorFetchButton} from './components/EditorFetchButton';
import {StarRating} from './components/StarRating';
import {Editor} from './Editor';
import {calculateWordTime, getDisabledControls} from './helpers/editor-page.helper';
import {getSegmentAndWordIndex, updatePlayingLocation} from './helpers/editor.helper';
import {HelperPage} from './components/HelperPage';

const useStyles = makeStyles((theme: CustomTheme) =>
    createStyles({
      container: {
        marginTop: 25,
      },
    }),
);

/**
 * ensures that the selected word will be correctly
 * highlighted when setting the audio player seek
 * from a text input focus
 */
const SEEK_SLOP = 0.00001;
const STARTING_PLAYING_LOCATION: SegmentAndWordIndex = [0, 0];
let internalSegmentsTracker: Segment[] = [];
/** used to debounce navigation when we change time after word click */
let wordWasClicked = false;
const AUDIO_PLAYER_HEIGHT = 384;

export enum PARENT_METHOD_TYPES {
  speaker,
  highRisk,
  speakerCancel,
}

export interface ParentMethodResponse {
  payload?: {
    segment: Segment,
    index: number,
  };
  type: PARENT_METHOD_TYPES,
}

/** props that need to be passed to the time pickers */
export interface TimePickerRootProps {
  timeFromPlayer?: Time;
  createTimeSection: (wordToAddTimeTo: Word, wordKey: string, isWord?: boolean) => void;
  deleteTimeSection: (wordKey: string, isWord?: boolean) => void;
  updateTimeSection: (wordToAddTimeTo: Word, wordKey: string, isWord?: boolean) => void;
  setDisabledTimes: (disabledTimes: Time[]) => void;
}

/** props that need to be passed to the split time picker */
export interface SplitTimePickerRootProps {
  segmentSplitTime?: number;
  onCreateSegmentSplitTimeBoundary: (segmentTimeBoundary: Required<Time>) => void;
  onSegmentSplitTimeBoundaryCreated: () => void;
  onSegmentSplitTimeChanged: (time: number) => void;
  onSegmentSplitTimeDelete: () => void;
}

export interface NavigationPropsToGet {
  voiceData?: VoiceData;
  projectId?: string;
  isDiff?: boolean;
  readOnly: boolean
}

export function EditorPage() {
  const { translate } = React.useContext(I18nContext);
  const windowSize = useWindowSize();
  const api = React.useContext(ApiContext);
  const { hasPermission, roles, user } = React.useContext(KeycloakContext);
  const { enqueueSnackbar } = useSnackbar();
  const [undoRedoData, setUndoRedoData] = useGlobal('undoRedoData');
  const [showEditorPopups, setShowEditorPopups] = useGlobal('showEditorPopups');
  const [shortcuts, setShortcuts] = useGlobal<any>('shortcuts');
  const [responseToPassToEditor, setResponseToPassToEditor] = React.useState<ParentMethodResponse | undefined>();
  const [canPlayAudio, setCanPlayAudio] = React.useState(false);
  const [playbackTime, setPlaybackTime] = React.useState(0);
  const [timeToSeekTo, setTimeToSeekTo] = React.useState<number | undefined>();
  const [currentPlayingLocation, setCurrentPlayingLocation] = React.useState<SegmentAndWordIndex>(STARTING_PLAYING_LOCATION);
  const [disabledTimes, setDisabledTimes] = React.useState<Time[] | undefined>();
  const [autoSeekLock, setAutoSeekLock] = React.useState(false);
  const [wordsClosed, setWordsClosed] = React.useState<boolean | undefined>();
  // const [currentPlayingWordPlayerSegment, setCurrentPlayingWordPlayerSegment] = React.useState<PlayingWordAndSegment | undefined>();
  const [currentlyPlayingWordTime, setCurrentlyPlayingWordTime] = React.useState<Required<Time> | undefined>();
  const [wordToCreateTimeFor, setWordToCreateTimeFor] = React.useState<WordToCreateTimeFor | undefined>();
  const [wordToUpdateTimeFor, setWordToUpdateTimeFor] = React.useState<WordToCreateTimeFor | undefined>();
  const [segmentSplitTimeBoundary, setSegmentSplitTimeBoundary] = React.useState<Required<Time> | undefined>();
  const [segmentSplitTime, setSegmentSplitTime] = React.useState<number | undefined>();
  const [segmentIdToDelete, setSegmentIdToDelete] = React.useState<string | undefined>();
  const [deleteAllWordSegments, setDeleteAllWordSegments] = React.useState<boolean | undefined>();
  const [segmentIndexToAssignSpeakerTo, setSegmentIndexToAssignSpeakerTo] = React.useState<number | undefined>();
  const [timeFromPlayer, setTimeFromPlayer] = React.useState<Time | undefined>();
  const [editorReady, setEditorReady] = React.useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [editorCommand, setEditorCommand] = React.useState<EDITOR_CONTROLS | undefined>();
  const [voiceDataLoading, setVoiceDataLoading] = React.useState(false);
  const [noAssignedData, setNoAssignedData] = React.useState(false);
  const [noRemainingContent, setNoRemainingContent] = React.useState(false);
  const [segmentsLoading, setSegmentsLoading] = React.useState(true);
  const [saveSegmentsLoading, setSaveSegmentsLoading] = React.useState(false);
  const [highRiskRemoveLoading, setHighRiskRemoveLoading] = React.useState(false);
  const [confirmSegmentsLoading, setConfirmSegmentsLoading] = React.useState(false);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);
  const [initialFetchDone, setInitialFetchDone] = React.useState(false);
  const [segments, setSegments] = React.useState<Segment[]>([]);
  const [speakers, setSpeakers] = React.useState<string[]>([]);
  const [dataSets, setDataSets] = React.useState<DataSet[]>([]);
  const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);
  const [playingTimeData, setPlayingTimeData] = React.useState<PlayingTimeData>({});
  const [audioUrl, setAudioUrl] = React.useState<string>('');
  const [isSegmentUpdateError, setIsSegmentUpdateError] = React.useState<boolean>(false);
  const [isShortCutPageOpen, setIsShortCutPageOpen] = React.useState<boolean>(false);

  // get the passed info if we got here via the details page

  const [navigationProps, setNavigationProps] = useGlobal<{ navigationProps: NavigationPropsToGet; }>('navigationProps');
  const [voiceData, setVoiceData] = React.useState<VoiceData | undefined>(navigationProps?.voiceData);
  const [projectId, setProjectId] = React.useState<string | undefined>(navigationProps?.projectId);
  const [isDiff, setIsDiff] = React.useState<boolean | undefined>(navigationProps?.isDiff);
  const [readOnly, setReadOnly] = React.useState<boolean | undefined>(navigationProps?.readOnly);
  // const readOnly = React.useMemo(() => !!navigationProps?.voiceData, []);

  const theme: CustomTheme = useTheme();
  const classes = useStyles();

  /**
   * Only `CONFIRMED` data can be rated, so we won't show if not
   */
  const alreadyConfirmed = React.useMemo(() => voiceData && voiceData.status === CONTENT_STATUS.CONFIRMED, [voiceData]);

  const canUseEditor = React.useMemo(() => hasPermission(roles, PERMISSIONS.editor.edit), [roles]);
  const canSeeReadOnlyEditor = React.useMemo(() => hasPermission(roles, PERMISSIONS.editor.readOnly), [roles]);

  const openConfirmDialog = () => setConfirmDialogOpen(true);
  const closeConfirmDialog = () => setConfirmDialogOpen(false);

  const displayMessage = (message: string, variant: VariantType = SNACKBAR_VARIANTS.info) => {
    enqueueSnackbar(message, { variant });
  };

  const handleSegmentUpdate = (updatedSegment: Segment, segmentIndex: number) => {
    const updatedSegments = [...segments];
    updatedSegments[segmentIndex] = updatedSegment;
    setSegments(updatedSegments);
  };

  const getAssignedData = async () => {
    if (api?.voiceData) {
      setVoiceDataLoading(true);
      const response = await api.voiceData.getAssignedData();
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        setNoAssignedData(response.noContent);
        setVoiceData(response.voiceData);
        if (response.voiceData?.projectId) {
          setProjectId(response.voiceData.projectId);
        }
      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `getAssignedData - failed to get assigned data`,
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
      setVoiceDataLoading(false);
      setInitialFetchDone(true);
    }
  };

  const fetchMoreVoiceData = async (dataSetId?: string) => {
    if (api?.voiceData) {
      setVoiceDataLoading(true);
      const response = await api.voiceData.fetchUnconfirmedData(dataSetId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        setNoAssignedData(response.noContent);
        setNoRemainingContent(response.noContent);
        setVoiceData(response.voiceData);
        if (response.voiceData?.projectId) {
          setProjectId(response.voiceData.projectId);
        }
      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `fetchMoreVoiceData - failed to get voiceData`,
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
      setVoiceDataLoading(false);
      setInitialFetchDone(true);
    };
  };

  const getSegments = async () => {
    if (api?.voiceData && projectId && voiceData) {
      setSegmentsLoading(true);
      const response = await api.voiceData.getSegments(projectId, voiceData.id);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        setSegments(response.segments);
      } else if (response.kind !== ProblemKind['bad-data']){
        log({
          file: `EditorPage.tsx`,
          caller: `getSegments - failed to get segments`,
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
      setSegmentsLoading(false);
    }
  };

  const getShortcuts = async () => {
    if (api?.user) {
      setSegmentsLoading(true);
      const response = await api.user.getShortcuts();
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        setShortcuts(response.shortcuts);
      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `getSegments - failed to get segments`,
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
      setSegmentsLoading(false);
    }
  };

  const getDataSetsToFetchFrom = async () => {
    if (api?.user) {
      const response = await api.user.getDataSetsToFetchFrom();
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        setDataSets(response.dataSets);
      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `getDataSetsToFetchFrom - failed to get data sets`,
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
    }
  };

  const confirmData = async () => {
    if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
      setConfirmSegmentsLoading(true);
      closeConfirmDialog();
      const response = await api.voiceData.requestApproval(projectId, voiceData.id);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
        // to trigger the `useEffect` to fetch more
        setIsSegmentUpdateError(false);
        setVoiceData(undefined);
      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `confirmData - failed to confirm segments`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        setIsSegmentUpdateError(true);
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setConfirmSegmentsLoading(false);
    }
  };

  const submitSegmentUpdate = async (segmentId: string,
                                     wordAlignments: WordAlignment[],
                                     transcript: string,
                                     segmentIndex: number) => {
    if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);
      wordAlignments.forEach(word => word.word = word.word.replace(/(&nbsp;)*/g,"").replace(' ', '|'));
      const response = await api.voiceData.updateSegment(projectId, voiceData.id, segmentId, wordAlignments);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        const updatedSegment: Segment = { ...segments[segmentIndex], wordAlignments: [...wordAlignments], transcript };
        const updatedSegments = [...segments];
        updatedSegments.splice(segmentIndex, 1, updatedSegment);
        setSegments(updatedSegments);
        setIsSegmentUpdateError(false);
        onUpdateUndoRedoStack(false, false);
      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `submitSegmentUpdate - failed to update segment`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        setIsSegmentUpdateError(true);
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setSaveSegmentsLoading(false);
    }
  };

  const submitSegmentTimeUpdate = async (segmentId: string,
                                         segmentIndex: number,
                                         start: number,
                                         length: number) => {
    if (api?.voiceData && projectId && voiceData && segments.length && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);
      const response = await api.voiceData.updateSegmentTime(projectId, voiceData.id, segmentId, start, length);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        setIsSegmentUpdateError(false);
        const updatedSegment: Segment = { ...segments[segmentIndex], start, length };
        const updatedSegments = [...segments];
        updatedSegments.splice(segmentIndex, 1, updatedSegment);
        setSegments(updatedSegments);
        onUpdateUndoRedoStack(false, false);

      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `submitSegmentTimeUpdate - failed to update segment time`,
          value: response,
          important: true,
        });
        setIsSegmentUpdateError(true);
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setSaveSegmentsLoading(false);
    }
  };

  const handleSegmentMergeCommand = async () => {
    const caretLocation = getSegmentAndWordIndex();
    if(!caretLocation || caretLocation[0] === segments.length -1) {
      displayMessage(translate('editor.validation.invalidMergeLocation'));
      return;
    }

    const selectedSegmentIndex = caretLocation[0];
    if (api?.voiceData && projectId && voiceData && segments.length && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);
      const firstSegmentId = segments[selectedSegmentIndex].id;
      const secondSegmentId = segments[selectedSegmentIndex + 1].id;
      const response = await api.voiceData.mergeTwoSegments(projectId, voiceData.id, firstSegmentId, secondSegmentId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        //cut out and replace the old segments
        const mergedSegments = [...segments];
        const NUMBER_OF_MERGE_SEGMENTS_TO_REMOVE = 2;
        mergedSegments.splice(selectedSegmentIndex, NUMBER_OF_MERGE_SEGMENTS_TO_REMOVE, response.segment);
        // reset our new default baseline
        setSegments(mergedSegments);
        setIsSegmentUpdateError(false);
        onUpdateUndoRedoStack(false, false);
      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `submitSegmentMerge - failed to merge segments`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        setIsSegmentUpdateError(true);
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setSaveSegmentsLoading(false);
    }
  };

  const handleSegmentSplitCommand = async () => {
    const caretLocation = getSegmentAndWordIndex();
    const segmentIndex = caretLocation?.[0];
    const wordIndex = caretLocation?.[1];
    if(typeof segmentIndex !== 'number' || typeof wordIndex !== 'number' || !caretLocation || !caretLocation[0] || !caretLocation[1]) {return;}
    if(segmentIndex === 0 ||
        wordIndex === segments?.[segmentIndex]?.['wordAlignments'].length - 1) {
      displayMessage(translate('editor.validation.invalidSplitLocation'));
      return;
    }

    const trackSegments = segments || internalSegmentsTracker;

    if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);
      const response = await api.voiceData.splitSegment(projectId, voiceData.id, trackSegments[caretLocation[0]].id, caretLocation[1]);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        setIsSegmentUpdateError(false);
        //cut out and replace the old segment
        const splitSegments = [...trackSegments];
        const [firstSegment, secondSegment] = response.segments;
        const NUMBER_OF_SPLIT_SEGMENTS_TO_REMOVE = 1;
        splitSegments.splice(caretLocation[0], NUMBER_OF_SPLIT_SEGMENTS_TO_REMOVE, firstSegment, secondSegment);

        // reset our new default baseline
        setSegments(splitSegments);
        onUpdateUndoRedoStack(false, false);
        // update the editor
      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `submitSegmentSplit - failed to split segment`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        setIsSegmentUpdateError(true);
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setSaveSegmentsLoading(false);
    }
  };

  const submitSegmentSplitByTime = async (segmentId: string,
                                          segmentIndex: number,
                                          time: number,
                                          wordStringSplitIndex: number,
                                          onSuccess: (updatedSegments: [Segment, Segment]) => void) => {
    if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);
      const response = await api.voiceData.splitSegmentByTime(projectId, voiceData.id, segmentId, time, wordStringSplitIndex);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        setIsSegmentUpdateError(false);
        snackbarError = undefined;
        //cut out and replace the old segment
        const splitSegments = [...segments];
        const [firstSegment, secondSegment] = response.segments;
        const NUMBER_OF_SPLIT_SEGMENTS_TO_REMOVE = 1;
        splitSegments.splice(segmentIndex, NUMBER_OF_SPLIT_SEGMENTS_TO_REMOVE, firstSegment, secondSegment);
        // reset our new default baseline
        setSegments(splitSegments);
        // update the editor
        onSuccess(response.segments);
      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `submitSegmentSplitByTime - failed to split segment by time`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        setIsSegmentUpdateError(true);
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setSaveSegmentsLoading(false);
    }
  };

  const removeHighRiskFlagFromSegment = async (segmentIndex: number, segmentId: string) => {
    if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
      setHighRiskRemoveLoading(true);
      const response = await api.voiceData.removeHighRiskFlagFromSegment(projectId, voiceData.id, segmentId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;

        const updatedSegment = { ...segments[segmentIndex], highRisk: false };
        handleSegmentUpdate(updatedSegment, segmentIndex);
        const dispatchResponse: ParentMethodResponse = {
          type: PARENT_METHOD_TYPES.highRisk,
          payload: { segment: updatedSegment, index: segmentIndex },
        };
        setResponseToPassToEditor(dispatchResponse);
      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `submitSegmentSplitByTime - failed to split segment by time`,
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
      setHighRiskRemoveLoading(false);
    }
  };

  /**
   * Calculates start and end of the current playing word
   * - updates the state so it can be passed to the audio player
   * @params playingLocation
   */
  const buildPlayingAudioPlayerSegment = (playingLocation: SegmentAndWordIndex) => {
    const [segmentIndex, wordIndex] = playingLocation;
    if (!segments.length) return;
    const segment = segments[segmentIndex];
    const wordAlignment = segment.wordAlignments[wordIndex];
    const startTime = segment.start + wordAlignment.start;
    const endTime = startTime + wordAlignment.length;
    const time: Required<Time> = {
      start: startTime,
      end: endTime,
    };
    // setCurrentlyPlayingWordTime(time);
    const text = wordAlignment.word.replace('|', '');
    const color = theme.audioPlayer.wordRange;
    const currentPlayingWordToDisplay: WordToCreateTimeFor = {
      color,
      time,
      text,
    };
    const segmentTime: Required<Time> = {
      start: segment.start,
      end: segment.start + segment.length,
    };
    const currentPlayingSegmentToDisplay: WordToCreateTimeFor = {
      color: theme.audioPlayer.segmentRange,
      time: segmentTime,
      text: segment.transcript,
    };
    const timeData = {
      currentPlayingWordPlayerSegment: [currentPlayingWordToDisplay, currentPlayingSegmentToDisplay],
    }
    setCurrentlyPlayingWordTime(time);
    // setCurrentPlayingWordPlayerSegment([currentlyPlayingWordToDisplay, currentlyPlayingSegmentToDisplay]);
    // setPlayingTimeData(timeData);
    return timeData
  };

  /** The worker used to calculate the current playing time */
  const RemoteWorker = React.useMemo(() => {
    if (window.Worker) {
      const worker = new Worker(workerPath);
      worker.addEventListener('message', message => {
        const playingLocation: SegmentAndWordIndex | undefined = message.data.playingLocation;
        const initialSegmentLoad: boolean = message.data.initialSegmentLoad;
        // to only update if the word has changed
        // compare strings generated from the tuples because we can't compare the tuples to each other
        if (playingLocation) {
          updatePlayingLocation(playingLocation);
          setCurrentPlayingLocation(playingLocation);
        }
        if (playingLocation && (initialSegmentLoad ||
            JSON.stringify(playingLocation) !== JSON.stringify(currentPlayingLocation))) {
          const wordTime = calculateWordTime(segments, playingLocation[0], playingLocation[1]);
          let timeData = buildPlayingAudioPlayerSegment(playingLocation);
          if(timeData && wordTime) {
            const timeToSeekTo = {timeToSeekTo: wordTime}
            Object.assign(timeData, timeToSeekTo);
            // timeData.timeToSeekTo = wordTime;
            setPlayingTimeData(timeData)
          }
        }
      });
      return worker;
    };
  }, []);

  const onConfirmClick = () => {
    openConfirmDialog();
  };



  /**
   * keeps track of where the timer is
   * - used to keep track of which word is currently playing
   * - sets the segment index and word index of the currently playing word
   * @params time
   */
  const handlePlaybackTimeChange = (time: number, initialSegmentLoad = false) => {
    // prevents seeking again if we changed because of clicking a word
    const currentPlayingWordPlayerSegment = playingTimeData?.currentPlayingWordPlayerSegment;

    if (wordWasClicked) {
      wordWasClicked = false;
    } else {
      setPlaybackTime(time);
      RemoteWorker?.postMessage({ time, segments, initialSegmentLoad, currentlyPlayingWordTime });
    }
    // to allow us to continue to force seeking the same word during playback
    // setTimeToSeekTo(undefined);
    if(currentlyPlayingWordTime && currentPlayingWordPlayerSegment) {
      setPlayingTimeData({
        currentPlayingWordPlayerSegment,
        timeToSeekTo: undefined,
      })
    }
  };


  /**
   * - sets the seek time in the audio player
   * - sets the current playing location if the audio player isn't locked
   */
  const handleWordClick = (wordLocation: SegmentAndWordIndex) => {
    const [segmentIndex, wordIndex] = wordLocation;
    if (typeof segmentIndex === 'number' && typeof wordIndex === 'number') {
      wordWasClicked = true;
      const wordTime = calculateWordTime(segments, segmentIndex, wordIndex);
      let timeData = buildPlayingAudioPlayerSegment(wordLocation);
      if(timeData && wordTime) {
        const timeToSeekTo = {timeToSeekTo: wordTime}
        Object.assign(timeData, timeToSeekTo);
        setPlayingTimeData(timeData);
      }
      // setTimeToSeekTo(wordTime + SEEK_SLOP);

      if (!autoSeekLock) {
        setCurrentPlayingLocation(wordLocation);
      }
    }
  };

  const handlePlayerRendered = () => setCanPlayAudio(true);

  const handleDisabledTimesSet = (disabledTimes: Time[]) => {
    setDisabledTimes(disabledTimes);
  };

  /**
   * will be called in the editor to get the updated info
   * - used to update the attached segment data for the block
   */
  const updateEditorAfterSpeakerAssign = (updatedSegment: Segment, segmentIndex: number): ParentMethodResponse => {
    return {
      type: PARENT_METHOD_TYPES.speaker,
      payload: { segment: updatedSegment, index: segmentIndex },
    };
  };

  const handleSpeakerAssignSuccess = (updatedSegment: Segment, segmentIndex: number) => {
    const responseToPassToEditor = updateEditorAfterSpeakerAssign(updatedSegment, segmentIndex);
    setResponseToPassToEditor(responseToPassToEditor);
    handleSegmentUpdate(updatedSegment, segmentIndex);
  };

  const handleWordTimeCreationClose = () => {
    setDisabledTimes(undefined);
    setDeleteAllWordSegments(true);
    setWordsClosed(undefined);
    setSegmentIdToDelete(undefined);
    setWordToCreateTimeFor(undefined);
  };

  const handleAutoSeekToggle = (value: boolean) => setAutoSeekLock(value);

  const openSpeakerAssignDialog = (segmentIndex: number) => setSegmentIndexToAssignSpeakerTo(segmentIndex);

  const removeHighRiskFromSegment = (segmentIndex: number, segmentId: string) => removeHighRiskFlagFromSegment(segmentIndex, segmentId);

  const closeSpeakerAssignDialog = () => {
    setSegmentIndexToAssignSpeakerTo(undefined);
    const dispatchResponse: ParentMethodResponse = {
      type: PARENT_METHOD_TYPES.speakerCancel,
    };
    setResponseToPassToEditor(dispatchResponse);
  };

  const handleEditorResponseHandled = () => setResponseToPassToEditor(undefined);

  const createTimeSection = (wordToAddTimeTo: Word, wordKey: string) => {
    setWordToCreateTimeFor({ ...wordToAddTimeTo, wordKey });
  };

  const updateTimeSection = (wordToAddTimeTo: Word, wordKey: string) => {
    setWordToUpdateTimeFor({ ...wordToAddTimeTo, wordKey });
  };

  const deleteTimeSection = (wordKey: string) => {
    setSegmentIdToDelete(wordKey);
  };

  const handleCommandHandled = () => setEditorCommand(undefined);

  /**
   * to reset the value once the peaks has made the segment uneditable
   * - for when a word edit popper is closed
   */
  const handleSegmentStatusEditChange = () => setWordsClosed(undefined);

  const handleSegmentDelete = (time?: number) => {
    setSegmentIdToDelete(undefined);
    setDeleteAllWordSegments(undefined);
    if (typeof time === 'number') {
      handlePlaybackTimeChange(time);
    }
  };

  const handlePlayingAudioSegmentCreate = () => {
    const timeToSeekTo = playingTimeData?.timeToSeekTo;
    if(timeToSeekTo) {
      setPlayingTimeData({
        currentPlayingWordPlayerSegment: undefined,
        timeToSeekTo,
      })
    }
  };

  const handleAudioSegmentCreate = () => {
    setWordToCreateTimeFor(undefined);
  };

  const handleCreateSegmentSplitTimeBoundary = (segmentTimeBoundary: Required<Time>) => setSegmentSplitTimeBoundary(segmentTimeBoundary);

  const handleSegmentSplitTimeBoundaryCreated = () => setSegmentSplitTimeBoundary(undefined);

  const handleSegmentSplitTimeChanged = (time: number) => setSegmentSplitTime(time);

  const handleSegmentSplitTimeDelete = () => {
    setSegmentSplitTime(undefined);
    setSegmentSplitTimeBoundary(undefined);
  };

  const handleAudioSegmentUpdate = () => setWordToUpdateTimeFor(undefined);

  const handleSectionChange = (time: Time, wordKey: string) => {
    setTimeFromPlayer(time);
  };

  const handleSpeakersUpdate = (speakers: string[]) => {
    setSpeakers(speakers);
  };

  const onUpdateUndoRedoStack = (canUndo: boolean, canRedo: boolean) => {
    setCanUndo(canUndo);
    setCanRedo(canRedo);
  };

  const getAudioUrl = async ()=> {
    if(api?.voiceData && voiceData) {
      setVoiceDataLoading(true);
      const url = voiceData.audioUrl;
      const response = await api.voiceData.getAudio(url);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        setAudioUrl(response.url);
      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `getAudioUrl - failed to get assigned data`,
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
      setVoiceDataLoading(false);
    }
  };

  const handleEditorCommand = (command: EDITOR_CONTROLS) => {
    switch (command) {
      case EDITOR_CONTROLS.save:
        // updateSegmentOnChange(editorState, undefined, true);
        break;
      case EDITOR_CONTROLS.toggleMore:
        setShowEditorPopups(!showEditorPopups);
        break;
      case EDITOR_CONTROLS.split:
        handleSegmentSplitCommand();
        break;
      case EDITOR_CONTROLS.merge:
        handleSegmentMergeCommand();
        break;
      // case EDITOR_CONTROLS.createWord:
      //   // createWordTime(editorState);
      //   break;
      case EDITOR_CONTROLS.editSegmentTime:
        setEditorCommand(command);
        // prepareSegmentTimePicker(editorState);
        break;
      case EDITOR_CONTROLS.undo:
        setEditorCommand(command);
        // updatedEditorState = EditorState.undo(editorState);
        break;
      case EDITOR_CONTROLS.redo:
        setEditorCommand(command);
        // updatedEditorState = EditorState.redo(editorState);
        break;
      case EDITOR_CONTROLS.speaker:
        // assignSpeakerFromShortcut(editorState);
        break;
      case EDITOR_CONTROLS.shortcuts:
        setIsShortCutPageOpen(!isShortCutPageOpen);
        break;
      case EDITOR_CONTROLS.rewindAudio:
        setEditorCommand(command);
        break;
      case EDITOR_CONTROLS.forwardAudio:
        setEditorCommand(command);
        break;
      case EDITOR_CONTROLS.audioPlayPause:
        setEditorCommand(command);
        break;
      default:
        break;
    }
  };

  const resetVariables = () => {
    internalSegmentsTracker = [];
    wordWasClicked = false;
    setSegmentsLoading(true);
    setSegments([]);
    setSpeakers([]);
    setDataSets([]);
    setPlaybackTime(0);
    setCanPlayAudio(false);
    setCanUndo(false);
    setCanRedo(false);
    setCurrentPlayingLocation(STARTING_PLAYING_LOCATION);
    setPlayingTimeData({});
    setCurrentlyPlayingWordTime(undefined);
    setSegmentSplitTimeBoundary(undefined);
    handleWordTimeCreationClose();
    setNavigationProps({} as NavigationPropsToGet);
  };

  React.useEffect(() => {
    internalSegmentsTracker = segments;
  }, [segments]);

  React.useEffect(() => {
    if(voiceData && !audioUrl.length) {
      getAudioUrl();
    }
  }, [voiceData]);

  //will be called on subsequent fetches when the editor is not read only
  React.useEffect(() => {
    if (!readOnly) {
      getSegments();
    }
  }, [voiceData, projectId, readOnly]);

  // once we've loaded new segments
  React.useEffect(() => {
    // if we have loaded new voice data
    if (!voiceDataLoading && !segmentsLoading && voiceData) {
      handlePlaybackTimeChange(0, true);
    }
  }, [voiceDataLoading, segmentsLoading, voiceData]);

  // subsequent fetches
  React.useEffect(() => {
    if (!isDiff && !voiceDataLoading && !voiceData && initialFetchDone && !noRemainingContent && !noAssignedData) {
      resetVariables();
      getAssignedData();
      getDataSetsToFetchFrom();
    }
  }, [voiceData, initialFetchDone, voiceDataLoading, noRemainingContent, noAssignedData]);

  React.useEffect(() => {
    if(navigationProps) {
      setVoiceData(navigationProps.voiceData);
      setProjectId(navigationProps.projectId);
      setIsDiff(navigationProps.isDiff);
      setReadOnly(navigationProps.readOnly)
      setInitialFetchDone(true);
    }
  }, [navigationProps])

  // initial fetch and dismount logic
  React.useEffect(() => {
    setPageTitle(translate('path.editor'));
    getShortcuts();
    if (readOnly && canSeeReadOnlyEditor) {
      getSegments();
    } else if (canUseEditor && !isDiff) {
      getAssignedData();
      getDataSetsToFetchFrom();
    }
    return () => {
      resetVariables();
      if (RemoteWorker) {
        RemoteWorker.terminate();
      }
    };
  }, []);


  if (voiceDataLoading || !initialFetchDone) {
    return <SiteLoadingIndicator />;
  }

  if (!readOnly && initialFetchDone && noAssignedData && !noRemainingContent && !isDiff) {
    return <EditorFetchButton onClick={fetchMoreVoiceData} dataSets={dataSets} />;
  }

  if (!isDiff && noRemainingContent || !voiceData || !projectId) {
    return <NotFound text={translate('editor.nothingToTranscribe')} />;
  }

  // if we don't have the correct permissions
  if ((readOnly && !canSeeReadOnlyEditor) ||
      (!readOnly && !canUseEditor)) {
    return <Forbidden />;
  }

  const disabledControls = getDisabledControls(segments, canUndo, canRedo, saveSegmentsLoading, confirmSegmentsLoading);

  const editorHeight = windowSize.height && (windowSize?.height - AUDIO_PLAYER_HEIGHT);
  const editorContainerStyle: React.CSSProperties = {
    height: editorHeight,
    minHeight: 250,
  };

  return (
      <>
        {!readOnly && !isDiff && <EditorControls
            onCommandClick={handleEditorCommand}
            onConfirm={onConfirmClick}
            disabledControls={disabledControls}
            loading={saveSegmentsLoading || confirmSegmentsLoading}
            editorReady={editorReady}
            playingLocation={currentPlayingLocation}
            isSegmentUpdateError={isSegmentUpdateError}
        />}
        <Container >
          {readOnly && <StarRating
              voiceData={voiceData}
              projectId={projectId}
          />}
          <Paper
              className={classes.container}
              elevation={5}
          >
            <div style={editorContainerStyle}>
              {segmentsLoading ? <BulletList /> :
                  !!segments.length && (<Editor
                      key={voiceData.id}
                      responseFromParent={responseToPassToEditor}
                      onParentResponseHandled={handleEditorResponseHandled}
                      onCommandHandled={handleCommandHandled}
                      height={editorHeight}
                      segments={segments}
                      voiceData={voiceData}
                      onReady={setEditorReady}
                      playingLocation={currentPlayingLocation}
                      loading={saveSegmentsLoading}
                      setLoading={setSaveSegmentsLoading}
                      isAudioPlaying={isAudioPlaying}
                      editorCommand={editorCommand}
                      onSpeakersUpdate={handleSpeakersUpdate}
                      onUpdateUndoRedoStack={onUpdateUndoRedoStack}
                      onWordClick={handleWordClick}
                      handleSegmentUpdate={handleSegmentUpdate}
                      updateSegment={submitSegmentUpdate}
                      updateSegmentTime={submitSegmentTimeUpdate}
                      splitSegmentByTime={submitSegmentSplitByTime}
                      assignSpeaker={openSpeakerAssignDialog}
                      removeHighRiskFromSegment={removeHighRiskFromSegment}
                      onWordTimeCreationClose={handleWordTimeCreationClose}
                      timePickerRootProps={{
                        setDisabledTimes: handleDisabledTimesSet,
                        createTimeSection: createTimeSection,
                        updateTimeSection: updateTimeSection,
                        deleteTimeSection: deleteTimeSection,
                        timeFromPlayer: timeFromPlayer,
                      }}
                      splitTimePickerRootProps={{
                        segmentSplitTime,
                        onCreateSegmentSplitTimeBoundary: handleCreateSegmentSplitTimeBoundary,
                        onSegmentSplitTimeBoundaryCreated: handleSegmentSplitTimeBoundaryCreated,
                        onSegmentSplitTimeChanged: handleSegmentSplitTimeChanged,
                        onSegmentSplitTimeDelete: handleSegmentSplitTimeDelete,
                      }}
                  />)
              }
            </div>

            {!!voiceData.length && <ErrorBoundary
                key={voiceData.id}
                FallbackComponent={PageErrorFallback}
            >
              <AudioPlayer
                  segments={segments}
                  key={voiceData.id}
                  audioUrl={audioUrl}
                  waveformUrl={voiceData.waveformUrl}
                  editorCommand={editorCommand}
                  // timeToSeekTo={playingTimeData ? playingTimeData.timeToSeekTo : undefined}
                  disabledTimes={disabledTimes}
                  segmentIdToDelete={segmentIdToDelete}
                  onAutoSeekToggle={handleAutoSeekToggle}
                  wordsClosed={wordsClosed}
                  deleteAllWordSegments={deleteAllWordSegments}
                  onSegmentDelete={handleSegmentDelete}
                  onSegmentCreate={handleAudioSegmentCreate}
                  onSegmentUpdate={handleAudioSegmentUpdate}
                  onPlayingSegmentCreate={handlePlayingAudioSegmentCreate}
                  onSegmentStatusEditChange={handleSegmentStatusEditChange}
                  // currentPlayingWordPlayerSegment={playingTimeData ? playingTimeData.currentlyPlayingWordPlayerSegment : undefined}
                  wordToCreateTimeFor={wordToCreateTimeFor}
                  wordToUpdateTimeFor={wordToUpdateTimeFor}
                  onTimeChange={handlePlaybackTimeChange}
                  onSectionChange={handleSectionChange}
                  onReady={handlePlayerRendered}
                  segmentSplitTimeBoundary={segmentSplitTimeBoundary}
                  segmentSplitTime={segmentSplitTime}
                  onSegmentSplitTimeChanged={handleSegmentSplitTimeChanged}
                  setIsAudioPlaying={setIsAudioPlaying}
                  playingTimeData={playingTimeData}
              />
            </ErrorBoundary>}
          </Paper>
        </Container >
        <ConfirmationDialog
            titleText={`${translate('editor.confirmTranscript')}?`}
            submitText={translate('common.submit')}
            contentText={translate('editor.confirmWarning')}
            open={confirmDialogOpen}
            onSubmit={confirmData}
            onCancel={closeConfirmDialog}
        />
        <AssignSpeakerDialog
            projectId={projectId}
            dataId={voiceData.id}
            speakers={speakers}
            onSpeakersUpdate={handleSpeakersUpdate}
            segment={(segmentIndexToAssignSpeakerTo !== undefined) ? segments[segmentIndexToAssignSpeakerTo] : undefined}
            segmentIndex={segmentIndexToAssignSpeakerTo}
            open={segmentIndexToAssignSpeakerTo !== undefined}
            onClose={closeSpeakerAssignDialog}
            onSuccess={handleSpeakerAssignSuccess}
        />
        <HelperPage open={isShortCutPageOpen} onClose={() => setIsShortCutPageOpen(false)} onCommandClick={handleEditorCommand} />
      </>
  );
}