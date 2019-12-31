/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Button, Grid, Typography } from '@material-ui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Paper from '@material-ui/core/Paper';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import SvgIcon from '@material-ui/core/SvgIcon';
import Forward5Icon from '@material-ui/icons/Forward5';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import Replay5Icon from '@material-ui/icons/Replay5';
import StopIcon from '@material-ui/icons/Stop';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import WarningIcon from '@material-ui/icons/Warning';
import { useSnackbar } from 'notistack';
import React from 'react';
import { TiLockClosedOutline, TiLockOpenOutline } from 'react-icons/ti';
import WaveSurfer from 'wavesurfer.js';
// //@ts-ignore
// import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor.min.js';
// //@ts-ignore
// import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
//@ts-ignore
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../theme';


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
      marginRight: 10,
    },
    error: {
      color: theme.error,
    },
  }),
);


interface AudioPlayerProps {
  url: string;
  timeToSeekTo?: number;
  onTimeChange: (timeInSeconds: number) => void;
  onReady: () => void;
}

/** main `WaveSurfer` object */
let waveSurfer: WaveSurfer | undefined = undefined;
/** total duration of the file in seconds */
let duration = 0;
/** array of timeouts so we can cancel them on unsmount */
let playTimeouts: NodeJS.Timeout[] = [];

export function AudioPlayer(props: AudioPlayerProps) {
  const { url, onTimeChange, timeToSeekTo, onReady } = props;
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [errorText, setErrorText] = React.useState('');
  const [isReady, setIsReady] = React.useState(false);
  const [isPlay, setIsPlay] = React.useState(false);
  const [isMute, setIsMute] = React.useState(false);
  const [autoSeekDisabled, setAutoSeekDisabled] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [durationDisplay, setDurationDisplay] = React.useState('0');

  const classes = useStyles();

  // to clear the component on unmount
  React.useEffect(() => {
    return () => {
      if (waveSurfer) {
        try {
          playTimeouts.forEach(timeout => clearTimeout(timeout));
          playTimeouts = [];
          waveSurfer.unAll();
          waveSurfer.destroy();
          waveSurfer = undefined;
        } catch {
          // do nothing
        }
      }
    };
  }, []);


  const handleFinish = () => setIsPlay(false);
  const handlePause = () => setIsPlay(false);
  const handlePlay = () => setIsPlay(true);

  const toggleLockSeek = () => setAutoSeekDisabled((prevValue) => !prevValue);

  const displayError = (errorText: string) => {
    enqueueSnackbar(errorText, { variant: 'error' });
    setErrorText(errorText);
  };

  /**
   * used to play when after a pause
   * - seeking while playing has performance issues
   * - it will clone multiple instances of the object
   * - pausing will prevent this, but only if the player has been paused
   * for a certain amount of time
   */
  const playTimeout = () => {
    if (waveSurfer) {
      try {
        const timeout = setTimeout(() => {
          waveSurfer?.play();
          playTimeouts.shift();
        }, 100);
        playTimeouts.push(timeout);
      } catch (error) {
        displayError(error.message);
      }
    }
  };

  const handleStop = (callback?: () => void) => {
    if (waveSurfer) {
      try {
        waveSurfer.stop();
        setIsPlay(false);
        if (callback && typeof callback === 'function') {
          callback();
        }
      } catch (error) {
        displayError(error.message);
      }
    }
  };

  const handleError = (errorText: string) => {
    displayError(errorText);
    handleStop();
  };


  const seekToTime = (timeToSeekTo: number) => {
    if (waveSurfer) {
      try {
        let progress = 0;
        if (timeToSeekTo > 0) {
          progress = timeToSeekTo / duration;
        }
        waveSurfer.pause();
        waveSurfer.seekTo(progress);
        if (isPlay) {
          playTimeout();
        }
      } catch (error) {
        handleError(error.message);
      }
    }
  };

  const handleReady = () => {
    if (waveSurfer) {
      try {
        setIsReady(true);
        duration = waveSurfer.getDuration();
        setDurationDisplay(duration.toFixed(2));
        if (onReady && typeof onReady === 'function') {
          onReady();
        }
      } catch (error) {
        handleError(error.message);
      }
    }
  };

  const handleAudioProcess = (currentTime: number) => {
    if (waveSurfer) {
      try {
        const currentTimeFixed = Number(currentTime.toFixed(2));
        setCurrentTime(currentTimeFixed);
        if (onTimeChange && typeof onTimeChange === 'function') {
          onTimeChange(currentTimeFixed);
        }
      } catch (error) {
        handleError(error.message);
      }
    }
  };

  function handleSeek(progress: number) {
    if (waveSurfer) {
      try {
        const currentTime = duration * progress;
        const currentTimeFixed = Number(currentTime.toFixed(2));
        setCurrentTime(currentTimeFixed);
        if (onTimeChange && typeof onTimeChange === 'function') {
          onTimeChange(currentTimeFixed);
        }
      } catch (error) {
        handleError(error.message);
      }
    }
  };

  const handlePlayPause = () => {
    if (waveSurfer) {
      try {
        waveSurfer.playPause();
      } catch (error) {
        handleError(error.message);
      }
    }
  };

  const handleSkip = (rewind = false) => {
    if (waveSurfer) {
      try {
        const interval = rewind ? -5 : 5;
        waveSurfer.pause();
        waveSurfer.skip(interval);
        if (isPlay) {
          playTimeout();
        }
      } catch (error) {
        handleError(error.message);
      }
    }
  };

  /**
   * Toggle volume to `0` or `1`
   * - setting volume because `setMute` / `toggleMute`
   * methods are not working properly. They are not unmuting.
   * @param currentMute 
   */
  const toggleMute = (currentMute: boolean) => {
    if (waveSurfer) {
      try {
        const volume = currentMute ? 0 : 1;
        waveSurfer.setVolume(volume);
      } catch (error) {
        handleError(error.message);
      }
    }
  };

  /**
   * mute when the value has changed
   */
  React.useEffect(() => {
    toggleMute(isMute);
  }, [isMute]);


  React.useEffect(() => {
    const initPlayer = () => {
      const timeline = TimelinePlugin.create({
        container: "#wave-timeline"
      });
      // const regions = RegionsPlugin.create({
      //   regions: [
      //     {
      //       start: 1,
      //       end: 3,
      //       loop: false,
      //       color: 'hsla(400, 100%, 30%, 0.5)'
      //     }, {
      //       start: 5,
      //       end: 7,
      //       loop: false,
      //       color: 'hsla(200, 50%, 70%, 0.4)'
      //     }
      //   ],
      //   dragSelection: {
      //     slop: 5
      //   }
      // });
      // const cursor = CursorPlugin.create({
      //   showTime: true,
      //   // followCursorY: true,
      //   opacity: 1,
      //   // customStyle: {
      //   //   height: 15,
      //   // },
      //   // customShowTimeStyle: {
      //   //   'background-color': '#000',
      //   //   color: 'red',
      //   //   padding: '2px',
      //   //   'font-size': '10px'
      //   // },
      // });
      // const initialWaveSurfer = WaveSurfer.create({
      waveSurfer = WaveSurfer.create({
        container: '#waveform',
        backend: 'MediaElement', // tell it to use pre-recorded peaks
        height: 64, // default is 128
        progressColor: '#2f99cb',
        cursorColor: '#ff4d59',
        waveColor: '#d4d3d3',
        barWidth: 2,
        barRadius: 2,
        scrollParent: true,
        plugins: [
          timeline,
          // cursor,
          // regions,
        ]
      });

      // add listeners after waveSurver is initialized
      waveSurfer.on('ready', handleReady);
      waveSurfer.on('play', handlePlay);
      waveSurfer.on('pause', handlePause);
      waveSurfer.on('audioprocess', handleAudioProcess);
      waveSurfer.on('seek', handleSeek);
      waveSurfer.on('finish', handleFinish);
      waveSurfer.on('error', handleError);

      const peaksUrl = 'https://tidesquare-data.s3.ap-northeast-2.amazonaws.com/form.json';
      // initialWaveSurfer.load(url);

      fetch(peaksUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('HTTP error: ' + response.status);
          }
          return response.json();
        })
        .then(peaks => {
          if (!waveSurfer) {
            throw new Error('waveSurfer undefined while fetching peaks');
          }
          console.log(
            'loaded peaks! sample_rate: ' + peaks.sample_rate
          );

          // load peaks into wavesurfer.js
          waveSurfer.load(url, peaks.data);
          document.body.scrollTop = 0;
        })
        .catch((error) => {
          handleError(`PEAKS ERROR: ${error.message}`);
          console.warn('AudioPlayer error:', error);
        });

    };
    if (url) {
      initPlayer();
    }
  }, []);


  // set the seek location based on the parent
  React.useEffect(() => {
    if (typeof timeToSeekTo === 'number' && !autoSeekDisabled) {
      seekToTime(timeToSeekTo);
    }
  }, [timeToSeekTo]);


  const playerControls = (<ButtonGroup size='large' variant='outlined' aria-label="audio player controls">
    <Button aria-label="rewind-5s" onClick={() => handleSkip(true)} >
      <Replay5Icon />
    </Button>
    <Button aria-label="stop" onClick={() => handleStop()} >
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
    <Button aria-label="seek-lock" onClick={() => setIsMute(!isMute)} >
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
      {(isReady && !errorText) && (
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
            xs={9}
            justify='flex-start'
            alignItems='center'
            alignContent='center'
            className={classes.controls}
          >
            <Grid item>
              {playerControls}
            </Grid>
            <Grid item>
              <Typography>{`${currentTime} / ${durationDisplay}`}</Typography>
            </Grid>
          </Grid>
          <Grid container item xs={2} >
            {secondaryControls}
          </Grid>
        </Grid>
      )}
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
      <div className={errorText ? classes.hidden : classes.content}>
        <div id="waveform" />
        <div id="wave-timeline" />
      </div>
    </Paper>
  );
}
