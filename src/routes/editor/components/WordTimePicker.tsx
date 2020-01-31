import { Avatar, Button, CardContent, CardHeader, Grid, Typography } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import CancelIcon from '@material-ui/icons/Cancel';
import RemoveIcon from '@material-ui/icons/Remove';
import React from 'react';
import { DEFAULT_EMPTY_TIME } from '../../../constants/misc.constants';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { Segment, Time, Word } from '../../../types';
import { formatSecondsDuration } from '../../../util/misc';

const useStyles = makeStyles((theme) =>
  createStyles({
    spacing: {
      marginTop: 25,
    },
    textArea: {
      minWidth: 400,
      fontSize: 16,
    },
    card: {
      minWidth: 200,
    },
    timeContent: {
      padding: 0,
    },
  }),
);


/** 
 * An out-of-scope value used to allow the keyboard listener to have an
 * updated Time value. The listener will not have the correct values from
 * within the component function
 */
let wordTimeFromPlayerTracker: Time | undefined;

/** props that need to passed to the time picker that will come from the main editor page */
export interface WordTimePickerRootProps {
  totalLength: number;
  wordTimeFromPlayer?: Time;
  createWordTimeSection: (wordToAddTimeTo: Word, timeToCreateAt: number, wordKey: string) => void;
  deleteWordTimeSection: (segmentIdToDelete: string) => void;
  updateWordTimeSection: (wordToAddTimeTo: Word, startTime: number, endTime: number, wordKey: string) => void;
  setDisabledTimes: (disabledTimes: Time[]) => void;
}

interface WordTimePickerProps extends WordTimePickerRootProps {
  segments: Segment[];
  segmentIndex: number;
  wordToCreateTimeFor: Word;
  onSuccess: (wordToCreate: Word, segment: Segment) => void;
  onClose: () => void;
  onInvalidTime: () => void;
}

/** how much to change the time when pressing the popper buttons */
const DEFAULT_TIME_INCREMENT = 0.01;

const wordKey = 'TEMP_WORD_KEY';


export function WordTimePicker(props: WordTimePickerProps) {
  const {
    wordToCreateTimeFor,
    wordTimeFromPlayer,
    setDisabledTimes,
    createWordTimeSection,
    updateWordTimeSection,
    segments,
    segmentIndex,
    totalLength,
    onSuccess,
    onClose,
    onInvalidTime,
  } = props;
  const segment = segments[segmentIndex];
  const { translate } = React.useContext(I18nContext);
  const [word, setWord] = React.useState(wordToCreateTimeFor);

  /**
   * gets any time that is not part of the current segment 
   * - used to set the unplayable areas of the audio
   */
  const getInvalidAudioTimes = () => {
    const disabledTimes: Time[] = [];
    let isLastSegment = false;
    while (!isLastSegment && disabledTimes.length < 2) {
      isLastSegment = segmentIndex === segments.length - 1;
      let start = 0;
      let end = segment.start;
      if (disabledTimes.length) {
        start = segments[segmentIndex + 1].start;
        end = totalLength;
      }
      const time = {
        start,
        end,
      };
      disabledTimes.push(time);
    }
    return disabledTimes;
  };

  const createSegment = () => {
    createWordTimeSection(wordToCreateTimeFor, segment.start, wordKey);
  };

  const handleCreate = (incomingWordTime?: Time) => {
    const wordToCheck = { ...word };
    if (incomingWordTime) {
      wordToCheck.time = incomingWordTime;
    }
    if (typeof wordToCheck.time?.end === 'number' &&
      typeof wordToCheck.time?.start === 'number' &&
      wordToCheck.time.end > wordToCheck.time.start) {
      onSuccess(wordToCheck, segment);
    } else {
      onInvalidTime();
    }
  };

  /**
  * used to close on escape press
 * - the listener doesn't have the most updated values
 * so we will use a variable outside of the component 
 * function's scope that we will keep updated
 */
  const escapeKeyListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  // to limit the audio boundaries to be within the segment, 
  // create initial segment, and listen for esc key press
  React.useEffect(() => {
    const disabledTimes = getInvalidAudioTimes();
    setDisabledTimes(disabledTimes);
    createSegment();
    document.addEventListener("keydown", escapeKeyListener);
  }, []);

  // remove listener on unmount
  React.useEffect(() => {
    return () => {
      document.removeEventListener("keydown", escapeKeyListener);
      wordTimeFromPlayerTracker = undefined;
    };
  }, []);

  // to limit the audio boundaries to be within the segment
  React.useEffect(() => {
    if (wordTimeFromPlayer && wordTimeFromPlayer.start && wordTimeFromPlayer.end) {
      setWord({ ...word, time: wordTimeFromPlayer });
      wordTimeFromPlayerTracker = wordTimeFromPlayer;
    }
  }, [wordTimeFromPlayer]);



  const classes = useStyles();
  const theme = useTheme();


  const changeSegmentTime = (isStartTime: boolean, increment: boolean) => {
    if (!word) return;
    let start = word?.time?.start as number;
    let end = word?.time?.end as number;
    if (typeof start !== 'number' || typeof end !== 'number') return;
    if (isStartTime) {
      start = start + (DEFAULT_TIME_INCREMENT * (increment ? 1 : -1));
      start = Number(start.toFixed(2));
    } else {
      end = end + (DEFAULT_TIME_INCREMENT * (increment ? 1 : -1));
      end = Number(end.toFixed(2));
    }
    updateWordTimeSection(word, start, end, wordKey);
  };


  const handleStartChangeTime = (increment: boolean) => {
    changeSegmentTime(true, increment);
  };

  const handleEndChangeTime = (increment: boolean) => {
    changeSegmentTime(false, increment);
  };

  const getTimeDisplay = (time?: number) => {
    if (typeof time !== 'number') return DEFAULT_EMPTY_TIME;
    const timeString = time.toFixed(2);
    const decimalIndex = timeString.indexOf('.');
    const decimals = timeString.substring(decimalIndex);
    const formattedTime = formatSecondsDuration(time);
    return formattedTime + decimals;
  };

  const renderTimeChecker = (title: string, onChange: (increment: boolean) => void, time?: number) => {
    return (
      <Card elevation={0} >
        <CardHeader
          title={title}
          className={classes.timeContent}
        />
        <CardContent
          className={classes.timeContent}
        >
          <Grid
            container
            wrap='nowrap'
            direction='row'
            alignContent='center'
            alignItems='center'
            justify='center'
          >
            <IconButton
              color={'primary'}
              onClick={() => onChange(false)}
            >
              <RemoveIcon />
            </IconButton>
            <Typography>{getTimeDisplay(time)}</Typography>
            <IconButton
              color={'primary'}
              onClick={() => onChange(true)}
            >
              <AddIcon />
            </IconButton>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const getTimeDuration = () => {
    const { time } = word;
    if (time) {
      const { start, end } = time;
      if (start !== undefined && end !== undefined) {
        const duration = getTimeDisplay(end - start);
        return `${translate('common.length')}: ${duration}`;
      }
    }
    return undefined;
  };

  const avatarColor: React.CSSProperties = { backgroundColor: word.color };

  return (
    <Card
      elevation={5}
      className={classes.card}
    >
      <CardHeader
        title={word.text}
        titleTypographyProps={{ variant: 'h5' }}
        subheader={getTimeDuration()}
        avatar={<Avatar aria-label="word-color" style={avatarColor} >{''}</Avatar>}
        action={
          <IconButton
            color={'primary'}
            onClick={onClose}
          >
            <CancelIcon />
          </IconButton>
        }
      />
      {word.time &&
        <>
          <CardContent>
            {renderTimeChecker(translate('common.startAt'), handleStartChangeTime, word.time.start)}
            {renderTimeChecker(translate('common.endAt'), handleEndChangeTime, word.time.end)}
          </CardContent>
          <CardActions>
            <Button
              variant='outlined'
              color='primary'
              startIcon={<AddIcon />}
              onClick={() => handleCreate()}
            >
              {translate('common.create')}
            </Button>
          </CardActions>
        </>
      }
    </Card>);
}
