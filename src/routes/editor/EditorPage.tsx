import { Container } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import { useSnackbar } from 'notistack';
import React from "react";
import { BulletList } from 'react-content-loader';
import ErrorBoundary from 'react-error-boundary';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { useWindowSize } from '../../hooks/window/useWindowSize';
import { CustomTheme } from '../../theme/index';
import { CONTENT_STATUS, ModelConfig, Segment, SegmentAndWordIndex, SnackbarError, SNACKBAR_VARIANTS, Time, VoiceData, Word, WordAlignment, WordToCreateTimeFor } from '../../types';
import log from '../../util/log/logger';
import { generateWordKeyString } from '../../util/misc';
import { AudioPlayer } from '../shared/AudioPlayer';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { NotFound } from '../shared/NotFound';
import { PageErrorFallback } from '../shared/PageErrorFallback';
import { SiteLoadingIndicator } from '../shared/SiteLoadingIndicator';
import { AssignSpeakerDialog } from './components/AssignSpeakerDialog';
import { EditorControls, EDITOR_CONTROLS } from './components/EditorControls';
import { EditorFetchButton } from './components/EditorFetchButton';
import { StarRating } from './components/StarRating';
import { Editor } from './Editor';
import { PlayingWordAndSegment } from '../../types/editor.types';


export interface ModelConfigsById {
  [x: number]: ModelConfig;
}

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    container: {
    },
  }),
);

/**
 * ensures that the selected word will be correctly
 * highlighted when setting the audio player seek 
 * from a text input focus
 */
const SEEK_SLOP = 0.00001;


export enum PARENT_METHOD_TYPES {
  speaker
}

export interface ParentMethodResponse {
  payload: {
    segment: Segment,
    index: number,
  };
  type: PARENT_METHOD_TYPES,
}

const STARTING_PLAYING_LOCATION: SegmentAndWordIndex = [0, 0];


export function EditorPage() {
  const { translate } = React.useContext(I18nContext);
  const windowSize = useWindowSize();
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();
  const [responseToPassToEditor, setResponseToPassToEditor] = React.useState<ParentMethodResponse | undefined>();
  const [canPlayAudio, setCanPlayAudio] = React.useState(false);
  const [playbackTime, setPlaybackTime] = React.useState(0);
  const [timeToSeekTo, setTimeToSeekTo] = React.useState<number | undefined>();
  const [currentPlayingLocation, setCurrentPlayingLocation] = React.useState<SegmentAndWordIndex>(STARTING_PLAYING_LOCATION);
  const [disabledTimes, setDisabledTimes] = React.useState<Time[] | undefined>();
  const [openWordKey, setOpenWordKey] = React.useState<string | undefined>();
  const [autoSeekLock, setAutoSeekLock] = React.useState(false);
  const [wordsClosed, setWordsClosed] = React.useState<boolean | undefined>();
  const [currentPlayingWordPlayerSegment, setCurrentlyPlayingWordPlayerSegment] = React.useState<PlayingWordAndSegment | undefined>();
  const [wordToCreateTimeFor, setWordToCreateTimeFor] = React.useState<WordToCreateTimeFor | undefined>();
  const [wordToUpdateTimeFor, setWordToUpdateTimeFor] = React.useState<WordToCreateTimeFor | undefined>();
  const [segmentIdToDelete, setSegmentIdToDelete] = React.useState<string | undefined>();
  const [deleteAllWordSegments, setDeleteAllWordSegments] = React.useState<boolean | undefined>();
  const [segmentIndexToAssignSpeakerTo, setSegmentIndexToAssignSpeakerTo] = React.useState<number | undefined>();
  const [wordTimeFromPlayer, setWordTimeFromPlayer] = React.useState<Time | undefined>();
  const [editorReady, setEditorReady] = React.useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [wordConfidenceThreshold, setWordConfidenceThreshold] = React.useState(0.8);
  const [editorCommand, setEditorCommand] = React.useState<EDITOR_CONTROLS | undefined>();
  const [editorOptionsVisible, setEditorOptionsVisible] = React.useState(false);
  const [debugMode, setDebugMode] = React.useState(false);
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

  const theme: CustomTheme = useTheme();
  const classes = useStyles();

  /**
   * Only `CONFIRMED` data can be rated, so we won't show if not
   */
  const alreadyConfirmed = React.useMemo(() => voiceData && voiceData.status === CONTENT_STATUS.CONFIRMED, [voiceData]);


  const openConfirmDialog = () => setConfirmDialogOpen(true);
  const closeConfirmDialog = () => setConfirmDialogOpen(false);

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
          file: `EditorPage.tsx`,
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
          file: `EditorPage.tsx`,
          caller: `fetchMoreVoiceData - failed to get voiceData`,
          value: response,
          important: true,
        });
      }
      setVoiceDataLoading(false);
      setInitialFetchDone(true);
    };
  };

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
            file: `EditorPage.tsx`,
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
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });

        // to trigger the `useEffect` to fetch more
        setVoiceData(undefined);
      } else {
        log({
          file: `EditorPage.tsx`,
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
      setConfirmSegmentsLoading(false);
    }
  };

  const submitSegmentUpdate = async (segmentId: string, wordAlignments: WordAlignment[], segmentIndex: number, onSuccess: (segment: Segment) => void) => {
    if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);
      const response = await api.voiceData.updateSegment(projectId, voiceData.id, segmentId, wordAlignments);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        const updatedSegment: Segment = { ...segments[segmentIndex], wordAlignments: [...wordAlignments] };
        const updatedSegments = [...segments];
        updatedSegments.splice(segmentIndex, 1, updatedSegment);
        setSegments(updatedSegments);
        onSuccess(updatedSegment);
      } else {
        log({
          file: `EditorPage.tsx`,
          caller: `submitSegmentUpdate - failed to update segment`,
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
      setSaveSegmentsLoading(false);
    }
  };

  const submitSegmentMerge = async (firstSegmentIndex: number, secondSegmentIndex: number, onSuccess: (segment: Segment) => void) => {
    if (api?.voiceData && projectId && voiceData && segments.length && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);

      const firstSegmentId = segments[firstSegmentIndex].id;
      const secondSegmentId = segments[secondSegmentIndex].id;

      const response = await api.voiceData.mergeTwoSegments(projectId, voiceData.id, firstSegmentId, secondSegmentId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        //cut out and replace the old segments
        const mergedSegments = [...segments];
        const NUMBER_OF_MERGE_SEGMENTS_TO_REMOVE = 2;
        mergedSegments.splice(firstSegmentIndex, NUMBER_OF_MERGE_SEGMENTS_TO_REMOVE, response.segment);
        // update the editor
        onSuccess(response.segment);
        // reset our new default baseline
        setSegments(mergedSegments);
        setInitialSegments(mergedSegments);
      } else {
        log({
          file: `EditorPage.tsx`,
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
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setSaveSegmentsLoading(false);
    }
  };

  const submitSegmentSplit = async (segmentId: string, segmentIndex: number, splitIndex: number, onSuccess: (updatedSegments: [Segment, Segment]) => void) => {
    if (api?.voiceData && projectId && voiceData && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);
      const response = await api.voiceData.splitSegment(projectId, voiceData.id, segmentId, splitIndex);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;


        //cut out and replace the old segment
        const splitSegments = [...segments];
        const [firstSegment, secondSegment] = response.segments;
        const NUMBER_OF_SPLIT_SEGMENTS_TO_REMOVE = 1;
        splitSegments.splice(segmentIndex, NUMBER_OF_SPLIT_SEGMENTS_TO_REMOVE, firstSegment, secondSegment);

        // reset our new default baseline
        setSegments(splitSegments);
        setInitialSegments(splitSegments);
        // update the editor
        onSuccess(response.segments);
      } else {
        log({
          file: `EditorPage.tsx`,
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
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setSaveSegmentsLoading(false);
    }
  };

  const onConfirmClick = () => {
    openConfirmDialog();
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
    try {
      const segment = segments[segmentIndex];
      const word = segment.wordAlignments[wordIndex];
      const segmentTime = segment.start;
      const wordTime = word.start;
      const totalTime = segmentTime + wordTime;
      return totalTime;
    } catch (error) {
      log({
        file: `EditorPage.tsx`,
        caller: `calculateWordTime - failed to calculate time`,
        value: error.toString(),
        important: true,
      });
      return 0;
    }
  };

  /**
   * Calculates start and end of the current playing word
   * - updates the state so it can be passed to the audio player
   * @params playingLocation
   */
  const buildPlayingAudioPlayerSegment = (playingLocation: SegmentAndWordIndex) => {
    const [segmentIndex, wordIndex] = playingLocation;
    const segment = segments[segmentIndex];
    const wordAlignment = segment.wordAlignments[wordIndex];
    const startTime = segment.start + wordAlignment.start;
    const endTime = startTime + wordAlignment.length;
    const time: Time = {
      start: startTime,
      end: endTime,
    };
    const text = wordAlignment.word.replace('|', '');
    const color = theme.editor.highlight;
    const currentlyPlayingWordToDisplay: WordToCreateTimeFor = {
      color,
      time,
      text,
    };
    const segmentText = segment.transcript;
    const segmentColor = theme.editor.changes;
    const segmentStartTime = segment.start;
    const segmentEndTime = segmentStartTime + segment.length;
    const segmentTime: Time = {
      start: segmentStartTime,
      end: segmentEndTime,
    };
    const currentlyPlayingSegmentToDisplay: WordToCreateTimeFor = {
      color: segmentColor,
      time: segmentTime,
      text: segmentText,
    };

    setCurrentlyPlayingWordPlayerSegment([currentlyPlayingWordToDisplay, currentlyPlayingSegmentToDisplay]);
  };

  /**
   * Calculates the segment index and word index of the current playing word
   * - updates the state so it can be passed to the editor
   * @params time
   * @returns `undefined` on error
   */
  const calculatePlayingLocation = (time: number): SegmentAndWordIndex | undefined => {
    try {
      if (isNaN(time) || !segments.length) return;
      let segmentIndex = 0;
      let wordIndex = 0;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (segment.start <= time) {
          segmentIndex = i;
        } else {
          break;
        }
      }

      const segment = segments[segmentIndex];
      if (!segment) return;
      const { wordAlignments } = segment;
      const wordTime = time - segment.start;

      for (let i = 0; i < wordAlignments.length; i++) {
        const word = wordAlignments[i];
        if (word.start <= wordTime) {
          wordIndex = i;
        } else {
          break;
        }
      }

      const playingLocation: SegmentAndWordIndex = [segmentIndex, wordIndex];

      setCurrentPlayingLocation(playingLocation);
      return playingLocation;
    } catch (error) {
      log({
        file: `EditorPage.tsx`,
        caller: `calculatePlayingLocation`,
        value: error,
        important: true,
      });
      return undefined;
    }
  };

  /**
   * keeps track of where the timer is
   * - used to keep track of which word is currently playing
   * - sets the segment index and word index of the currently playing word
   * @params time
   */
  const handlePlaybackTimeChange = (time: number, initialSegmentLoad = false) => {
    setPlaybackTime(time);
    const playingLocation = calculatePlayingLocation(time);
    // to only update if the word has changed
    // compare strings generated from the tuples because we can't compare the tuples to each other
    if (playingLocation && (initialSegmentLoad ||
      generateWordKeyString(playingLocation) !== generateWordKeyString(currentPlayingLocation))) {
      buildPlayingAudioPlayerSegment(playingLocation);
    }
    // to allow us to continue to force seeking the same word during playback
    setTimeToSeekTo(undefined);
  };

  /**
   * - sets the seek time in the audio player
   * - sets the current playing location if the audio player isn't locked
   */
  const handleWordClick = (wordLocation: SegmentAndWordIndex) => {
    const [segmentIndex, wordIndex] = wordLocation;
    if (typeof segmentIndex === 'number' && typeof wordIndex === 'number') {
      const wordTime = calculateWordTime(segmentIndex, wordIndex);
      buildPlayingAudioPlayerSegment(wordLocation);
      setTimeToSeekTo(wordTime + SEEK_SLOP);
      if (!autoSeekLock) {
        setCurrentPlayingLocation(wordLocation);
      }
    }
  };

  const handlePlayerRendered = () => setCanPlayAudio(true);

  const handleDisabledTimesSet = (disabledTimes: Time[]) => {
    setDisabledTimes(disabledTimes);
  };

  const handleSegmentUpdate = (updatedSegment: Segment, segmentIndex: number) => {
    const updatedSegments = [...segments];
    updatedSegments[segmentIndex] = updatedSegment;
    setSegments(updatedSegments);
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

  const closeSpeakerAssignDialog = () => setSegmentIndexToAssignSpeakerTo(undefined);

  const handleEditorResponseHandled = () => setResponseToPassToEditor(undefined);

  const createWordTimeSection = (wordToAddTimeTo: Word, wordKey: string) => {
    setWordToCreateTimeFor({ ...wordToAddTimeTo, wordKey });
  };

  const updateWordTimeSection = (wordToAddTimeTo: Word, wordKey: string) => {
    setWordToUpdateTimeFor({ ...wordToAddTimeTo, wordKey });
  };

  const handleCommandHandled = () => setEditorCommand(undefined);

  /**
   * to reset the value once the peaks has made the segment uneditable
   * - for when a word edit popper is closed
   */
  const handleSegmentStatusEditChange = () => setWordsClosed(undefined);

  const handleSegmentDelete = () => {
    setSegmentIdToDelete(undefined);
    setDeleteAllWordSegments(undefined);
  };

  const handlePlayingAudioSegmentCreate = () => setCurrentlyPlayingWordPlayerSegment(undefined);

  const handleAudioSegmentCreate = () => setWordToCreateTimeFor(undefined);

  const handleAudioSegmentUpdate = () => setWordToUpdateTimeFor(undefined);

  const deleteWordTimeSection = (wordKey: string) => {
    setSegmentIdToDelete(wordKey);
  };

  const handleSectionChange = (time: Time, wordKey: string) => {
    setWordTimeFromPlayer(time);
  };

  const toggleDebugMode = () => setDebugMode((prevValue) => !prevValue);


  // once we've loaded new segments
  React.useEffect(() => {
    // if we have loaded new voice data
    if (!voiceDataLoading && !segmentsLoading && voiceData) {
      handlePlaybackTimeChange(0, true);
    }
  }, [voiceDataLoading, segmentsLoading, voiceData]);

  // subsequent fetches
  React.useEffect(() => {
    if (!voiceDataLoading && !voiceData && initialFetchDone && !noRemainingContent && !noAssignedData) {
      setSegmentsLoading(true);
      setSegments([]);
      setPlaybackTime(0);
      setCanPlayAudio(false);
      setCurrentPlayingLocation(STARTING_PLAYING_LOCATION);
      setCurrentlyPlayingWordPlayerSegment(undefined);
      handleWordTimeCreationClose();
      getAssignedData();
    }
  }, [voiceData, initialFetchDone, voiceDataLoading, noRemainingContent, noAssignedData]);

  // initial fetch
  React.useEffect(() => {
    getAssignedData();
  }, []);

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

  const editorHeight = windowSize.height && (windowSize?.height - 384);

  return (
    <>
      <EditorControls
        onCommandClick={setEditorCommand}
        onConfirm={onConfirmClick}
        disabledControls={disabledControls}
        editorOptionsVisible={editorOptionsVisible}
        debugMode={debugMode}
        toggleDebugMode={toggleDebugMode}
        wordConfidenceThreshold={wordConfidenceThreshold}
        onThresholdChange={setWordConfidenceThreshold}
        loading={saveSegmentsLoading || confirmSegmentsLoading}
        editorReady={editorReady}
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
            height: editorHeight,
            minHeight: 250,
          }}>
            {segmentsLoading ? <BulletList /> :
              <Editor
                key={voiceData.id}
                responseFromParent={responseToPassToEditor}
                onParentResponseHandled={handleEditorResponseHandled}
                editorCommand={editorCommand}
                onCommandHandled={handleCommandHandled}
                height={editorHeight}
                segments={segments}
                onReady={setEditorReady}
                popupsOpen={editorOptionsVisible}
                debugMode={debugMode}
                onPopupToggle={setEditorOptionsVisible}
                wordConfidenceThreshold={wordConfidenceThreshold}
                playingLocation={currentPlayingLocation}
                loading={saveSegmentsLoading}
                onWordClick={handleWordClick}
                updateSegment={submitSegmentUpdate}
                splitSegment={submitSegmentSplit}
                mergeSegments={submitSegmentMerge}
                assignSpeaker={openSpeakerAssignDialog}
                onWordTimeCreationClose={handleWordTimeCreationClose}
                wordTimePickerProps={{
                  setDisabledTimes: handleDisabledTimesSet,
                  createWordTimeSection: createWordTimeSection,
                  updateWordTimeSection: updateWordTimeSection,
                  deleteWordTimeSection: deleteWordTimeSection,
                  wordTimeFromPlayer,
                }}
              />
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
              disabledTimes={disabledTimes}
              openWordKey={openWordKey}
              segmentIdToDelete={segmentIdToDelete}
              onAutoSeekToggle={handleAutoSeekToggle}
              wordsClosed={wordsClosed}
              deleteAllWordSegments={deleteAllWordSegments}
              onSegmentDelete={handleSegmentDelete}
              onSegmentCreate={handleAudioSegmentCreate}
              onSegmentUpdate={handleAudioSegmentUpdate}
              onPlayingSegmentCreate={handlePlayingAudioSegmentCreate}
              onSegmentStatusEditChange={handleSegmentStatusEditChange}
              currentPlayingWordPlayerSegment={currentPlayingWordPlayerSegment}
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
        titleText={`${translate('editor.confirmTranscript')}?`}
        submitText={translate('editor.confirm')}
        open={confirmDialogOpen}
        onSubmit={confirmData}
        onCancel={closeConfirmDialog}
      />
      <AssignSpeakerDialog
        projectId={projectId}
        dataId={voiceData.id}
        segment={(segmentIndexToAssignSpeakerTo !== undefined) ? segments[segmentIndexToAssignSpeakerTo] : undefined}
        segmentIndex={segmentIndexToAssignSpeakerTo}
        open={segmentIndexToAssignSpeakerTo !== undefined}
        onClose={closeSpeakerAssignDialog}
        onSuccess={handleSpeakerAssignSuccess}
      />
    </>
  );
}
