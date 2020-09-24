import {CardHeader, Container, Typography} from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
/* eslint import/no-webpack-loader-syntax: off */
// this lint rule is from create-react-app
import * as workerPath from "file-loader?name=[name].js!./workers/editor-page.worker";
import {useSnackbar, VariantType} from 'notistack';
import {BulletList} from 'react-content-loader';
import { RouteComponentProps } from "react-router";
import ErrorBoundary from 'react-error-boundary';
import React, {useGlobal} from "reactn";
import {PERMISSIONS, DEFAULT_SHORTCUTS, META_KEYS} from '../../constants';
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
  SegmentResults,
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
import {
  calculateWordTime,
  getDisabledControls,
  getNativeShortcuts,
  setSelectionRange,
  convertNonEnglishKeyToEnglish,
  getSegmentAndWordIndex,
  checkNativeShortcuts } from './helpers/editor-page.helper';
import {HelperPage} from './components/HelperPage';

const useStyles = makeStyles((theme: CustomTheme) =>
    createStyles({
      container: {
        marginTop: 25,
      },
      readOnlyHeader: {
        display: 'flex',
        flexDirection: 'row',
      }
    }),
);

/**
 * ensures that the selected word will be correctly
 * highlighted when setting the audio player seek
 * from a text input focus
 */
const STARTING_PLAYING_LOCATION: SegmentAndWordIndex = {segmentIndex: 0, wordIndex: 0};
let internalSegmentsTracker: Segment[] = [];
let internalShowEditorPopup: boolean = false;
/** used to debounce navigation when we change time after word click */
const AUDIO_PLAYER_HEIGHT = 384;
const TIME_PAGE_SIZE = 100;
const SCROLL_PAGE_SIZE = 60;
let shortcutsStack: string[] = [];
let localShortcuts: any = {};
let trackSeekToTime: boolean = false;
let trackCurrentlyPlayingWordTime: any = {};

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

interface EditorPageProps {
  mode?: string;
  modeProjectId?: string;
  voiceDataId?: string;
}

export function EditorPage({ match }: RouteComponentProps<EditorPageProps>) {
  const { translate } = React.useContext(I18nContext);
  const { mode, modeProjectId, voiceDataId } = match.params;
  const windowSize = useWindowSize();
  const api = React.useContext(ApiContext);
  const { hasPermission, roles, user } = React.useContext(KeycloakContext);
  const { enqueueSnackbar } = useSnackbar();
  const [undoRedoData, setUndoRedoData] = useGlobal('undoRedoData');
  const [showEditorPopups, setShowEditorPopups] = useGlobal('showEditorPopups');
  const [shortcuts, setShortcuts] = useGlobal<any>('shortcuts');
  const [autoSeekDisabled, setAutoSeekDisabled] = useGlobal('autoSeekDisabled');
  const [scrollToSegmentIndex, setScrollToSegmentIndex] = useGlobal('scrollToSegmentIndex');
  const [editorAutoScrollDisabled, setEditorAutoScrollDisabled] = useGlobal('editorAutoScrollDisabled');
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
  const [segmentResults, setSegmentResults] = React.useState<SegmentResults>({} as SegmentResults);
  const [prevSegmentResults, setPrevSegmentResults] = React.useState<SegmentResults | undefined>();
  const [speakers, setSpeakers] = React.useState<string[]>([]);
  const [dataSets, setDataSets] = React.useState<DataSet[]>([]);
  const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);
  const [playingTimeData, setPlayingTimeData] = React.useState<PlayingTimeData>({});
  const [audioUrl, setAudioUrl] = React.useState<string>('');
  const [isSegmentUpdateError, setIsSegmentUpdateError] = React.useState<boolean>(false);
  const [isShortCutPageOpen, setIsShortCutPageOpen] = React.useState<boolean>(false);
  const [page, setPage] = React.useState<number>(0);
  const [isLoadingAdditionalSegment, setIsLoadingAdditionalSegment] = React.useState(false);
  const [voiceData, setVoiceData] = React.useState<VoiceData | undefined>({} as VoiceData);
  const [projectId, setProjectId] = React.useState<string | undefined>(modeProjectId || '');
  const [isTimeSegment, setIsTimeSegment] = React.useState<boolean>(false);
  // get the passed info if we got here via the details page
  const [isDiff, setIsDiff] = React.useState<boolean>(mode === 'diff');
  const [readOnly, setReadOnly] = React.useState<boolean>(mode === 'readonly');
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
    internalSegmentsTracker = updatedSegments
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
        setNoRemainingContent(true);
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
    }
  };

  const getAdditionalSegments = async (page?: number, time?: number) => {
    const checkAudioPlaying = JSON.parse(JSON.stringify(isAudioPlaying))
    if (api?.voiceData && projectId && voiceData) {
      if(checkAudioPlaying) setIsAudioPlaying(false);
      const pageParam = !!time ? null : page;
      const response = await api.voiceData.getSegments(modeProjectId || projectId, voiceDataId || voiceData.id, SCROLL_PAGE_SIZE, page);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        setSegmentResults(response.data);
        // setSegments(response.data.content);
        setIsTimeSegment(false);
        internalSegmentsTracker = response.data.content;
        if(checkAudioPlaying) setIsAudioPlaying(true);
        return response?.data;
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
    }
  }

  const getTimeBasedSegment = async (time: number) => {
    if(time <=  0) return;
    setIsLoadingAdditionalSegment(true);
    const checkAudioPlaying = JSON.parse(JSON.stringify(isAudioPlaying))
    if (api?.voiceData && projectId && voiceData) {
      if(checkAudioPlaying) setIsAudioPlaying(false);
      const pageParam = !!time ? null : page;
      const response = await api.voiceData.getSegments(modeProjectId || projectId, voiceDataId || voiceData.id, TIME_PAGE_SIZE, undefined, time);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        const updateSegments = response.data;
        if(updateSegments) {
          let playingLocation: SegmentAndWordIndex = {} as SegmentAndWordIndex;
          setSegmentResults(updateSegments);
          setSegments(updateSegments.content);
          internalSegmentsTracker = updateSegments.content;
          setPrevSegmentResults({} as SegmentResults);
          setPage(updateSegments.number - 1);
          setIsTimeSegment(true);

          for(let i = 0; i < updateSegments.content.length; i++) {
            const currentSegment = updateSegments.content[i];
            const nextSegment = updateSegments.content[i + 1];

            if(i === 0 && time < currentSegment.start) {
              Object.assign(playingLocation, {segmentIndex: 0, wordIndex: 0});
            }
            if(time > currentSegment.start && time< nextSegment.start) {
              Object.assign(playingLocation, {segmentIndex: i, wordIndex: 0});
            }
          }
          handleWordClick(playingLocation, true);
        }
        internalSegmentsTracker = response.data.content;
        if(checkAudioPlaying) setIsAudioPlaying(true);
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
    }
    setTimeout(() => setIsLoadingAdditionalSegment(false), 0);
  };

  const findPlayingLocationFromAdditionalSegments = (prevSegments: SegmentResults, updateSegments: Segment[]) => {
    let playingLocation = null;
    const wordIndex = currentPlayingLocation.wordIndex;

    updateSegments.forEach((segment, index) => {
      if(segment && segment.id == segments[currentPlayingLocation.segmentIndex]['id']) {
        playingLocation =  {segmentIndex: index, wordIndex: wordIndex};
      }
    })
    if(playingLocation === null) {
      playingLocation = {segmentIndex: prevSegments.content.length - 1, wordIndex: 0};
    }
    const wordTime = calculateWordTime(updateSegments, playingLocation.segmentIndex, wordIndex);
    handleWordClick(playingLocation, true);
    setScrollToSegmentIndex(playingLocation.segmentIndex);
  };

  const getPrevSegment = async () => {
    if(!isTimeSegment && (segmentResults.first || prevSegmentResults && prevSegmentResults.first)) return;
    const prevSegment = prevSegmentResults && prevSegmentResults?.number < segmentResults?.number
        ? prevSegmentResults : segmentResults;
    const prevPage = prevSegment.number - 1;
    setIsLoadingAdditionalSegment(true);
    let additionalSegments;
    let updateSegment = [] as Segment[];

    if(isTimeSegment) {
      const firstSegmentNumber = segments[0].number
      const pageNumber = firstSegmentNumber % SCROLL_PAGE_SIZE === 0
          ? Math.floor(firstSegmentNumber / SCROLL_PAGE_SIZE) + 1 : Math.floor(firstSegmentNumber / SCROLL_PAGE_SIZE);
      const playingLocation = {segmentIndex: firstSegmentNumber % SCROLL_PAGE_SIZE, wordIndex: 0};
      additionalSegments = await getAdditionalSegments(pageNumber);
      if(additionalSegments) setSegments(additionalSegments.content);
      setPage(pageNumber);
      setPrevSegmentResults({} as SegmentResults);
      handleWordClick(playingLocation, true);
      setScrollToSegmentIndex(playingLocation.segmentIndex);
      setIsTimeSegment(false);
      if(additionalSegments) {
        updateSegment = [...additionalSegments.content];
        internalSegmentsTracker = updateSegment;
      }
    } else {
      additionalSegments = await getAdditionalSegments(prevPage);
      if(additionalSegments) {
        updateSegment = [...additionalSegments.content, ...prevSegment.content];
        setSegments(updateSegment);
        internalSegmentsTracker = updateSegment;
      }
      findPlayingLocationFromAdditionalSegments(prevSegment, updateSegment);
      setPage(prevPage);
      setPrevSegmentResults(segmentResults);
    }
    setTimeout(() => setIsLoadingAdditionalSegment(false), 0);

  };

  const getNextSegment = async () => {
    if(!isTimeSegment && segmentResults.last) return;
    const prevSegment = prevSegmentResults && prevSegmentResults?.number > segmentResults?.number ? prevSegmentResults : segmentResults;
    const nextPage = prevSegment.number + 1;
    setIsLoadingAdditionalSegment(true);

    let additionalSegments = await getAdditionalSegments(nextPage);
    let updateSegment = [] as Segment[];
    if(isTimeSegment) {
      const lastSegmentNumber = segments[segments.length - 1].number;
      const pageNumber = lastSegmentNumber % SCROLL_PAGE_SIZE === 0
          ? Math.floor(lastSegmentNumber / SCROLL_PAGE_SIZE) + 1 : Math.floor(lastSegmentNumber / SCROLL_PAGE_SIZE);
      const playingLocation = {segmentIndex: lastSegmentNumber % SCROLL_PAGE_SIZE, wordIndex: 0};
      additionalSegments = await getAdditionalSegments(pageNumber);
      if(additionalSegments) setSegments(additionalSegments.content);
      setPage(pageNumber);
      setPrevSegmentResults({} as SegmentResults);
      handleWordClick(playingLocation, true);
      setScrollToSegmentIndex(playingLocation.segmentIndex);
      setIsTimeSegment(false);
      if(additionalSegments) updateSegment = [...additionalSegments.content];
    } else {
      additionalSegments = await getAdditionalSegments(nextPage);
      if(additionalSegments) {
        updateSegment = [...prevSegment.content, ...additionalSegments.content];
        setSegments(updateSegment);
        internalSegmentsTracker = updateSegment;
      }
      findPlayingLocationFromAdditionalSegments(prevSegment, updateSegment);
      setPrevSegmentResults(segmentResults);
      setPage(nextPage);
    }
    setTimeout(() => setIsLoadingAdditionalSegment(false), 0);
  };

  const getSegments = async () => {
    if (api?.voiceData && projectId && voiceData) {
      setSegmentsLoading(true);
      const response = await api.voiceData.getSegments(
          modeProjectId || projectId,
          voiceDataId || voiceData.id,
          SCROLL_PAGE_SIZE,
          page);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        setSegmentResults(response.data);
        setSegments(response.data.content);
        internalSegmentsTracker = response.data.content;
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

  const getDataForModeEditor = async (projectId: string, voiceDataId: string) => {
    if (api?.voiceData) {
      setVoiceDataLoading(true);
      //save the options to allow us to redo a search
      // in case we delete a row and it would lead us to have no results
      const response = await api.voiceData.getSelectedVoiceData(projectId, voiceDataId);
      if (response.kind === 'ok') {
        setVoiceData(response.voiceData);
      } else {
        log({
          file: `TDP.tsx`,
          caller: `getVoiceData - failed to get voice data`,
          value: response,
          important: true,
        });
      }
      setVoiceDataLoading(false);
    }
  };

  const getShortcuts = async () => {
    if (api?.user) {
      setSegmentsLoading(true);
      const response = await api.user.getShortcuts();
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        const updateShortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
        Object.assign(updateShortcuts, response.shortcuts);
        setShortcuts(updateShortcuts);
      } else if (response.kind !== ProblemKind['bad-data']){
        log({
          file: `EditorPage.tsx`,
          caller: `getShortcuts - failed to get shortcuts`,
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
        internalSegmentsTracker = updatedSegments;
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
        internalSegmentsTracker = updatedSegments;
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
    if(!caretLocation || caretLocation.segmentIndex === 0) {
      displayMessage(translate('editor.validation.invalidMergeLocation'));
      return;
    }

    const selectedSegmentIndex = caretLocation.segmentIndex;
    if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);
      const segmentToMege = internalSegmentsTracker[selectedSegmentIndex].id;
      const segmentToMergeInto = internalSegmentsTracker[selectedSegmentIndex - 1].id;
      const response = await api.voiceData.mergeTwoSegments(projectId, voiceData.id, segmentToMergeInto, segmentToMege);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        snackbarError = undefined;
        //cut out and replace the old segments
        const mergedSegments = [...internalSegmentsTracker];
        const NUMBER_OF_MERGE_SEGMENTS_TO_REMOVE = 2;
        const newSegmentToFocus = document.getElementById(`segment-${selectedSegmentIndex - 1}`);
        mergedSegments.splice(selectedSegmentIndex - 1, NUMBER_OF_MERGE_SEGMENTS_TO_REMOVE, response.segment);
        // reset our new default baseline
        setSegments(mergedSegments);
        internalSegmentsTracker = mergedSegments;
        setIsSegmentUpdateError(false);
        onUpdateUndoRedoStack(false, false);
        newSegmentToFocus?.focus();
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
    const { segmentIndex, wordIndex } = caretLocation;

    if(typeof segmentIndex !== 'number'
        || typeof wordIndex !== 'number'
        || !caretLocation
        || !caretLocation.segmentIndex
        || !caretLocation.wordIndex) {return;}
    if(wordIndex === 0 ||
        wordIndex > segments?.[segmentIndex]?.['wordAlignments'].length - 1) {
      displayMessage(translate('editor.validation.invalidSplitLocation'));
      return;
    }

    if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);
      const response = await api.voiceData.splitSegment(projectId, voiceData.id, internalSegmentsTracker[segmentIndex].id, wordIndex);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        setIsSegmentUpdateError(false);
        //cut out and replace the old segment
        const splitSegments = [...internalSegmentsTracker];
        const [firstSegment, secondSegment] = response.segments;
        const NUMBER_OF_SPLIT_SEGMENTS_TO_REMOVE = 1;
        splitSegments.splice(caretLocation.segmentIndex, NUMBER_OF_SPLIT_SEGMENTS_TO_REMOVE, firstSegment, secondSegment);

        // reset our new default baseline
        setSegments(splitSegments);
        internalSegmentsTracker = splitSegments;
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
        internalSegmentsTracker = splitSegments;
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
    const segmentIndex = playingLocation.segmentIndex === -1 ? 0 : playingLocation.segmentIndex;
    const wordIndex = playingLocation.wordIndex === -1 ? 0 : playingLocation.wordIndex;
    if (!segments.length && !internalSegmentsTracker.length) return;
    const segment = internalSegmentsTracker[segmentIndex];
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
    trackCurrentlyPlayingWordTime = time;
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
          setCurrentPlayingLocation(playingLocation);
          if (trackSeekToTime) {
            handleWordClick(playingLocation, true);
            trackSeekToTime = false;
          } else if(initialSegmentLoad || JSON.stringify(playingLocation) !== JSON.stringify(currentPlayingLocation)) {
            const wordTime = calculateWordTime(internalSegmentsTracker, playingLocation.segmentIndex, playingLocation.wordIndex);
            let timeData = buildPlayingAudioPlayerSegment(playingLocation);

            if(timeData) setPlayingTimeData(timeData);
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
  const handlePlaybackTimeChange = (time: number, initialSegmentLoad = false, seekToTime: boolean = false) => {
    // prevents seeking again if we changed because of clicking a word
    const currentPlayingWordPlayerSegment = trackCurrentlyPlayingWordTime;
    trackSeekToTime = seekToTime;
    setPlaybackTime(time);
    RemoteWorker?.postMessage({ time, segments: internalSegmentsTracker, initialSegmentLoad, currentlyPlayingWordTime: trackCurrentlyPlayingWordTime });

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
  const handleWordClick = (wordLocation: SegmentAndWordIndex, forceClick: boolean = false) => {
    if(!forceClick && !isDiff && autoSeekDisabled) return;
    const { segmentIndex, wordIndex } = wordLocation;
    let checkAudioPlaying = JSON.parse(JSON.stringify(isAudioPlaying));

    if (typeof segmentIndex === 'number' && typeof wordIndex === 'number') {
      if(checkAudioPlaying) setIsAudioPlaying(false);

      const wordTime = calculateWordTime(internalSegmentsTracker, segmentIndex, wordIndex);
      let timeData = buildPlayingAudioPlayerSegment(wordLocation);

      if(timeData && wordTime) {
        const timeToSeekTo = {timeToSeekTo: wordTime}
        Object.assign(timeData, timeToSeekTo);
        setPlayingTimeData(timeData);
      }
      setTimeToSeekTo(wordTime);
      setCurrentPlayingLocation(wordLocation);
      setTimeout(() => {
        if(forceClick) setScrollToSegmentIndex(segmentIndex);
      }, 0)
      if(checkAudioPlaying) setIsAudioPlaying(true);
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
    handleSegmentUpdate(updatedSegment, segmentIndex);
  };

  const handleWordTimeCreationClose = () => {
    setDisabledTimes(undefined);
    setDeleteAllWordSegments(true);
    setWordsClosed(undefined);
    setSegmentIdToDelete(undefined);
    setWordToCreateTimeFor(undefined);
  };

  const openSpeakerAssignDialog = (segmentIndex: number) => setSegmentIndexToAssignSpeakerTo(segmentIndex);

  const removeHighRiskFromSegment = (segmentIndex: number, segmentId: string) => removeHighRiskFlagFromSegment(segmentIndex, segmentId);

  const closeSpeakerAssignDialog = () => {
    setSegmentIndexToAssignSpeakerTo(undefined);
    const dispatchResponse: ParentMethodResponse = {
      type: PARENT_METHOD_TYPES.speakerCancel,
    };
  };

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
      case EDITOR_CONTROLS.toggleMore:
        internalShowEditorPopup = !internalShowEditorPopup
        setShowEditorPopups(internalShowEditorPopup);
        break;
      case EDITOR_CONTROLS.split:
        handleSegmentSplitCommand();
        break;
      case EDITOR_CONTROLS.merge:
        handleSegmentMergeCommand();
        break;
      case EDITOR_CONTROLS.shortcuts:
        setIsShortCutPageOpen(!isShortCutPageOpen);
        break;
      // case EDITOR_CONTROLS.createWord:
      //   // createWordTime(editorState);
      //   break;
      case EDITOR_CONTROLS.editSegmentTime:
      case EDITOR_CONTROLS.undo:
      case EDITOR_CONTROLS.redo:
      case EDITOR_CONTROLS.speaker:
      case EDITOR_CONTROLS.save:
      case EDITOR_CONTROLS.rewindAudio:
      case EDITOR_CONTROLS.forwardAudio:
      case EDITOR_CONTROLS.audioPlayPause:
        setEditorCommand(command);
        break;
      default:
        break;
    }
  };

  const handleShortcut = (event: KeyboardEvent) => {
    const keyCombinationArray = Object.values(shortcuts);
    const functionArray = Object.keys(shortcuts);
    let resultIndex: number = -1;

    if(checkNativeShortcuts(shortcutsStack)) {return;}
    keyCombinationArray.forEach((combination: any, index: number) => {
      let matchCount = 0;
      for(let i = 0; i < shortcutsStack.length; i++) {
        if(combination.includes(shortcutsStack[i])) {
          matchCount += 1;
        } else {
          return;
        }
      }
      if (matchCount === shortcutsStack.length && matchCount === combination.length) {
        resultIndex = index;
        event.preventDefault();
        event.stopPropagation();
      }
    });
    const command = functionArray[resultIndex];

    if(!readOnly) {
      switch (command) {
        case 'confirm':
          setEditorCommand(EDITOR_CONTROLS.approvalRequest);
          break;
        case 'save':
          setEditorCommand(EDITOR_CONTROLS.save);
          break;
        case 'undo':
          setEditorCommand(EDITOR_CONTROLS.undo);
          break;
        case 'redo':
          setEditorCommand(EDITOR_CONTROLS.redo);
          break;
        case 'merge':
          handleSegmentMergeCommand();
          break;
        case 'split':
          handleSegmentSplitCommand();
          break;
        case 'toggleMore':
          setEditorCommand(EDITOR_CONTROLS.toggleMore);
          break;
        case 'editSegmentTime':
          setEditorCommand(EDITOR_CONTROLS.editSegmentTime);
          break;
        case 'setThreshold':
          setEditorCommand(EDITOR_CONTROLS.setThreshold);
          break;
        case 'shortcuts':
          setIsShortCutPageOpen(!isShortCutPageOpen);
          break;
        case 'speaker':
          setEditorCommand(EDITOR_CONTROLS.speaker);
          break;
        case 'approvalRequest':
          onConfirmClick();
          break;
      }
    }
    switch (command) {
      case 'rewindAudio':
        setEditorCommand(EDITOR_CONTROLS.rewindAudio);
        break;
      case 'forwardAudio':
        setEditorCommand(EDITOR_CONTROLS.forwardAudio);
        break;
      case 'audioPlayPause':
        setEditorCommand(EDITOR_CONTROLS.audioPlayPause);
        break;
      case 'toggleAutoSeek':
        setAutoSeekDisabled(!autoSeekDisabled);
        break;
      case 'toggleAutoScroll':
        setEditorAutoScrollDisabled(!editorAutoScrollDisabled);
        break
      case 'loop':
        setEditorCommand(EDITOR_CONTROLS.loop);
        break;
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent) => {
    handleShortcut(event.nativeEvent);
    shortcutsStack = [];
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if(event.key === 'Meta' || event.key === 'Control' || event.key === 'Shift' || event.key == 'Alt') {return;}
    const key = event.nativeEvent.code === "Space" ? "Space" : convertNonEnglishKeyToEnglish(event.key);

    if(event.metaKey) shortcutsStack.push(META_KEYS.META);
    if(event.ctrlKey) shortcutsStack.push(META_KEYS.CONTROL);
    if(event.altKey) shortcutsStack.push(META_KEYS.ALT);
    if(event.shiftKey) shortcutsStack.push(META_KEYS.SHIFT);

    shortcutsStack.push(key);

    if((event.metaKey || event.ctrlKey || event.altKey) && !checkNativeShortcuts(shortcutsStack)) {
      event.preventDefault();
    }
  };

  const resetVariables = () => {
    internalSegmentsTracker = [];
    shortcutsStack = [];
    localShortcuts = [];
    setSegmentsLoading(true);
    setSegments([]);
    internalSegmentsTracker = [];
    setSpeakers([]);
    setDataSets([]);
    setPlaybackTime(0);
    setCanPlayAudio(false);
    setCurrentPlayingLocation(STARTING_PLAYING_LOCATION);
    setPlayingTimeData({});
    setCurrentlyPlayingWordTime(undefined);
    setSegmentSplitTimeBoundary(undefined);
    handleWordTimeCreationClose();
  };

  React.useEffect(() => {
    internalSegmentsTracker = segments;
  }, [segments]);

  //will be called on subsequent fetches when the editor is not read only
  React.useEffect(() => {
    if (!isDiff && !readOnly && voiceData && projectId) {
      getAudioUrl();
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
    if (!isDiff && !readOnly && !voiceDataLoading && !voiceData && initialFetchDone && !noRemainingContent && !noAssignedData) {
      resetVariables();
      getAssignedData();
      getDataSetsToFetchFrom();
    }
    if((readOnly || isDiff) && !initialFetchDone && voiceData && Object.entries(voiceData).length !== 0) {
      getAudioUrl();
      getSegments();
      setInitialFetchDone(true);
    }
  }, [voiceData, initialFetchDone, voiceDataLoading, noRemainingContent, noAssignedData]);

  // initial fetch and dismount logic
  React.useEffect(() => {
    setPageTitle(translate('path.editor'));
    getShortcuts();
    if ((readOnly || isDiff) && projectId && voiceDataId && canSeeReadOnlyEditor) {
      if(!voiceDataLoading && !initialFetchDone) getDataForModeEditor(projectId, voiceDataId);
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

  if (canUseEditor && (voiceDataLoading || !initialFetchDone)) {
    return <SiteLoadingIndicator />;
  }

  if (!readOnly && !isDiff && initialFetchDone && noAssignedData && !noRemainingContent) {
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
      <div onKeyDown={handleKeyPress} onKeyUp={handleKeyUp}>
        {!readOnly && !isDiff && <EditorControls
            onCommandClick={handleEditorCommand}
            onConfirm={onConfirmClick}
            disabledControls={disabledControls}
            isLoadingAdditionalSegment={isLoadingAdditionalSegment}
            loading={saveSegmentsLoading || confirmSegmentsLoading}
            editorReady={editorReady}
            playingLocation={currentPlayingLocation}
            isSegmentUpdateError={isSegmentUpdateError}
            editorCommand={editorCommand}
            segments={segments}
            voiceData={voiceData}
        />}
        <Container >
          {
            readOnly && voiceData &&
                <div className={classes.readOnlyHeader}>
                  <CardHeader
                      title={<Typography variant='h4'>{voiceData.originalFilename}</Typography>}
                  />
                  <StarRating
                      voiceData={voiceData}
                      projectId={projectId}
                  />
                </div>
          }
          <Paper
              className={classes.container}
              elevation={5}
          >
            <div style={editorContainerStyle}>
              {segmentsLoading ? <BulletList /> :
                  !!segments.length && (<Editor
                      key={voiceData.id}
                      readOnly={readOnly}
                      isDiff={isDiff}
                      setIsDiff={setIsDiff}
                      onCommandHandled={handleCommandHandled}
                      height={editorHeight}
                      segments={segments}
                      voiceData={voiceData}
                      onReady={setEditorReady}
                      playingLocation={currentPlayingLocation}
                      isLoadingAdditionalSegment={isLoadingAdditionalSegment}
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
                      getNextSegment={getNextSegment}
                      getPrevSegment={getPrevSegment}
                      projectId={projectId}
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
                  disabledTimes={disabledTimes}
                  segmentIdToDelete={segmentIdToDelete}
                  wordsClosed={wordsClosed}
                  deleteAllWordSegments={deleteAllWordSegments}
                  onSegmentDelete={handleSegmentDelete}
                  onSegmentCreate={handleAudioSegmentCreate}
                  onSegmentUpdate={handleAudioSegmentUpdate}
                  onPlayingSegmentCreate={handlePlayingAudioSegmentCreate}
                  // currentPlayingWordPlayerSegment={playingTimeData ? playingTimeData.currentlyPlayingWordPlayerSegment : undefined}
                  wordToCreateTimeFor={wordToCreateTimeFor}
                  wordToUpdateTimeFor={wordToUpdateTimeFor}
                  onTimeChange={handlePlaybackTimeChange}
                  onSectionChange={handleSectionChange}
                  onReady={handlePlayerRendered}
                  segmentSplitTimeBoundary={segmentSplitTimeBoundary}
                  segmentSplitTime={segmentSplitTime}
                  onSegmentSplitTimeChanged={handleSegmentSplitTimeChanged}
                  isAudioPlaying={isAudioPlaying}
                  isLoadingAdditionalSegment={isLoadingAdditionalSegment}
                  setIsAudioPlaying={setIsAudioPlaying}
                  playingTimeData={playingTimeData}
                  getTimeBasedSegment={getTimeBasedSegment}
                  handleWordClick={handleWordClick}
                  currentPlayingLocation={currentPlayingLocation}
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
      </div>
  );
}
