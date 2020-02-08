import { Button, CardContent, CardHeader, Grid, Typography } from '@material-ui/core';
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
import { ICONS } from '../../../theme/icons';
import { Segment, Time } from '../../../types';
import { formatSecondsDuration } from '../../../util/misc';
import { SplitTimePickerRootProps } from '../EditorPage';

const useStyles = makeStyles((theme) =>
  createStyles({
    card: {
      minWidth: 200,
    },
    timeContent: {
      padding: 0,
    },
  }),
);


interface SegmentSplitPickerProps extends SplitTimePickerRootProps {
  segments: Segment[];
  segmentIndex: number;
  onSuccess: (time: number) => void;
  onClose: () => void;
  onInvalidTime: () => void;
}

/** how much to change the time when pressing the popper buttons */
const DEFAULT_TIME_INCREMENT = 0.01;


export function SegmentSplitPicker(props: SegmentSplitPickerProps) {
  const {
    segments,
    segmentIndex,
    onSuccess,
    onClose,
    onInvalidTime,
    segmentSplitTime,
    onCreateSegmentSplitTimeBoundary,
    onSegmentSplitTimeBoundaryCreated,
    onSegmentSplitTimeChanged,
    onSegmentSplitTimeDelete,
  } = props;
  const segment = segments[segmentIndex];
  let initialTime = segmentSplitTime;
  if (segmentSplitTime === undefined) {
    initialTime = segment.start;
  }
  const { translate } = React.useContext(I18nContext);
  const [time, setTime] = React.useState(initialTime as number);

  /**
   * gets any time that is part of the current segment 
   */
  const getSegmentTimeBoundary = () => {
    const { start, length } = segment;
    const end = start + length;
    const time: Required<Time> = {
      start,
      end,
    };
    return time;
  };

  const handleClose = () => {
    onClose();
    onSegmentSplitTimeDelete();
  };


  /**
  * used to close on escape press
 * - the listener doesn't have the most updated values
 * so we will use a variable outside of the component 
 * function's scope that we will keep updated
 */
  const escapeKeyListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  // to limit the audio boundaries to be within the segment, 
  // create initial segment, and listen for esc key press
  React.useEffect(() => {
    const segmentTime = getSegmentTimeBoundary();
    onCreateSegmentSplitTimeBoundary(segmentTime);
    document.addEventListener("keydown", escapeKeyListener);
  }, []);

  // remove listener on unmount
  React.useEffect(() => {
    return () => {
      document.removeEventListener("keydown", escapeKeyListener);
    };
  }, []);


  React.useEffect(() => {
    if (segmentSplitTime !== undefined) {
      setTime(segmentSplitTime);
    }
  }, [segmentSplitTime]);



  const classes = useStyles();
  const theme = useTheme();

  const checkValuesBeforeSubmit = () => {
    const startTime = segment.start;
    const endTime = startTime + segment.length;
    if (time > startTime && time < endTime) {
      onSuccess(time);
      onSegmentSplitTimeDelete();
    } else {
      onInvalidTime();
    }
  };

  const changeSegmentTime = (increment: boolean) => {
    const newTime = time + (DEFAULT_TIME_INCREMENT * (increment ? 1 : -1));
    onSegmentSplitTimeChanged(newTime);
    setTime(newTime);
  };


  const getTimeDisplay = (time?: number) => {
    if (typeof time !== 'number') return DEFAULT_EMPTY_TIME;
    const timeString = time.toFixed(2);
    const decimalIndex = timeString.indexOf('.');
    const decimals = timeString.substring(decimalIndex);
    const formattedTime = formatSecondsDuration(time);
    return formattedTime + decimals;
  };

  const renderTimeChecker = (title: string, time?: number) => {
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
              onClick={() => changeSegmentTime(false)}
            >
              <RemoveIcon />
            </IconButton>
            <Typography>{getTimeDisplay(time)}</Typography>
            <IconButton
              color={'primary'}
              onClick={() => changeSegmentTime(true)}
            >
              <AddIcon />
            </IconButton>
          </Grid>
        </CardContent>
      </Card>
    );
  };



  return (
    <Card
      elevation={5}
      className={classes.card}
    >
      <CardHeader
        title={getTimeDisplay(time)}
        titleTypographyProps={{ variant: 'h5' }}
        action={
          <IconButton
            color={'primary'}
            onClick={handleClose}
          >
            <CancelIcon />
          </IconButton>
        }
      />
      {!!time &&
        <>
          <CardActions>
            <Button
              variant='outlined'
              color='primary'
              startIcon={<ICONS.Split />}
              onClick={checkValuesBeforeSubmit}
            >
              {translate('editor.split')}
            </Button>
          </CardActions>
        </>
      }
    </Card>);
}
