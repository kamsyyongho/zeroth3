import { Avatar, Button, CardContent, CardHeader, Grid, Typography } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import CancelIcon from '@material-ui/icons/Cancel';
import EditIcon from '@material-ui/icons/Edit';
import RemoveIcon from '@material-ui/icons/Remove';
import React from 'react';
import { DEFAULT_EMPTY_TIME } from '../../../constants/misc.constants';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { Segment, Time, Word } from '../../../types';
import { formatSecondsDuration } from '../../../util/misc';
import { TimePickerRootProps } from '../EditorPage';
import { PLAYER_SEGMENT_IDS } from '../../shared/AudioPlayer';

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

interface SegmentTimePickerProps extends TimePickerRootProps {
  segment: Segment;
  segmentToCreateTimeFor: Word;
  onSuccess: (wordToCreate: Word, segment: Segment) => void;
  onClose: () => void;
  onInvalidTime: () => void;
}

/** how much to change the time when pressing the popper buttons */
const DEFAULT_TIME_INCREMENT = 0.01;

const wordKey = PLAYER_SEGMENT_IDS.SEGMENT_EDIT;


export function SegmentTimePicker(props: SegmentTimePickerProps) {
  const {
    timeFromPlayer,
    segment,
    segmentToCreateTimeFor,
    onSuccess,
    onClose,
    onInvalidTime,
    createTimeSection,
    updateTimeSection,
  } = props;
  const { translate } = React.useContext(I18nContext);
  const [segmentWord, setSegmentWord] = React.useState(segmentToCreateTimeFor);

  const createWordSegmentBoundaries = () => {
    createTimeSection(segmentToCreateTimeFor, wordKey);
  };

  const handleCreate = (incomingWordTime?: Time) => {
    const wordToCheck = { ...segmentWord };
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

  // to limit the audio boundaries to be within the word segment, 
  // create initial word segment, and listen for esc key press
  React.useEffect(() => {
    createWordSegmentBoundaries();
    document.addEventListener("keydown", escapeKeyListener);
  }, []);

  // remove listener on unmount
  React.useEffect(() => {
    return () => {
      document.removeEventListener("keydown", escapeKeyListener);
    };
  }, []);

  // to update the internal time when it changes in the player
  React.useEffect(() => {
    if (timeFromPlayer && timeFromPlayer.start && timeFromPlayer.end) {
      setSegmentWord({ ...segmentWord, time: timeFromPlayer });
    }
  }, [timeFromPlayer]);

  const classes = useStyles();

  const changeSegmentTime = (isStartTime: boolean, increment: boolean) => {
    if (!segmentWord) return;
    let start = segmentWord?.time?.start as number;
    let end = segmentWord?.time?.end as number;
    if (typeof start !== 'number' || typeof end !== 'number') return;
    if (isStartTime) {
      start = start + (DEFAULT_TIME_INCREMENT * (increment ? 1 : -1));
      start = Number(start.toFixed(2));
    } else {
      end = end + (DEFAULT_TIME_INCREMENT * (increment ? 1 : -1));
      end = Number(end.toFixed(2));
    }
    const updatedTime: Time = {
      start,
      end,
    };
    const updatedWord = { ...segmentWord, time: updatedTime };
    updateTimeSection(updatedWord, wordKey);
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
    const { time } = segmentWord;
    if (time) {
      const { start, end } = time;
      if (start !== undefined && end !== undefined) {
        const duration = getTimeDisplay(end - start);
        return `${translate('common.length')}: ${duration}`;
      }
    }
    return undefined;
  };

  const avatarColor: React.CSSProperties = { backgroundColor: segmentWord.color };

  return (
    <Card
      elevation={5}
      className={classes.card}
    >
      <CardHeader
        title={segmentWord.text}
        titleTypographyProps={{ variant: 'h5' }}
        subheader={getTimeDuration()}
        avatar={<Avatar aria-label="segmentWord-color" style={avatarColor} >{''}</Avatar>}
        action={
          <IconButton
            color={'primary'}
            onClick={onClose}
          >
            <CancelIcon />
          </IconButton>
        }
      />
      {segmentWord.time &&
        <>
          <CardActions>
            <Button
              variant='outlined'
              color='primary'
              startIcon={<EditIcon />}
              onClick={() => handleCreate()}
            >
              {translate('common.edit')}
            </Button>
          </CardActions>
        </>
      }
    </Card>);
}
