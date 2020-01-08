import { Avatar, Button, CardActions, CardContent, CardHeader, Grid, Typography } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import Fade from '@material-ui/core/Fade';
import IconButton from '@material-ui/core/IconButton';
import Popper from '@material-ui/core/Popper';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import React from 'react';
import { DEFAULT_EMPTY_TIME } from '../../../constants';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { Word } from '../../../types';
import { formatSecondsDuration } from '../../../util/misc';


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

interface HighRiskSegmentWordPopperProps {
  isOpen: boolean;
  word: Word;
  anchorEl: HTMLElement | null;
  timeout: number;
  createSegment: () => void;
  deleteWord: () => void;
  handlePopperClose: () => void;
  changeSegmentTime: (isStart: boolean, increment: boolean) => void;
}

export function HighRiskSegmentWordPopper(props: HighRiskSegmentWordPopperProps) {
  const {
    isOpen,
    word,
    anchorEl,
    timeout,
    createSegment,
    deleteWord,
    handlePopperClose,
    changeSegmentTime,
  } = props;
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();

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

  return (<Popper open={isOpen} anchorEl={anchorEl} placement={'bottom'} transition style={{ marginBottom: 25 }}>
    {({ TransitionProps }) => {
      if (!word) return null;
      const avatarColor: React.CSSProperties = { backgroundColor: word.color };
      return (
        <Fade {...TransitionProps} timeout={timeout}>
          <Card
            elevation={5}
            className={classes.card}
          >
            <CardHeader
              title={word.range.text}
              titleTypographyProps={{ variant: 'h5' }}
              subheader={getTimeDuration()}
              avatar={<Avatar aria-label="word-color" style={avatarColor} >{''}</Avatar>}
            />
            <CardContent>
              {word.time ?
                (<>
                  {renderTimeChecker(translate('common.startAt'), handleStartChangeTime, word.time.start)}
                  {renderTimeChecker(translate('common.endAt'), handleEndChangeTime, word.time.end)}
                </>)
                :
                (<Button onClick={createSegment} >CREATE</Button>)
              }
            </CardContent>
            <CardActions>
              <Button onClick={deleteWord} >Delete</Button>
              <Button onClick={handlePopperClose} >Close</Button>
            </CardActions>
          </Card>
        </Fade>
      );
    }}
  </Popper>);
}
