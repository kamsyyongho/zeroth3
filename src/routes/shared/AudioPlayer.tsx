/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Button, Grid, Typography } from '@material-ui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Forward5Icon from '@material-ui/icons/Forward5';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import Replay5Icon from '@material-ui/icons/Replay5';
import StopIcon from '@material-ui/icons/Stop';
import WarningIcon from '@material-ui/icons/Warning';
import React from 'react';
import WaveSurfer from 'wavesurfer.js';
// //@ts-ignore
// import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor.min.js';
// //@ts-ignore
// import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
//@ts-ignore
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
import { I18nContext } from '../../hooks/i18n/I18nContext';


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    content: {
      padding: 0,
    },
  }),
);


interface AudioPlayerProps {
  url: string;
  timeToSeekTo?: number;
  onTimeChange: (timeInSeconds: number) => void;
  onReady: () => void;
}


export function AudioPlayer(props: AudioPlayerProps) {
  const { url, onTimeChange, timeToSeekTo, onReady } = props;
  const {translate} = React.useContext(I18nContext);
  const [waveSurfer, setWaveSurfer] = React.useState<WaveSurfer>();
  const [isReady, setIsReady] = React.useState(false);
  const [isPlay, setIsPlay] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [durationDisplay, setDurationDisplay] = React.useState('0');

  const classes = useStyles();

  // to clear the component on dismount
  React.useEffect(() => {
    return () => {
      if (waveSurfer) {
        try {
          waveSurfer.unAll();
          waveSurfer.destroy();
        } catch {
          // do nothing
        }
      }
    };
  }, []);

  const seekToTime = (timeToSeekTo: number) => {
    if (waveSurfer) {
      try {
        let progress = 0;
        if (timeToSeekTo > 0) {
          progress = timeToSeekTo / duration;
        }
        waveSurfer.seekTo(progress);
      } catch {
        // do nothing
      }
    }
  };

  // set the seek location based on the parent
  React.useEffect(() => {
    if (typeof timeToSeekTo === 'number') {
      seekToTime(timeToSeekTo);
    }
  }, [timeToSeekTo]);


  const handleReady = (waveSurfer: WaveSurfer) => {
    if (waveSurfer) {
      try {
        setIsReady(true);
        const duration = waveSurfer.getDuration();
        setDuration(duration);
        setDurationDisplay(duration.toFixed(2));
        if (onReady && typeof onReady === 'function') {
          onReady();
        }
      } catch {
        // do nothing
      }
    }
  };

  const handleSeek = (waveSurfer: WaveSurfer) => {
    if (waveSurfer) {
      try {
        const currentTime = Number(waveSurfer.getCurrentTime().toFixed(2));
        setCurrentTime(currentTime);
        if (onTimeChange && typeof onTimeChange === 'function') {
          onTimeChange(currentTime);
        }
      } catch {
        // do nothing
      }
    }
  };

  const handlePlayPause = () => {
    if (waveSurfer) {
      try {
        waveSurfer.playPause();
        setIsPlay(prevValue => !prevValue);
      } catch {
        // do nothing
      }
    }
  };

  const handleStop = () => {
    if (waveSurfer) {
      try {
        waveSurfer.stop();
        setIsPlay(false);
      } catch {
        // do nothing
      }
    }
  };

  const handleSkip = (rewind = false) => {
    const interval = rewind ? -5 : 5;
    let timeToSeekTo = currentTime + interval;
    if (timeToSeekTo < 0) {
      timeToSeekTo = 0;
    } else if (timeToSeekTo > duration) {
      timeToSeekTo = duration;
    }
    seekToTime(timeToSeekTo);
  };

  const handleFinish = () => setIsPlay(false);

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
      const initialWaveSurfer = WaveSurfer.create({
        container: '#waveform',
        backend: 'MediaElement', // tell it to use pre-recorded peaks
        scrollParent: true,
        plugins: [
          timeline,
          // cursor,
          // regions,
        ]
      });

      const peaksUrl = 'https://tidesquare-data.s3.ap-northeast-2.amazonaws.com/form.json';
      // initialWaveSurfer.load(url);

      fetch(peaksUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
          }
          return response.json();
        })
        .then(peaks => {
          console.log(
            'loaded peaks! sample_rate: ' + peaks.sample_rate
          );

          // load peaks into wavesurfer.js
          initialWaveSurfer.load(url, peaks.data);
          document.body.scrollTop = 0;
        })
        .catch(e => {
          console.error('error', e);
        });

      // set listeners
      initialWaveSurfer.on('ready', () => handleReady(initialWaveSurfer));
      initialWaveSurfer.on('seek', () => handleSeek(initialWaveSurfer));
      initialWaveSurfer.on('audioprocess', () => handleSeek(initialWaveSurfer));
      initialWaveSurfer.on('finish', handleFinish);
      setWaveSurfer(initialWaveSurfer);
    };
    if (url) {
      initPlayer();
    }
  }, []);

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

  return (
    <Card >
      {isReady && <CardHeader
        title={playerControls}
        subheader={`${currentTime} / ${durationDisplay}`}
      />}
      {!url && (
        <CardContent>
          <Grid
            container
            direction='row'
            spacing={1}
            justify='center'
            alignItems='center'
            alignContent='center'
          >
            <Grid item>
              <WarningIcon color='secondary' />
            </Grid>
            <Grid item>
              <Typography>{translate('audioPlayer.noUrl')}</Typography>
            </Grid>
          </Grid>
        </CardContent>)}
      <CardContent className={classes.content}>
        <div id="waveform" />
        <div id="wave-timeline" />
      </CardContent>
    </Card>
  );
}
