import { Button, Grid, Tooltip, Typography } from '@material-ui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Paper from '@material-ui/core/Paper';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import SvgIcon from '@material-ui/core/SvgIcon';
import CenterFocusStrongIcon from '@material-ui/icons/CenterFocusStrong';
import CenterFocusWeakIcon from '@material-ui/icons/CenterFocusWeak';
import Forward5Icon from '@material-ui/icons/Forward5';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import Replay5Icon from '@material-ui/icons/Replay5';
import StopIcon from '@material-ui/icons/Stop';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import WarningIcon from '@material-ui/icons/Warning';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import ZoomOutIcon from '@material-ui/icons/ZoomOut';
import ToggleIcon from 'material-ui-toggle-icon';
import { useSnackbar } from 'notistack';
import Peaks, { PeaksInstance, PeaksOptions, Point, PointAddOptions, Segment, SegmentAddOptions } from 'peaks.js';
import { TiArrowLoop, TiLockClosedOutline, TiLockOpenOutline } from 'react-icons/ti';
import PropagateLoader from 'react-spinners/PropagateLoader';
import ScaleLoader from 'react-spinners/ScaleLoader';
import React, { useGlobal } from 'reactn';
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import 'video.js/dist/video-js.css';
import { DEFAULT_EMPTY_TIME } from '../../constants';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../theme';
import { PLAYER_SEGMENT_IDS, Time, WAVEFORM_DOM_IDS, WordToCreateTimeFor } from '../../types';
import { PlayingWordAndSegment } from '../../types/editor.types';
import log from '../../util/log/logger';
import { formatSecondsDuration, isMacOs } from '../../util/misc';


/** total duration of the file in seconds */
let duration = 0;
/** current playback time in seconds */
let currentPlaybackTime = 0;
let playing = false;
let isReady = false;
/** the timeout used to display the streaming indicator for a minimum time */
let waitingTimeoutId: NodeJS.Timeout | undefined;
/** the interval used to get the current time */
let getTimeIntervalId: NodeJS.Timeout | undefined;
/** 
 * if there was an error in the component 
 * - lives outside the component, so it doesn't wait on state changes
 * - used for the media listeners
 */
let fatalError = false;
let mediaElement: HTMLAudioElement | null = null;
let StreamPlayer: VideoJsPlayer | undefined;
let PeaksPlayer: PeaksInstance | undefined;
let internaDisabledTimesTracker: Time[] | undefined;
let validTimeBondaries: Required<Time> | undefined;
let tempDragStartSegmentResetOptions: SegmentAddOptions | undefined;
let isLoop = false;
let disableLoop = false;

const SEGMENT_IDS_ARRAY = Object.keys(PLAYER_SEGMENT_IDS);
const DEFAULT_LOOP_LENGTH = 5;
const STARTING_WORD_LOOP_LENGTH = 0.5;
/**
 * for adding a bit of slop because `Peaks.js` does
 * not like creating segments at exactly `0`
 */
const ZERO_TIME_SLOP = 0.00001;
/** the zoom levels for the peaks */
const DEFAULT_ZOOM_LEVELS: [number, number, number] = [64, 128, 256];
const DEFAULT_CONTAINER_HEIGHT = 64;


const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    content: {
      padding: 0,
    },
    hidden: {
      visibility: 'hidden',
      height: 0,
    },
    root: {
      backgroundColor: theme.palette.background.default,
      padding: 10,
    },
    peaksContainer: {
      height: 128,
    },
    controls: {
      marginLeft: 10,
    },
    error: {
      color: theme.error,
      marginTop: 5,
    },
    zoomView: {
      "&:hover": {
        cursor: 'pointer',
      }
    },
    playbackButton: {
      width: 70,
    },
    buttonSelected: {
      backgroundColor: theme.palette.grey[300],
    },
  }),
);

interface AudioPlayerProps {
  url: string;
  timeToSeekTo?: number;
  disabledTimes?: Time[];
  segmentIdToDelete?: string;
  deleteAllWordSegments?: boolean;
  wordsClosed?: boolean;
  currentPlayingWordPlayerSegment?: PlayingWordAndSegment;
  wordToCreateTimeFor?: WordToCreateTimeFor;
  wordToUpdateTimeFor?: WordToCreateTimeFor;
  segmentSplitTimeBoundary?: Required<Time>;
  segmentSplitTime?: number;
  onSegmentSplitTimeChanged: (time: number) => void;
  onAutoSeekToggle: (value: boolean) => void;
  onTimeChange: (timeInSeconds: number) => void;
  onSectionChange: (time: Time, wordKey: string) => void;
  onSegmentDelete: () => void;
  onSegmentCreate: () => void;
  onSegmentUpdate: () => void;
  onPlayingSegmentCreate: () => void;
  onSegmentStatusEditChange: () => void;
  onReady: () => void;
}

export function AudioPlayer(props: AudioPlayerProps) {
  const {
    url,
    onTimeChange,
    onAutoSeekToggle,
    onSectionChange,
    timeToSeekTo,
    disabledTimes,
    segmentIdToDelete,
    deleteAllWordSegments,
    wordsClosed,
    currentPlayingWordPlayerSegment,
    wordToCreateTimeFor,
    wordToUpdateTimeFor,
    segmentSplitTimeBoundary,
    segmentSplitTime,
    onSegmentSplitTimeChanged,
    onSegmentDelete,
    onSegmentCreate,
    onSegmentUpdate,
    onPlayingSegmentCreate,
    onSegmentStatusEditChange,
    onReady,
  } = props;
  const { translate, osText } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [editorAutoScrollDisabled, setEditorAutoScrollDisabled] = useGlobal('editorAutoScrollDisabled');
  const [errorText, setErrorText] = React.useState('');
  const [peaksReady, setPeaksReady] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [isPlay, setIsPlay] = React.useState(false);
  const [loop, setLoop] = React.useState(false);
  const [zoomLevel, setZoomLevel] = React.useState<0 | 1 | 2 | number>(0);
  const [waiting, setWaiting] = React.useState(false);
  const [showStreamLoader, setShowStreamLoader] = React.useState(false);
  const [isMute, setIsMute] = React.useState(false);
  const [autoSeekDisabled, setAutoSeekDisabled] = React.useState(false);
  const [playbackSpeed, setPlaybackSpeed] = React.useState<0.5 | 1>(1); // 0 to 1
  // for recreating the segments after disabling a loop
  const [savedCurrentPlayingWordPlayerSegment, setSavedCurrentPlayingWordPlayerSegment] = React.useState<PlayingWordAndSegment | undefined>();
  const [currentTime, setCurrentTime] = React.useState(0);
  const [currentTimeDisplay, setCurrentTimeDisplay] = React.useState(DEFAULT_EMPTY_TIME);
  const [durationDisplay, setDurationDisplay] = React.useState(DEFAULT_EMPTY_TIME);

  const classes = useStyles();
  const theme: CustomTheme = useTheme();

  const handlePause = () => setIsPlay(false);
  const handlePlay = () => setIsPlay(true);

  //audio player root wrapper element for attaching and detaching listener for audio player
  const audioPlayerContainer = document.getElementById('audioPlayer-root-wrapper');


  React.useEffect(() => {
    currentPlaybackTime = currentTime;
  }, [currentTime]);

  React.useEffect(() => {
    playing = isPlay;
  }, [isPlay]);

  const checkIfFinished = () => {
    if (!PeaksPlayer?.player || !mediaElement) return;
    handlePause();
  };

  const toggleLockSeek = () => setAutoSeekDisabled((prevValue) => {
    onAutoSeekToggle(!prevValue);
    return !prevValue;
  });

  const toggleLockScroll = () => setEditorAutoScrollDisabled(!editorAutoScrollDisabled);

  const displayError = (errorText: string) => {
    enqueueSnackbar(errorText, { variant: 'error', preventDuplicate: true });
    setErrorText(errorText);
  };

  const handleStop = () => {
    if (!PeaksPlayer?.player || !StreamPlayer || !duration) return;
    try {
      setIsPlay(false);
      StreamPlayer.pause();
      PeaksPlayer.player.seek(0);
      setCurrentTimeDisplay(DEFAULT_EMPTY_TIME);
      if (onTimeChange && typeof onTimeChange === 'function') {
        onTimeChange(0);
      }
    } catch (error) {
      displayError(error.message);
    }
  };

  const handleError = (error: Error) => {
    displayError(error.toString());
    fatalError = true;
    log({
      file: `AudioPlayer.tsx`,
      caller: `handleError`,
      value: error,
      important: true,
    });
    log({
      file: `AudioPlayer.tsx`,
      caller: `handleError: trace`,
      value: error,
      trace: true,
    });
    handleStop();
  };

  const handlePlaying = () => {
    setWaiting(false);
    if (waitingTimeoutId === undefined) {
      setShowStreamLoader(false);
    }
    handlePlay();
  };

  const handleStreamingError = () => {
    if (mediaElement?.error instanceof Error) {
      handleError(mediaElement.error);
    }
  };

  const checkIfValidSegmentArea = (startTime: number, endTime: number) => {
    if (!validTimeBondaries) return true;
    if (validTimeBondaries.start && validTimeBondaries.end && (startTime >= validTimeBondaries.start && endTime <= validTimeBondaries.end)) {
      return true;
    }
    return false;
  };

  const seekToTime = (timeToSeekTo: number) => {
    if (!PeaksPlayer?.player || timeToSeekTo < 0) return;
    try {
      PeaksPlayer.player.seek(timeToSeekTo);
    } catch (error) {
      handleError(error);
    }
  };

  const handleStreamReady = () => {
    if (fatalError || !mediaElement) return;
    try {
      duration = PeaksPlayer?.player.getDuration() as number;
      if (isNaN(duration)) {
        duration = mediaElement.duration;
      }
      const durationString = duration.toFixed(2);
      const decimalIndex = durationString.indexOf('.');
      const decimals = durationString.substring(decimalIndex);
      const formattedDuration = formatSecondsDuration(duration);
      setDurationDisplay(formattedDuration + decimals);
      if (onReady && typeof onReady === 'function') {
        onReady();
      }
      setReady(true);
      isReady = true;
    } catch (error) {
      handleError(error);
    }
  };

  const handlePeaksReady = () => {
    if (fatalError || !PeaksPlayer?.player) return;
    setPeaksReady(true);
  };

  const handleTimeChange = (time: number) => {
    if (onTimeChange && typeof onTimeChange === 'function') {
      onTimeChange(time);
    }
  };

  const getCurrentTimeDisplay = (currentTime: number) => {
    const currentTimeString = currentTime.toFixed(2);
    const decimalIndex = currentTimeString.indexOf('.');
    const decimals = currentTimeString.substring(decimalIndex);
    const formattedCurrentTime = formatSecondsDuration(currentTime);
    return Number(currentTime) ? (formattedCurrentTime + decimals) : DEFAULT_EMPTY_TIME;
  };

  const handleAudioProcess = (currentTime?: number) => {
    if (!mediaElement || !PeaksPlayer?.player || typeof currentTime !== 'number' || !getTimeIntervalId) return;
    try {
      const currentTimeString = currentTime.toFixed(2);
      const currentTimeFixed = Number(currentTimeString);
      setCurrentTimeDisplay(getCurrentTimeDisplay(currentTime));
      setCurrentTime(currentTime);
      handleTimeChange(currentTimeFixed);
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * to get the current time quickly
   * - the `timeupdate` listener for the `HTMLAudioElement` updates too slowly. (~300-900ms)
   * - sets or clears an interval (77ms) if the we are currently playing audio
   */
  React.useEffect(() => {
    if (isPlay && !waiting) {
      getTimeIntervalId = setInterval(() => {
        handleAudioProcess(mediaElement?.currentTime);
      }, 77);
    } else {
      if (getTimeIntervalId !== undefined) {
        clearInterval(getTimeIntervalId);
        getTimeIntervalId = undefined;
      }
    }
  }, [isPlay, waiting]);

  const handleLoaded = () => {
    setWaiting(false);
  };

  function handleSeek() {
    if (!PeaksPlayer?.player || !mediaElement) return;
    try {
      const { currentTime } = mediaElement;
      if (typeof currentTime !== 'number') return;
      const currentTimeFixed = Number(currentTime.toFixed(2));
      setCurrentTimeDisplay(getCurrentTimeDisplay(currentTime));
      setCurrentTime(currentTime);
      handleTimeChange(currentTimeFixed);
    } catch (error) {
      handleError(error);
    }
  };

  function handleZoom(zoomIn = false) {
    if (!PeaksPlayer?.zoom || !peaksReady) return;
    try {
      if (zoomIn) {
        PeaksPlayer.zoom.zoomIn();
        if (zoomLevel > 0) {
          setZoomLevel(zoomLevel - 1);
        }
      } else {
        PeaksPlayer.zoom.zoomOut();
        if (zoomLevel < DEFAULT_ZOOM_LEVELS.length - 1) {
          setZoomLevel(zoomLevel + 1);
        }
      }
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * saves our current valid options to be used if  
   * we try dragging into an invalid area later on
   */
  const handleSegmentDragStart = (segment: Segment) => {
    tempDragStartSegmentResetOptions = {
      startTime: segment.startTime,
      endTime: segment.endTime,
      id: segment.id,
      editable: segment.editable,
      color: segment.color,
      labelText: segment.labelText,
    };
  };

  const handleSegmentExit = (segment: Segment) => {
    const { id, startTime, endTime, editable } = segment;
    switch (id) {
      case PLAYER_SEGMENT_IDS.SEGMENT:
      case PLAYER_SEGMENT_IDS.WORD:
        break;
      case PLAYER_SEGMENT_IDS.LOOP:
      case PLAYER_SEGMENT_IDS.SEGMENT_EDIT:
        // referencing the media element to get most up-to-date state
        if (mediaElement && !mediaElement.paused && mediaElement.currentTime > endTime) {
          seekToTime(startTime);
        }
        break;
      default:
        break;
    }
  };

  const handleSegmentEnter = (segment: Segment) => {
    const { id, endTime } = segment;
    switch (id) {
      case PLAYER_SEGMENT_IDS.DISABLED_0:
        seekToTime(endTime);
        break;
      case PLAYER_SEGMENT_IDS.DISABLED_1:
        if (internaDisabledTimesTracker && internaDisabledTimesTracker[0]?.end) {
          seekToTime(internaDisabledTimesTracker[0].end);
        }
        break;
      default:
        break;
    }
  };

  const handleSegmentChangeEnd = (segment: Segment) => {
    const { id, startTime, endTime } = segment;
    const time: Required<Time> = {
      start: startTime,
      end: endTime,
    };
    const isValidSection = checkIfValidSegmentArea(startTime, endTime);
    switch (id) {
      case PLAYER_SEGMENT_IDS.LOOP:
        validTimeBondaries = time;
        break;
      case PLAYER_SEGMENT_IDS.DISABLED_0:
      case PLAYER_SEGMENT_IDS.DISABLED_1:
        break;
      default:
        if (id && isValidSection) {
          onSectionChange(time, id);
          // to handle resetting the segment to the last valid
          // options if we are trying to put it in an invalid area
        } else if (id &&
          !isValidSection &&
          tempDragStartSegmentResetOptions &&
          PeaksPlayer?.segments &&
          typeof validTimeBondaries?.start === 'number' &&
          typeof validTimeBondaries?.end === 'number') {
          // to reset to the valid limits if dragged outside the valid range
          if (startTime < validTimeBondaries.start) {
            tempDragStartSegmentResetOptions.startTime = validTimeBondaries.start;
          }
          if (endTime > validTimeBondaries.end) {
            tempDragStartSegmentResetOptions.endTime = validTimeBondaries.end;
          }
          PeaksPlayer.segments.removeById(id);
          PeaksPlayer.segments.add(tempDragStartSegmentResetOptions);
        }
        // reset our pre-drag options
        tempDragStartSegmentResetOptions = undefined;
        break;
    }
  };

  const handlePointEnter = (point: Point) => {
    const { id } = point;
    switch (id) {
      case PLAYER_SEGMENT_IDS.SEGMENT_SPLIT:
        if (validTimeBondaries?.start) {
          seekToTime(validTimeBondaries.start);
        }
        break;
      default:
        break;
    }
  };

  const handlePointChangeEnd = (point: Point) => {
    const { id, time } = point;
    onSegmentSplitTimeChanged(time);
    switch (id) {
      case PLAYER_SEGMENT_IDS.SEGMENT_SPLIT:
        onSegmentSplitTimeChanged(time);
        break;
      default:
        break;
    }
  };

  /**
   * toggle player state via the `VideoJsPlayer`
   * - toggleing via other methods does not resume play
   * when the player is stuck when buffering
   */
  const handlePlayPause = () => {
    if (!PeaksPlayer?.player || !StreamPlayer || !duration) return;
    try {
      if (playing) {
        StreamPlayer.pause();
      } else {
        StreamPlayer.play();
      }
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * display a loading indicator when the player is waiting
   * - using a timeout to prevent flicker by displaying the indicator for a minimum of 400ms
   * - attempts to prevent stuck buffering state by triggering 
   * pause and play after the initial timeout is cleared
   */
  function handleWaiting() {
    setWaiting(true);
    setShowStreamLoader(true);
    waitingTimeoutId = setTimeout(() => {
      if (waitingTimeoutId !== undefined) {
        clearTimeout(waitingTimeoutId);
        waitingTimeoutId = undefined;
        handlePlayPause();
        setTimeout(() => {
          handlePlayPause();
        }, 10);
      }
      if (!waiting) {
        setShowStreamLoader(false);
      }
    }, 400);
  }

  const handleSkip = (rewind = false) => {
    if (!duration) return;
    const interval = rewind ? -5 : 5;
    let timeToSeekTo = currentPlaybackTime + interval;
    if (timeToSeekTo < 0) {
      timeToSeekTo = 0;
    } else if (timeToSeekTo > duration) {
      timeToSeekTo = duration;
    }
    seekToTime(timeToSeekTo);
  };

  const togglePlaybackSpeed = () => {
    if (!StreamPlayer) return;
    try {
      const speed = playbackSpeed === 1 ? 0.5 : 1;
      StreamPlayer.playbackRate(speed);
      setPlaybackSpeed(speed);
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Toggle mute on the HTMLAudioElement
   */
  const toggleMute = () => {
    if (!PeaksPlayer?.player || !mediaElement || !StreamPlayer) return;
    try {
      mediaElement.muted = !isMute;
      setIsMute(!isMute);
    } catch (error) {
      handleError(error);
    }
  };

  const createSegment = (segmentToAdd: SegmentAddOptions, isDisabledSegment = false) => {
    if (!PeaksPlayer?.segments) return;
    try {
      const isEditingSegmentTime = segmentToAdd.id === PLAYER_SEGMENT_IDS.SEGMENT_EDIT;
      const existingSegments = PeaksPlayer.segments.getSegments();
      const updatedSegments: SegmentAddOptions[] = [];
      for (let i = 0; i < existingSegments.length; i++) {
        const segment = existingSegments[i];
        const updatedSegment = {
          startTime: segment.startTime,
          endTime: segment.endTime,
          id: segment.id,
          color: segment.color,
          labelText: segment.labelText,
          editable: false,
        } as SegmentAddOptions;
        if (!isEditingSegmentTime) {
          updatedSegments.push(updatedSegment);
        } else if (segment.id !== PLAYER_SEGMENT_IDS.LOOP) {
          updatedSegments.push(updatedSegment);
        }
      }
      updatedSegments.push(segmentToAdd);
      PeaksPlayer.segments.removeAll();
      PeaksPlayer.segments.add(updatedSegments);
      if (segmentToAdd.id) {
        const time: Time = {
          start: segmentToAdd.startTime,
          end: segmentToAdd.endTime,
        };
        if (!isDisabledSegment) {
          onSectionChange(time, segmentToAdd.id);
        }
      }
      if (!isDisabledSegment || isEditingSegmentTime) {
        onSegmentCreate();
        seekToTime(segmentToAdd.startTime);
      }
      // turn off loop
      isLoop = false;
      setLoop(false);
      if (isEditingSegmentTime) {
        disableLoop = true;
      }
    } catch (error) {
      handleError(error);
    }
  };

  const createPlaybackSegments = (currentPlayingWordSegment: SegmentAddOptions, currentPlayingSegmentSegment: SegmentAddOptions) => {
    if (!PeaksPlayer?.segments) return;
    try {
      const existingSegments = PeaksPlayer.segments.getSegments();
      let wordPlaybackSegmentExists = false;
      let segmentPlaybackSegmentExists = false;
      let segmentPlaybackNotChanged = false;
      const updatedSegments = existingSegments.map((segment) => {
        const isWordMatch = segment.id === PLAYER_SEGMENT_IDS.WORD;
        const isSegmentMatch = segment.id === PLAYER_SEGMENT_IDS.SEGMENT;
        if (isWordMatch) {
          wordPlaybackSegmentExists = true;
          return currentPlayingWordSegment;
        }
        if (isSegmentMatch) {
          segmentPlaybackSegmentExists = true;
          if (segment.startTime === currentPlayingSegmentSegment.startTime &&
            segment.endTime === currentPlayingSegmentSegment.endTime) {
            segmentPlaybackNotChanged = true;
          } else {
            return currentPlayingSegmentSegment;
          }
        }
        const segmentOptions: SegmentAddOptions = {
          startTime: segment.startTime,
          endTime: segment.endTime,
          id: segment.id,
          color: segment.color,
          labelText: segment.labelText,
          editable: segment.editable,
        };
        return segmentOptions;
      });
      if (!segmentPlaybackSegmentExists) {
        updatedSegments.push(currentPlayingSegmentSegment);
      }
      if (!wordPlaybackSegmentExists) {
        updatedSegments.push(currentPlayingWordSegment);
      }
      if (segmentPlaybackNotChanged) {
        PeaksPlayer.segments.removeById(PLAYER_SEGMENT_IDS.WORD);
        PeaksPlayer.segments.add(currentPlayingWordSegment);
      } else {
        PeaksPlayer.segments.removeAll();
        PeaksPlayer.segments.add(updatedSegments);
      }
      onPlayingSegmentCreate();
    } catch (error) {
      handleError(error);
    }
  };

  const parseCurrentlyPlayingWordSegment = (segmentInfoToUse?: PlayingWordAndSegment) => {
    if (!segmentInfoToUse) {
      segmentInfoToUse = currentPlayingWordPlayerSegment;
    }
    if (segmentInfoToUse !== undefined) {
      setSavedCurrentPlayingWordPlayerSegment(segmentInfoToUse);
      const [wordInfo, segmentInfo] = segmentInfoToUse;
      if (typeof wordInfo.time?.start !== 'number' ||
        typeof wordInfo.time?.end !== 'number' ||
        typeof segmentInfo.time?.start !== 'number' ||
        typeof segmentInfo.time?.end !== 'number'
      ) {
        return;
      }
      // adding a bit of slop because `Peaks.js` does not 
      // like creating segments at exactly `0`
      let startTime = wordInfo.time.start;
      if (startTime === 0) {
        startTime = startTime + ZERO_TIME_SLOP;
      }
      let endTime = wordInfo.time.end;
      if (endTime > duration && duration > 0) {
        endTime = duration;
      }
      let segmentStartTime = segmentInfo.time.start;
      if (segmentStartTime === 0) {
        segmentStartTime = segmentStartTime + ZERO_TIME_SLOP;
      }
      let segmentEndTime = segmentInfo.time.end;
      if (segmentEndTime > duration && duration > 0) {
        segmentEndTime = duration;
      }
      if (endTime > startTime && segmentEndTime > segmentStartTime) {
        const segmentsSameLength = endTime === segmentEndTime && startTime === segmentStartTime;
        const wordSegmentToAdd: SegmentAddOptions = {
          startTime,
          endTime,
          editable: false,
          // to simulate the word segment not existing
          color: segmentsSameLength ? segmentInfo.color : wordInfo.color,
          id: PLAYER_SEGMENT_IDS.WORD,
          labelText: wordInfo.text,
        };
        const segmentSegmentToAdd: SegmentAddOptions = {
          startTime: segmentStartTime,
          endTime: segmentEndTime,
          editable: false,
          color: segmentInfo.color,
          id: PLAYER_SEGMENT_IDS.SEGMENT,
          labelText: segmentInfo.text,
        };
        createPlaybackSegments(wordSegmentToAdd, segmentSegmentToAdd);
      }
    }
  };

  /**
   * creates or removes the loop segment
   */
  function handleLoopClick() {
    if (disableLoop ||
      !PeaksPlayer?.segments ||
      !peaksReady ||
      !duration ||
      !mediaElement ||
      !StreamPlayer ||
      (internaDisabledTimesTracker && internaDisabledTimesTracker.length)
    ) return;
    try {
      const loopSegment = PeaksPlayer.segments.getSegment(PLAYER_SEGMENT_IDS.LOOP);
      if (isLoop) {
        PeaksPlayer.segments.removeById(PLAYER_SEGMENT_IDS.LOOP);
        setLoop(false);
        parseCurrentlyPlayingWordSegment(savedCurrentPlayingWordPlayerSegment);
      } else if (!loopSegment) {
        const color = theme.audioPlayer.loop;
        let startTime = currentTime;
        let endTime = startTime + DEFAULT_LOOP_LENGTH;
        if (endTime > duration) {
          endTime = duration;
          startTime = endTime - DEFAULT_LOOP_LENGTH;
          if (startTime < 0) {
            startTime = 0;
          }
        }
        const segmentOptions: SegmentAddOptions = {
          startTime,
          endTime,
          editable: true,
          id: PLAYER_SEGMENT_IDS.LOOP,
          color,
        };
        // only have the loop segment visible
        PeaksPlayer.segments.removeAll();
        PeaksPlayer.segments.add(segmentOptions);
        setLoop(true);
      }
      isLoop = !isLoop;
    } catch (error) {
      handleError(error);
    }
  };

  const updateSegmentTime = (updateSegmentId: string, start: number, end: number) => {
    if (!PeaksPlayer?.segments || typeof end !== 'number') return;
    try {
      if (start < 0) {
        start = 0;
      }
      if (end > duration) {
        end = duration;
      }
      const existingSegments = PeaksPlayer.segments.getSegments();
      const updatedSegments = existingSegments.map((segment) => {
        const isMatch = segment.id === updateSegmentId;
        let startTime = segment.startTime;
        let endTime = segment.endTime;
        if (isMatch) {
          startTime = start;
          endTime = end;
        }
        const segmentOptions: SegmentAddOptions = {
          startTime,
          endTime,
          id: segment.id,
          color: segment.color,
          labelText: segment.labelText,
          editable: isMatch,
        };
        return segmentOptions;
      });
      PeaksPlayer.segments.removeAll();
      PeaksPlayer.segments.add(updatedSegments);
      const updatedTime: Time = {
        start,
        end,
      };
      if (!SEGMENT_IDS_ARRAY.includes(updateSegmentId)) {
        onSectionChange(updatedTime, updateSegmentId);
        onSegmentUpdate();
      }
    } catch (error) {
      handleError(error);
    }
  };

  const deleteAllPoints = () => {
    if (!PeaksPlayer?.points) return;
    PeaksPlayer.points.removeAll();
  };

  const createPoint = (pointTime: number) => {
    if (!PeaksPlayer?.points || typeof pointTime !== 'number') return;
    try {
      const pointOptions: PointAddOptions = {
        id: PLAYER_SEGMENT_IDS.SEGMENT_SPLIT,
        editable: true,
        time: pointTime,
        labelText: '',
        color: theme.audioPlayer.loop,
      };
      PeaksPlayer.points.removeAll();
      PeaksPlayer.points.add(pointOptions);
      onSegmentSplitTimeChanged(pointTime);
    } catch (error) {
      handleError(error);
    }
  };

  const makeAllSegmentsUneditable = () => {
    if (!PeaksPlayer?.segments) return;
    try {
      const existingSegments = PeaksPlayer.segments.getSegments();
      const updatedSegments = existingSegments.map((segment) => {
        const segmentOptions: SegmentAddOptions = {
          startTime: segment.startTime,
          endTime: segment.endTime,
          id: segment.id,
          color: segment.color,
          labelText: segment.labelText,
          editable: false,
        };
        return segmentOptions;
      });
      PeaksPlayer.segments.removeAll();
      PeaksPlayer.segments.add(updatedSegments);
    } catch (error) {
      handleError(error);
    }
  };

  const deleteSegment = (segmentIdToDelete: string) => {
    if (!PeaksPlayer?.segments) return;
    try {
      if (segmentIdToDelete === PLAYER_SEGMENT_IDS.SEGMENT_EDIT) {
        disableLoop = false;
      }
      PeaksPlayer.segments.removeById(segmentIdToDelete);
      onSegmentDelete();
    } catch (error) {
      handleError(error);
    }
  };

  const deleteAllSegments = () => {
    if (!PeaksPlayer?.segments) return;
    try {
      const loopSegment = PeaksPlayer.segments.getSegment(PLAYER_SEGMENT_IDS.LOOP);
      PeaksPlayer.segments.removeAll();
      if (loopSegment) {
        const loopSegmentOptions: SegmentAddOptions = {
          startTime: loopSegment.startTime,
          endTime: loopSegment.endTime,
          id: loopSegment.id,
          color: loopSegment.color,
          labelText: loopSegment.labelText,
          editable: isLoop,
        };
        PeaksPlayer.segments.add(loopSegmentOptions);
      }
      // reset internal trackers
      internaDisabledTimesTracker = undefined;
      validTimeBondaries = undefined;
      disableLoop = false;
      onSegmentDelete();
    } catch (error) {
      handleError(error);
    }
  };

  // once everything is ready
  React.useEffect(() => {
    if (duration > 0 && ready) {
      parseCurrentlyPlayingWordSegment();
    }
  }, [duration, ready]);

  // set the seek location based on the parent
  React.useEffect(() => {
    if (typeof timeToSeekTo === 'number' && !autoSeekDisabled) {
      seekToTime(timeToSeekTo);
    }
  }, [timeToSeekTo]);

  // delete a word segment based on the parent
  React.useEffect(() => {
    if (typeof segmentIdToDelete === 'string') {
      deleteSegment(segmentIdToDelete);
    }
  }, [segmentIdToDelete]);

  // delete all word segments
  React.useEffect(() => {
    if (deleteAllWordSegments === true) {
      deleteAllSegments();
    }
  }, [deleteAllWordSegments]);

  // make all segments uneditable when all words are closed
  React.useEffect(() => {
    if (wordsClosed === true) {
      makeAllSegmentsUneditable();
    }
  }, [wordsClosed]);

  // to set zones outside of the current custom edit segment that are disabled
  React.useEffect(() => {
    internaDisabledTimesTracker = disabledTimes;
    if (disabledTimes instanceof Array) {
      // to calculate the valid time bondaries
      if (disabledTimes.length > 1) {
        validTimeBondaries = {
          start: disabledTimes[0].end as number,
          end: disabledTimes[1].start as number,
        };
        // the valid segment is the last one
      } else if (disabledTimes[0].start === 0) {
        validTimeBondaries = {
          start: disabledTimes[0].end as number,
          end: duration,
        };
        // to ensure that the end time is always gerater than the start time
        if (validTimeBondaries.start &&
          validTimeBondaries.end &&
          validTimeBondaries.start > validTimeBondaries.end) {
          validTimeBondaries.end = validTimeBondaries.start + 0.5;
        }
        // the valid segment is the first one
      } else {
        validTimeBondaries = {
          start: 0 + ZERO_TIME_SLOP,
          end: disabledTimes[0].start as number,
        };
      }
      disabledTimes.forEach((disabledTime: Time, index) => {
        const startTime = disabledTime.start as number;
        let endTime = disabledTime.end;
        // if it's the second disabled boundary
        if (typeof endTime !== 'number' && duration) {
          endTime = duration;
        }
        if (typeof startTime === 'number' && typeof endTime === 'number' && endTime > startTime) {
          const color = theme.audioPlayer.disabled;
          const disabledSegment: SegmentAddOptions = {
            startTime,
            endTime,
            editable: false,
            color,
            id: index ? PLAYER_SEGMENT_IDS.DISABLED_1 : PLAYER_SEGMENT_IDS.DISABLED_0,
          };
          createSegment(disabledSegment, true);
        }
      });
    }
  }, [disabledTimes]);

  // set the create a time segment for a word
  React.useEffect(() => {
    if (wordToCreateTimeFor !== undefined) {
      const { time } = wordToCreateTimeFor;
      if (typeof time?.start !== 'number') {
        return;
      }
      // adding a bit of slop because `Peaks.js` does not 
      // like creating segments at exactly `0`
      let startTime = time.start;
      if (startTime === 0) {
        startTime = startTime + ZERO_TIME_SLOP;
      }
      let endTime = time?.end as number;
      if (typeof endTime !== 'number') {
        endTime = time.start + STARTING_WORD_LOOP_LENGTH;
      }
      if (endTime > duration) {
        endTime = duration;
      }
      if (endTime > startTime) {
        const { color } = wordToCreateTimeFor;
        const segmentToAdd: SegmentAddOptions = {
          startTime,
          endTime,
          editable: true,
          color,
          id: wordToCreateTimeFor.wordKey,
          labelText: wordToCreateTimeFor.text,
        };
        createSegment(segmentToAdd);
      }
    }
  }, [wordToCreateTimeFor]);

  // set the time segment for the currently playing word
  React.useEffect(() => {
    // don't update playing segments if the loop is active or when it should be disabled
    if (!isLoop && !disableLoop) {
      parseCurrentlyPlayingWordSegment();
    }
  }, [currentPlayingWordPlayerSegment]);

  // set the update the time for a segment
  React.useEffect(() => {
    if (wordToUpdateTimeFor !== undefined) {
      const { wordKey, time } = wordToUpdateTimeFor;
      if (typeof time?.start !== 'number' || typeof time?.end !== 'number') {
        return;
      }
      let { start, end } = time;
      const isValidTime = checkIfValidSegmentArea(start, end);
      if (isValidTime) {
        if (start === 0) {
          start = start + ZERO_TIME_SLOP;
        }
        updateSegmentTime(wordKey as string, start, end);
      } else if (typeof validTimeBondaries?.start === 'number' &&
        typeof validTimeBondaries?.end === 'number') {
        // to reset to the valid limits if outside the valid range
        if (start < validTimeBondaries.start) {
          start = validTimeBondaries.start;
        }
        if (end > validTimeBondaries.end) {
          end = validTimeBondaries.end;
        }
        updateSegmentTime(wordKey as string, start, end);
      }
    }
  }, [wordToUpdateTimeFor]);

  // update a the for segment split time select
  React.useEffect(() => {
    if (segmentSplitTime !== undefined) {
      createPoint(segmentSplitTime);
    } else {
      deleteAllPoints();
    }
  }, [segmentSplitTime]);

  // create a point for segment split time select and set the valid segment times
  React.useEffect(() => {
    if (segmentSplitTimeBoundary !== undefined) {
      if (typeof segmentSplitTimeBoundary?.start !== 'number' || typeof segmentSplitTimeBoundary?.end !== 'number') {
        return;
      }
      let { start } = segmentSplitTimeBoundary;
      const { end } = segmentSplitTimeBoundary;
      const length = end - start;
      const midpointTime = start + (length / 2);
      if (start === 0) {
        start = start + ZERO_TIME_SLOP;
      }
      validTimeBondaries = {
        start,
        end,
      };
      createPoint(midpointTime);
      seekToTime(start);
    } else {
      deleteAllPoints();
      validTimeBondaries = undefined;
    }
  }, [segmentSplitTimeBoundary]);

  // initial mount and unmount logic
  React.useEffect(() => {
    /**
     * handle shortcut key presses
     */
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isReady) return;
      const keyName = isMacOs() ? 'metaKey' : 'ctrlKey';
      const { key, shiftKey } = event;
      switch (key) {
        case 'a':
          if (event[keyName] && shiftKey) {
            event.preventDefault();
            handleSkip(true);
          }
          break;
        case 'd':
          if (event[keyName] && shiftKey) {
            event.preventDefault();
            handleSkip();
          }
          break;
        case 's':
          if (event[keyName] && shiftKey) {
            event.preventDefault();
            handlePlayPause();
          }
          break;
      }
    };
    /**
     * start playing on double click
     * - there is no easy way to prevent selecting text
     * on doubleclick, so we will immediately remove the selection
     */
    const handleDoubleClick = (event: MouseEvent) => {
      if (!isReady) return;

      event.preventDefault();
      event.stopPropagation();
      window.getSelection()?.empty();
      if (!playing) {
        handlePlayPause();
      }
    };

    mediaElement = document.querySelector('audio') as HTMLAudioElement;
    mediaElement?.addEventListener('loadstart', handleWaiting);
    mediaElement?.addEventListener('waiting', handleWaiting);
    mediaElement?.addEventListener('canplay', handleStreamReady);
    mediaElement?.addEventListener('loadeddata', handleLoaded);
    mediaElement?.addEventListener('pause', checkIfFinished);
    mediaElement?.addEventListener('seeked', handleSeek);
    mediaElement?.addEventListener('playing', handlePlaying);
    mediaElement?.addEventListener('error', handleStreamingError);

    const peaksJsInit = () => {
      const options: PeaksOptions = {
        containers: {
          zoomview: document.getElementById(WAVEFORM_DOM_IDS['zoomview-container']) as HTMLElement,
          overview: document.getElementById(WAVEFORM_DOM_IDS['overview-container']) as HTMLElement,
        },
        mediaElement: mediaElement as HTMLAudioElement,
        dataUri: {
          json: `${url}.json`,
        },
        withCredentials: false,
        logger: console.error.bind(console),
        emitCueEvents: true,
        height: DEFAULT_CONTAINER_HEIGHT,
        zoomLevels: DEFAULT_ZOOM_LEVELS,
        keyboard: false,
        nudgeIncrement: 0.01,
        zoomWaveformColor: theme.header.lightBlue,
        overviewWaveformColor: theme.audioPlayer.waveform,
        playheadColor: theme.audioPlayer.playhead,
        playheadTextColor: theme.audioPlayer.playhead,
        showPlayheadTime: false,
        pointMarkerColor: theme.audioPlayer.playhead,
        axisGridlineColor: theme.audioPlayer.grid,
        axisLabelColor: theme.audioPlayer.grid,
      };

          PeaksPlayer = Peaks.init(options, function (error, peaksInstance) {
        setReady(!error);
        if (error) {
          handleError(error);
        }
      });
      PeaksPlayer.on('peaks.ready', handlePeaksReady);
      PeaksPlayer.on('segments.exit', handleSegmentExit);
      PeaksPlayer.on('segments.enter', handleSegmentEnter);
      PeaksPlayer.on('segments.dragstart', handleSegmentDragStart);
      PeaksPlayer.on('segments.dragend', handleSegmentChangeEnd);
      PeaksPlayer.on('points.enter', handlePointEnter);
      PeaksPlayer.on('points.dragend', handlePointChangeEnd);
      document.addEventListener('keydown', handleKeyPress);
      audioPlayerContainer?.addEventListener('dblclick', handleDoubleClick);
    };

    const initPlayer = () => {
      const options: VideoJsPlayerOptions = {
        controls: false,
        autoplay: false,
        fluid: false,
        loop: false,
        width: 0,
        height: 0,
      };
      StreamPlayer = videojs(WAVEFORM_DOM_IDS['audio-container'], options) as VideoJsPlayer;
      // load the content once ready
      StreamPlayer.on('ready', function (error) {
        if (StreamPlayer) {
          StreamPlayer?.src({
            src: url,
          });
          // load the waveform once ready
          peaksJsInit();
        }
      });
    };

    // only initialize if we have a valid url
    if (url) {
      initPlayer();
    }

    // to clear the component on unmount
    return () => {
      try {
        if (getTimeIntervalId) {
          clearTimeout(getTimeIntervalId);
        }
        if (waitingTimeoutId) {
          clearTimeout(waitingTimeoutId);
        }
        if (PeaksPlayer) {
          PeaksPlayer.destroy();
        }
        if (StreamPlayer) {
          StreamPlayer.dispose();
        }
        if (mediaElement) {
          mediaElement.removeEventListener('loadstart', handleWaiting);
          mediaElement.removeEventListener('waiting', handleWaiting);
          mediaElement.removeEventListener('canplay', handleStreamReady);
          mediaElement.removeEventListener('loadeddata', handleLoaded);
          mediaElement.removeEventListener('pause', checkIfFinished);
          mediaElement.removeEventListener('seeked', handleSeek);
          mediaElement.removeEventListener('playing', handlePlaying);
          mediaElement.removeEventListener('error', handleStreamingError);
        }
        document.removeEventListener('keydown', handleKeyPress);
        audioPlayerContainer?.removeEventListener('dblclick', handleDoubleClick);
      } catch (error) {
        log({
          file: `AudioPlayer.tsx`,
          caller: `ERROR DURING UNMOUNT:`,
          value: error,
          important: true,
        });
      }
      setEditorAutoScrollDisabled(false);
      duration = 0;
      currentPlaybackTime = 0;
      playing = false;
      isReady = false;
      waitingTimeoutId = undefined;
      getTimeIntervalId = undefined;
      fatalError = false;
      isLoop = false;
      mediaElement = null;
      StreamPlayer = undefined;
      PeaksPlayer = undefined;
      internaDisabledTimesTracker = undefined;
      validTimeBondaries = undefined;
      tempDragStartSegmentResetOptions = undefined;
    };
  }, []);

  const renderControlWithTooltip = (text: string, button: JSX.Element) => {
    if (button.props.disabled) {
      return button;
    }
    return <Tooltip
      placement='top'
      title={<Typography variant={'h6'} >{text}</Typography>}
      arrow={true}
    >
      {button}
    </Tooltip >;
  };

  const playerControls = (<ButtonGroup size='large' variant='outlined' aria-label="audio player controls">
    {renderControlWithTooltip(osText('rewind'),
      <Button aria-label="rewind-5s" onClick={() => handleSkip(true)} >
        <Replay5Icon />
      </Button>
    )}
    <Button aria-label="stop" onClick={handleStop} >
      <StopIcon />
    </Button>
    {renderControlWithTooltip(osText('playPause'),
      <Button aria-label="play/pause" onClick={handlePlayPause} >
        {isPlay ? <PauseIcon /> : <PlayArrowIcon />}
      </Button>
    )}
    {renderControlWithTooltip(osText('forward'),
      <Button aria-label="forward-5s" onClick={() => handleSkip()} >
        <Forward5Icon />
      </Button>
    )}
  </ButtonGroup>);

  const secondaryControls = (<ButtonGroup size='large' variant='outlined' aria-label="secondary controls">
    {renderControlWithTooltip(translate('audioPlayer.zoomIn'),
      <Button
        aria-label="zoom-in"
        onClick={() => handleZoom(true)}
        disabled={zoomLevel === 0}
      >
        <ZoomInIcon />
      </Button>
    )}
    {renderControlWithTooltip(translate('audioPlayer.zoomOut'),
      <Button
        aria-label="zoom-out"
        onClick={() => handleZoom()}
        disabled={zoomLevel === DEFAULT_ZOOM_LEVELS.length - 1}
      >
        <ZoomOutIcon />
      </Button>
    )}
    {renderControlWithTooltip(translate('audioPlayer.loop'),
      <Button
        aria-label="create-loop"
        disabled={!!internaDisabledTimesTracker}
        onClick={handleLoopClick}
        classes={{
          root: loop ? classes.buttonSelected : undefined,
        }}
      >
        <SvgIcon component={TiArrowLoop} />
      </Button>
    )}
    {renderControlWithTooltip(translate('audioPlayer.playbackSpeed'),
      <Button aria-label="playback-speed" onClick={togglePlaybackSpeed} className={classes.playbackButton} >
        {playbackSpeed < 1 ?
          '0.5⨉'
          :
          '1.0⨉'
        }
      </Button>
    )}
    {renderControlWithTooltip(translate('audioPlayer.mute'),
      <Button
        aria-label="mute"
        onClick={toggleMute}
        classes={{
          root: isMute ? classes.buttonSelected : undefined,
        }}
      >
        <ToggleIcon
          on={!isMute}
          onIcon={<VolumeUpIcon />}
          offIcon={<VolumeOffIcon />}
        />
      </Button>
    )}
    {renderControlWithTooltip(translate('audioPlayer.lockNavigateOnClick'),
      <Button
        aria-label="seek-lock"
        onClick={toggleLockSeek}
        classes={{
          root: autoSeekDisabled ? classes.buttonSelected : undefined,
        }}
      >
        <ToggleIcon
          on={!autoSeekDisabled}
          onIcon={<SvgIcon component={TiLockOpenOutline} />}
          offIcon={<SvgIcon component={TiLockClosedOutline} />}
        />
      </Button>
    )}
    {renderControlWithTooltip(translate('audioPlayer.disableAutoScroll'),
      <Button
        aria-label="scroll-lock"
        onClick={toggleLockScroll}
        classes={{
          root: editorAutoScrollDisabled ? classes.buttonSelected : undefined,
        }}
      >
        {editorAutoScrollDisabled ?
          <CenterFocusWeakIcon /> :
          <CenterFocusStrongIcon />
        }
      </Button>
    )}
  </ButtonGroup>);

  return (
    <Paper
        id='audioPlayer-root-wrapper'
      elevation={5}
      className={classes.root}
    >
      {(!url || !!errorText) && (<Grid
        container
        direction='row'
        spacing={1}
        justify='center'
        alignItems='center'
        alignContent='center'
      >
        <Grid item>
          <WarningIcon className={classes.error} />
        </Grid>
        <Grid item>
          <Typography>{!url ? translate('audioPlayer.noUrl') : errorText}</Typography>
        </Grid>
      </Grid>)}
      {(ready && !errorText) && (
        <Grid
          container
          direction='row'
          justify='space-between'
        >
          <Grid
            container
            item
            direction='row'
            spacing={3}
            xs={6}
            wrap='nowrap'
            justify='flex-start'
            alignItems='center'
            alignContent='center'
            className={classes.controls}
          >
            <Grid item>
              {playerControls}
            </Grid>
            <Grid item>
              <Typography noWrap >{`${currentTimeDisplay} / ${durationDisplay}`}</Typography>
            </Grid>
            <Grid
              item
              className={!duration || (isPlay && (showStreamLoader || waiting)) ? undefined : classes.hidden}
            >
              <ScaleLoader
                height={15}
                color={theme.palette.primary.main}
                loading={true}
              />
            </Grid>
          </Grid>
          <Grid item xs={6} >
            {secondaryControls}
          </Grid>
        </Grid>
      )}
      {(!errorText && !peaksReady) && (
        <Grid
          container
          justify='center'
          alignItems='center'
          alignContent='center'
          className={classes.peaksContainer}
        >
          <PropagateLoader
            color={theme.palette.primary.main}
          />
        </Grid>
      )}
      <div className={(errorText || !peaksReady) ? classes.hidden : classes.content}>
        <div id={WAVEFORM_DOM_IDS['zoomview-container']} className={classes.zoomView} />
        <div id={WAVEFORM_DOM_IDS['overview-container']} />
      </div>
      <div data-vjs-player className={classes.hidden}>
        <audio id={WAVEFORM_DOM_IDS['audio-container']} className="video-js vjs-hidden"></audio>
      </div>
    </Paper>
  );
};