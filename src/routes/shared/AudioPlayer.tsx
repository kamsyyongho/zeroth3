/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Typography } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import React from 'react';
import WaveSurfer from 'wavesurfer.js';
// //@ts-ignore
// import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor.min.js';
// //@ts-ignore
// import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
//@ts-ignore
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    content: {
      padding: 0,
      overflow: 'hidden',
    },
  }),
);


interface AudioPlayerProps {
  url: string;
  onTimeChange: (timeInSeconds: number) => void;
  timeToSeekTo?: number;
}


export function AudioPlayer(props: AudioPlayerProps) {
  const { url, onTimeChange, timeToSeekTo } = props;
  const [waveSurfer, setWaveSurfer] = React.useState<WaveSurfer>();
  const [isReady, setIsReady] = React.useState(false);
  const [isPlay, setIsPlay] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);

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

  // set the seek location based on the parent
  React.useEffect(() => {
    if (typeof timeToSeekTo === 'number' && waveSurfer) {
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
  }, [timeToSeekTo]);

  const handleReady = (waveSurfer: WaveSurfer) => {
    if (waveSurfer) {
      try {
        setIsReady(true);
        setDuration(Number(waveSurfer.getDuration().toFixed(2)));
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
        scrollParent: true,
        plugins: [
          timeline,
          // cursor,
          // regions,
        ]
      });

      initialWaveSurfer.load(url);

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


  return (
    <Card >
      {isReady && <CardHeader
        title={<IconButton aria-label="play/pause" onClick={handlePlayPause} >
          {isPlay ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>}
        subheader={`${currentTime} / ${duration}`}
      />}
      <CardContent className={classes.content}>
        {!url && <Typography>TEST NO AUDIO URL</Typography>}
        <div id="waveform" />
        <div id="wave-timeline" />
      </CardContent>
    </Card>
  );
}
