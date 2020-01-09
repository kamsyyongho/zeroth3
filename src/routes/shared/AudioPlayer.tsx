/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Button, Grid, Typography } from '@material-ui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Paper from '@material-ui/core/Paper';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import SvgIcon from '@material-ui/core/SvgIcon';
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
import { useSnackbar } from 'notistack';
import Peaks, { PeaksInstance, PeaksOptions, Segment, SegmentAddOptions } from 'peaks.js';
import React from 'react';
import { TiArrowLoop, TiLockClosedOutline, TiLockOpenOutline } from 'react-icons/ti';
import PropagateLoader from 'react-spinners/PropagateLoader';
import ScaleLoader from 'react-spinners/ScaleLoader';
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import 'video.js/dist/video-js.css';
import { DEFAULT_EMPTY_TIME } from '../../constants';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../theme';
import { Time, WordToCreateTimeFor } from '../../types';
import log from '../../util/log/logger';
import { formatSecondsDuration } from '../../util/misc';


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
  }),
);


interface AudioPlayerProps {
  url: string;
  length: number;
  highRiskEditMode?: boolean;
  timeToSeekTo?: number;
  disabledTimes?: Time[];
  segmentIdToDelete?: string;
  deleteAllWordSegments?: boolean;
  wordsClosed?: boolean;
  openWordKey?: string;
  wordToCreateTimeFor?: WordToCreateTimeFor;
  wordToUpdateTimeFor?: WordToCreateTimeFor;
  onTimeChange: (timeInSeconds: number) => void;
  onSectionChange: (time: Time, wordKey: string) => void;
  onSegmentDelete: () => void;
  onSegmentCreate: () => void;
  onSegmentUpdate: () => void;
  onSegmentStatusEditChange: () => void;
  onReady: () => void;
}

/** total duration of the file in seconds */
let duration = 0;

/** the timeout used to display the streaming indicator for a minimum time */
let waitingTimeoutId: NodeJS.Timeout | undefined;

/** the interval used to get the current time */
let getTimeIntervalId: NodeJS.Timeout | undefined;

/** 
 * if there was an error in the component 
 * - lives outside the component, so it doesn't wait on state changes
 * - used for the meida listeners
 */
let fatalError = false;

let mediaElement: HTMLAudioElement | null = null;

let StreamPlayer: VideoJsPlayer | undefined;

let PeaksPlayer: PeaksInstance | undefined;

let historyLength = 0;
const getVideoJsLog = () => {
  const history = videojs.log.history();
  const length = history.length;
  if (length > historyLength) {
    historyLength = length;
    console.log(`streaming player log: `, history[length - 1]);
  }
};

enum SEGMENT_IDS {
  'LOOP' = 'LOOP',
  'DISABLED_0' = 'DISABLED_0',
  'DISABLED_1' = 'DISABLED_1',
}
const SEGMENT_IDS_ARRAY = Object.keys(SEGMENT_IDS);
const DEFAULT_LOOP_LENGTH = 5;

let internaDisabledTimesTracker: Time[] | undefined;

let tempDragStartSegmentResetOptions: SegmentAddOptions | undefined;

let isLoop = false;

export function AudioPlayer(props: AudioPlayerProps) {
  const { url,
    length,
    onTimeChange,
    onSectionChange,
    highRiskEditMode,
    timeToSeekTo,
    disabledTimes,
    segmentIdToDelete,
    deleteAllWordSegments,
    wordsClosed,
    openWordKey,
    wordToCreateTimeFor,
    wordToUpdateTimeFor,
    onSegmentDelete,
    onSegmentCreate,
    onSegmentUpdate,
    onSegmentStatusEditChange,
    onReady,
  } = props;
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [errorText, setErrorText] = React.useState('');
  const [peaksReady, setPeaksReady] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [isPlay, setIsPlay] = React.useState(false);
  const [waiting, setWaiting] = React.useState(false);
  const [showStreamLoader, setShowStreamLoader] = React.useState(false);
  const [isMute, setIsMute] = React.useState(false);
  const [autoSeekDisabled, setAutoSeekDisabled] = React.useState(false);
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1); // 0 to 1
  const [currentTime, setCurrentTime] = React.useState(0);
  const [currentTimeDisplay, setCurrentTimeDisplay] = React.useState(DEFAULT_EMPTY_TIME);
  const [durationDisplay, setDurationDisplay] = React.useState(DEFAULT_EMPTY_TIME);

  const classes = useStyles();
  const theme: CustomTheme = useTheme();

  const handlePause = () => setIsPlay(false);
  const handlePlay = () => setIsPlay(true);

  const checkIfFinished = () => {
    if (!PeaksPlayer?.player || !mediaElement) return;
    handlePause();
  };

  const toggleLockSeek = () => setAutoSeekDisabled((prevValue) => !prevValue);

  const displayError = (errorText: string) => {
    enqueueSnackbar(errorText, { variant: 'error' });
    setErrorText(errorText);
  };

  const handleStop = () => {
    if (!PeaksPlayer?.player || !StreamPlayer || !duration) return;
    try {
      setIsPlay(false);
      StreamPlayer.pause();
      PeaksPlayer.player.seek(0);
      setCurrentTimeDisplay(DEFAULT_EMPTY_TIME);
    } catch (error) {
      displayError(error.message);
    }
  };

  const handleError = (errorText: string) => {
    displayError(errorText);
    fatalError = true;
    handleStop();
  };

  const handleStreamingError = () => {
    if (mediaElement?.error instanceof Error) {
      handleError(mediaElement.error.toString());
    }
  };

  const checkIfValidSegmentArea = (startTime: number, endTime: number) => {
    if (!internaDisabledTimesTracker || internaDisabledTimesTracker.length < 1) return true;
    const isValidArea = internaDisabledTimesTracker.every((disabledTimeArea, index) => {
      const { start, end } = disabledTimeArea;
      if (index === 0) {
        if (
          startTime >= (start as number) &&
          startTime >= (end as number) &&
          endTime >= (start as number) &&
          endTime >= (end as number)
        ) {
          return true;
        }
      } else {
        if (
          startTime <= (start as number) &&
          startTime <= (end as number) &&
          endTime <= (end as number) &&
          endTime <= (start as number)
        ) {
          return true;
        }
      }
      return false;
    });
    return isValidArea;
  };

  const seekToTime = (timeToSeekTo: number) => {
    if (!PeaksPlayer?.player || timeToSeekTo < 0) return;
    try {
      PeaksPlayer.player.seek(timeToSeekTo);
    } catch (error) {
      handleError(error.message);
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
    } catch (error) {
      handleError(error.message);
    }
  };

  const handlePeaksReady = () => {
    if (fatalError || !PeaksPlayer?.player) return;
    setPeaksReady(true);
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
      if (onTimeChange && typeof onTimeChange === 'function') {
        onTimeChange(currentTimeFixed);
      }
    } catch (error) {
      handleError(error.message);
    }
  };

  /**
   * to get the current time quickly
   * - the `timeupdate` listener for the `HTMLAudioElement` updates too slowly. (~300ms)
   * - sets or clears an interval (30ms) if the we are currently playing audio
   */
  React.useEffect(() => {
    if (isPlay && !waiting) {
      getTimeIntervalId = setInterval(() => {
        handleAudioProcess(mediaElement?.currentTime);
      }, 30);
    } else {
      if (getTimeIntervalId !== undefined) {
        clearInterval(getTimeIntervalId);
        getTimeIntervalId = undefined;
      }
    }
  }, [isPlay, waiting]);

  /**
   * display a loading indicator when the player is waiting
   * - using a timeout to prevent flicker by displaying the indicator for a minimum of 400ms
   */
  function handleWaiting() {
    setWaiting(true);
    setShowStreamLoader(true);
    waitingTimeoutId = setTimeout(() => {
      if (waitingTimeoutId !== undefined) {
        clearTimeout(waitingTimeoutId);
        waitingTimeoutId = undefined;
      }
      if (!waiting) {
        setShowStreamLoader(false);
      }
    }, 400);
  }

  const handleLoaded = () => {
    setWaiting(false);
  };

  function handleSeek() {
    if (!PeaksPlayer?.player || !mediaElement) return;
    try {
      const { currentTime } = mediaElement;
      if (isNaN(currentTime)) return;
      const currentTimeFixed = Number(currentTime.toFixed(2));
      setCurrentTimeDisplay(getCurrentTimeDisplay(currentTime));
      setCurrentTime(currentTime);
      if (onTimeChange && typeof onTimeChange === 'function') {
        onTimeChange(currentTimeFixed);
      }
    } catch (error) {
      handleError(error.message);
    }
  };

  function handleZoom(zoomIn = false) {
    if (!PeaksPlayer?.zoom || !peaksReady) return;
    try {
      if (zoomIn) {
        PeaksPlayer.zoom.zoomIn();
      } else {
        PeaksPlayer.zoom.zoomOut();
      }
    } catch (error) {
      handleError(error.message);
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
    const { id, startTime, editable } = segment;
    switch (id) {
      case SEGMENT_IDS.LOOP:
        // referencing the media element to get most up-to-date state
        if (mediaElement && !mediaElement.paused && isLoop) {
          seekToTime(startTime);
        }
        break;
      default:
        // only currently focussed words are editable
        if (id && editable) {
          seekToTime(startTime);
        }
        break;
    }
  };

  const handleSegmentEnter = (segment: Segment) => {
    const { id, endTime } = segment;
    switch (id) {
      case SEGMENT_IDS.DISABLED_0:
        seekToTime(endTime);
        break;
      case SEGMENT_IDS.DISABLED_1:
        if (internaDisabledTimesTracker && internaDisabledTimesTracker[0]?.end) {
          seekToTime(internaDisabledTimesTracker[0].end);
        }
        break;
      default:
        break;
    }
  };

  const handleSegmentChange = (segment: Segment) => {
    const { id, startTime, endTime } = segment;
    const time: Time = {
      start: startTime,
      end: endTime,
    };
    const isValidSection = checkIfValidSegmentArea(startTime, endTime);
    switch (id) {
      case SEGMENT_IDS.LOOP:
      case SEGMENT_IDS.DISABLED_0:
      case SEGMENT_IDS.DISABLED_1:
        break;
      default:
        if (id && isValidSection) {
          onSectionChange(time, id);
          // to handle resetting the segment to the last valid
          // options if we are trying to put it in an invalid area
        } else if (id && !isValidSection && tempDragStartSegmentResetOptions && PeaksPlayer?.segments) {
          PeaksPlayer.segments.removeById(id);
          PeaksPlayer.segments.add(tempDragStartSegmentResetOptions);
        }
        // reset our pre-drag options
        tempDragStartSegmentResetOptions = undefined;
        break;
    }
  };

  /**
   * creates or removes the loop segment
   */
  function handleLoopClick() {
    if (!PeaksPlayer?.segments ||
      !peaksReady ||
      !duration ||
      !mediaElement ||
      !StreamPlayer ||
      (internaDisabledTimesTracker && internaDisabledTimesTracker.length)
    ) return;
    try {
      const loopSegment = PeaksPlayer.segments.getSegment(SEGMENT_IDS.LOOP);
      if (isLoop) {
        PeaksPlayer.segments.removeById(SEGMENT_IDS.LOOP);
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
          id: SEGMENT_IDS.LOOP,
          color,
        };
        PeaksPlayer.segments.add(segmentOptions);
      }
      isLoop = !isLoop;
    } catch (error) {
      handleError(error.message);
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
      if (isPlay) {
        StreamPlayer.pause();
      } else {
        StreamPlayer.play();
      }
    } catch (error) {
      handleError(error.message);
    }
  };

  const handleSkip = (rewind = false) => {
    if (!duration) return;
    const interval = rewind ? -5 : 5;
    let timeToSeekTo = currentTime + interval;
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
      handleError(error.message);
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
      handleError(error.message);
    }
  };

  const createSegment = (segmentToAdd: SegmentAddOptions, isDisabledSegment = false) => {
    if (!PeaksPlayer?.segments) return;
    try {
      const existingSegments = PeaksPlayer.segments.getSegments();
      const updatedSegments = existingSegments.map((segment) => {
        return {
          startTime: segment.startTime,
          endTime: segment.endTime,
          id: segment.id,
          color: segment.color,
          labelText: segment.labelText,
          editable: false,
        } as SegmentAddOptions;
      });
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
      if (!isDisabledSegment) {
        onSegmentCreate();
        seekToTime(segmentToAdd.startTime);
      }
      isLoop = false;
    } catch (error) {
      handleError(error.message);
    }
  };

  const updateEditableSegment = (editableSegmentId: string) => {
    if (!PeaksPlayer?.segments) return;
    try {
      let seekTime: number | undefined;
      const existingSegments = PeaksPlayer.segments.getSegments();
      const updatedSegments = existingSegments.map((segment) => {
        const isMatch = segment.id === editableSegmentId;
        if (isMatch) {
          seekTime = segment.startTime;
        }
        const segmentOptions: SegmentAddOptions = {
          startTime: segment.startTime,
          endTime: segment.endTime,
          id: segment.id,
          color: segment.color,
          labelText: segment.labelText,
          editable: isMatch,
        };
        return segmentOptions;
      });
      PeaksPlayer.segments.removeAll();
      PeaksPlayer.segments.add(updatedSegments);
      onSegmentStatusEditChange();
      if (typeof seekTime === 'number') {
        seekToTime(seekTime);
      }
    } catch (error) {
      handleError(error.message);
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
      handleError(error.message);
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
      handleError(error.message);
    }
  };

  const deleteSegment = (segmentIdToDelete: string) => {
    if (!PeaksPlayer?.segments) return;
    try {
      PeaksPlayer.segments.removeById(segmentIdToDelete);
      onSegmentDelete();
    } catch (error) {
      handleError(error.message);
    }
  };

  const deleteAllSegments = () => {
    if (!PeaksPlayer?.segments) return;
    try {
      const loopSegment = PeaksPlayer.segments.getSegment(SEGMENT_IDS.LOOP);
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
      onSegmentDelete();
      internaDisabledTimesTracker = undefined;
    } catch (error) {
      handleError(error.message);
    }
  };

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

  // to keep track of the current open word to make only that word editable
  React.useEffect(() => {
    if (typeof openWordKey === 'string') {
      updateEditableSegment(openWordKey);
    }
  }, [openWordKey]);

  // to set zones outside of the current custom edit segment that are disabled
  React.useEffect(() => {
    internaDisabledTimesTracker = disabledTimes;
    if (disabledTimes instanceof Array) {
      disabledTimes.forEach((disabledTime, index) => {
        const startTime = disabledTime.start as number;
        const endTime = disabledTime.end as number;
        if (typeof startTime === 'number' && typeof endTime === 'number') {
          const color = theme.audioPlayer.disabled;
          const disabledSegment: SegmentAddOptions = {
            startTime,
            endTime,
            editable: false,
            color,
            id: index ? SEGMENT_IDS.DISABLED_1 : SEGMENT_IDS.DISABLED_0,
          };
          createSegment(disabledSegment, true);
        }
      });
    }
  }, [disabledTimes]);

  // set the create a time segment for a word
  React.useEffect(() => {
    if (wordToCreateTimeFor !== undefined) {
      // adding a bit to account for segment creation slop
      const startTime = wordToCreateTimeFor.segmentStartTime + 0.03;
      let endTime = startTime + 0.5;
      if (endTime > duration) {
        endTime = duration;
      }
      const { color } = wordToCreateTimeFor;
      const segmentToAdd: SegmentAddOptions = {
        startTime,
        endTime,
        editable: true,
        color,
        id: wordToCreateTimeFor.wordKey,
        labelText: wordToCreateTimeFor.range.text,
      };
      createSegment(segmentToAdd);
    }
  }, [wordToCreateTimeFor]);

  // set the update the time for a segment
  React.useEffect(() => {
    if (wordToUpdateTimeFor !== undefined) {
      const { wordKey, segmentStartTime, segmentEndTime } = wordToUpdateTimeFor;
      if (typeof segmentEndTime === 'number') {
        const isValidTime = checkIfValidSegmentArea(segmentStartTime, segmentEndTime);
        if (isValidTime) {
          updateSegmentTime(wordKey, segmentStartTime, segmentEndTime);
        }
      }
    }
  }, [wordToUpdateTimeFor]);

  React.useEffect(() => {

    mediaElement = document.querySelector('audio') as HTMLAudioElement;
    mediaElement?.addEventListener('loadstart', handleWaiting);
    mediaElement?.addEventListener('waiting', handleWaiting);
    mediaElement?.addEventListener('canplay', handleStreamReady);
    mediaElement?.addEventListener('suspended', event => console.log('suspended', event));
    mediaElement?.addEventListener('loadeddata', handleLoaded);
    mediaElement?.addEventListener('pause', checkIfFinished);
    mediaElement?.addEventListener('seeked', handleSeek);
    mediaElement?.addEventListener('progress', (progress) => console.log('progress'));
    mediaElement?.addEventListener('playing', (playing) => {
      setWaiting(false);
      if (waitingTimeoutId === undefined) {
        setShowStreamLoader(false);
      }
      handlePlay();
    });
    mediaElement?.addEventListener('error', handleStreamingError);
    mediaElement?.addEventListener('stalled', (stalled) => console.log('stalled', stalled));


    const peaksJsInit = () => {
      const peaksUrl = `${url}.json`;
      let zoomLevels = [512, 1024, 2048, 4096];
      // handle the increased zoom for files less than a minute
      if (length < 60) {
        zoomLevels = [2, 4, 8, 16];
      }

      const options: PeaksOptions = {
        /** REQUIRED OPTIONS **/
        // Containing element: either
        // container: document.getElementById('peaks-container') as HTMLElement,

        // or (preferred):
        containers: {
          zoomview: document.getElementById('zoomview-container') as HTMLElement,
          overview: document.getElementById('overview-container') as HTMLElement
        },
        // HTML5 Media element containing an audio track
        mediaElement: mediaElement as HTMLAudioElement,
        /** Optional config with defaults **/
        // URI to waveform data file in binary or JSON
        dataUri: {
          json: peaksUrl,
        },
        // If true, Peaks.js will send credentials with all network requests,
        // i.e., when fetching waveform data.
        withCredentials: false,
        // webAudio: {
        //   // A Web Audio AudioContext instance which can be used
        //   // to render the waveform if dataUri is not provided
        //   audioContext: new AudioContext(),
        //   // Alternatively, provide an AudioBuffer containing the decoded audio
        //   // samples. In this case, an AudioContext is not needed
        //   audioBuffer: undefined,
        //   // If true, the waveform will show all available channels.
        //   // If false, the audio is shown as a single channel waveform.
        //   multiChannel: false
        // },
        // async logging function
        logger: console.error.bind(console),
        // if true, emit cue events on the Peaks instance (see Cue Events)
        emitCueEvents: true,
        // default height of the waveform canvases in pixels
        height: 64,
        // Array of zoom levels in samples per pixel (big >> small)
        zoomLevels: zoomLevels,
        // Bind keyboard controls
        keyboard: false,
        // Keyboard nudge increment in seconds (left arrow/right arrow)
        nudgeIncrement: 0.01,
        // Color for the in marker of segments
        inMarkerColor: theme.palette.common.black,
        // Color for the out marker of segments
        outMarkerColor: theme.palette.common.black,
        // Color for the zoomed in waveform
        zoomWaveformColor: theme.header.lightBlue,
        // Color for the overview waveform
        overviewWaveformColor: theme.audioPlayer.waveform,
        // Color for the overview waveform rectangle
        // that shows what the zoom view shows
        // overviewHighlightColor: 'grey',
        // The default number of pixels from the top and bottom of the canvas
        // that the overviewHighlight takes up
        // overviewHighlightOffset: 11,
        // Color for segments on the waveform
        segmentColor: 'rgba(255, 161, 39, 1)',
        // Color of the play head
        playheadColor: '#ff0000',
        // Color of the play head text
        playheadTextColor: '#ff0000',
        // Show current time next to the play head
        // (zoom view only)
        showPlayheadTime: false,
        // the color of a point marker
        pointMarkerColor: '#FF0000',
        // Color of the axis gridlines
        axisGridlineColor: '#ccc',
        // Color of the axis labels
        axisLabelColor: '#aaa',
        // Random color per segment (overrides segmentColor)
        randomizeSegmentColor: true,
      };

      PeaksPlayer = Peaks.init(options, function (error, peaksInstance) {
        setReady(!error);
        if (error) {
          handleError(`PEAKS ERROR: ${error.toString()}`);
        }
      });

      PeaksPlayer.on('peaks.ready', handlePeaksReady);
      PeaksPlayer.on('segments.exit', handleSegmentExit);
      PeaksPlayer.on('segments.enter', handleSegmentEnter);
      PeaksPlayer.on('segments.dragstart', handleSegmentDragStart);
      PeaksPlayer.on('segments.dragend', handleSegmentChange);


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

      StreamPlayer = videojs('myAudio', options) as VideoJsPlayer;

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


    if (url) {
      initPlayer();
    }

  }, []);

  // to clear the component on unmount
  React.useEffect(() => {
    return () => {
      try {
        if (getTimeIntervalId) {
          clearTimeout(getTimeIntervalId);
          getTimeIntervalId = undefined;
        }
        if (waitingTimeoutId) {
          clearTimeout(waitingTimeoutId);
          waitingTimeoutId = undefined;
        }
        if (PeaksPlayer) {
          PeaksPlayer.destroy();
          PeaksPlayer = undefined;
        }
        if (StreamPlayer) {
          StreamPlayer.dispose();
          StreamPlayer = undefined;
        }
        if (mediaElement) {
          mediaElement.removeEventListener('loadstart', handleWaiting);
          mediaElement.removeEventListener('waiting', handleWaiting);
          mediaElement.removeEventListener('canplay', handleStreamReady);
          mediaElement.removeEventListener('loadeddata', handleLoaded);
          mediaElement.removeEventListener('pause', checkIfFinished);
          mediaElement.removeEventListener('seeked', handleSeek);
          mediaElement.removeEventListener('error', handleStreamingError);
        }
      } catch (error) {
        log({
          file: `AudioPlayer.tsx`,
          caller: `ERROR DURING UNMOUNT:`,
          value: error,
          important: true,
        });
      }
    };
  }, []);

  // getVideoJsLog();

  const playerControls = (<ButtonGroup size='large' variant='outlined' aria-label="audio player controls">
    <Button aria-label="rewind-5s" onClick={() => handleSkip(true)} >
      <Replay5Icon />
    </Button>
    <Button aria-label="stop" onClick={handleStop} >
      <StopIcon />
    </Button>
    <Button aria-label="play/pause" onClick={handlePlayPause} >
      {isPlay ? <PauseIcon /> : <PlayArrowIcon />}
    </Button>
    <Button aria-label="forward-5s" onClick={() => handleSkip()} >
      <Forward5Icon />
    </Button>
  </ButtonGroup>);

  const secondaryControls = (<ButtonGroup size='large' variant='outlined' aria-label="secondary controls">
    <Button aria-label="zoom-in" onClick={() => handleZoom(true)} >
      <ZoomInIcon />
    </Button>
    <Button aria-label="zoom-out" onClick={() => handleZoom()} >
      <ZoomOutIcon />
    </Button>
    <Button
      aria-label="create-loop"
      disabled={!!internaDisabledTimesTracker || highRiskEditMode}
      onClick={handleLoopClick}
    >
      {isLoop ? '⊗' : '⊕'} <SvgIcon component={TiArrowLoop} />
    </Button>
    <Button aria-label="playback-speed" onClick={togglePlaybackSpeed} >
      {playbackSpeed < 1 ?
        '0.5⨉'
        :
        '1.0⨉'
      }
    </Button>
    <Button aria-label="seek-lock" onClick={toggleMute} >
      {isMute ?
        (<VolumeOffIcon />)
        :
        (<VolumeUpIcon />)
      }
    </Button>
    <Button aria-label="seek-lock" onClick={toggleLockSeek} >
      {autoSeekDisabled ?
        (<SvgIcon component={TiLockClosedOutline} />)
        :
        (<SvgIcon component={TiLockOpenOutline} />)
      }
    </Button>
  </ButtonGroup>);

  return (
    <Paper
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
          style={{ height: 128 }}
        >
          <PropagateLoader
            color={theme.palette.primary.main}
          />
        </Grid>
      )}
      <div className={(errorText || !peaksReady) ? classes.hidden : classes.content}>
        <div id="zoomview-container" className={classes.zoomView} />
        <div id="overview-container" />
      </div>
      <div data-vjs-player className={classes.hidden}>
        <audio id="myAudio" className="video-js vjs-hidden"></audio>
      </div>
    </Paper>
  );
};
