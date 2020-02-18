import { Avatar, Button, CardHeader } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import CancelIcon from '@material-ui/icons/Cancel';
import DoneIcon from '@material-ui/icons/Done';
import React from 'reactn';
import { DEFAULT_EMPTY_TIME } from '../../../constants/misc.constants';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { PLAYER_SEGMENT_IDS, Segment, Time, Word } from '../../../types';
import { formatSecondsDuration } from '../../../util/misc';
import { TimePickerRootProps } from '../EditorPage';

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

  const getTimeDisplay = (time?: number) => {
    if (typeof time !== 'number') return DEFAULT_EMPTY_TIME;
    const timeString = time.toFixed(2);
    const decimalIndex = timeString.indexOf('.');
    const decimals = timeString.substring(decimalIndex);
    const formattedTime = formatSecondsDuration(time);
    return formattedTime + decimals;
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
              startIcon={<DoneIcon />}
              onClick={() => handleCreate()}
            >
              {translate('common.edit')}
            </Button>
          </CardActions>
        </>
      }
    </Card>);
}
