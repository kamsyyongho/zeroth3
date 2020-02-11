import { Badge, Button, Grid, Tooltip, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import SvgIcon from '@material-ui/core/SvgIcon';
import clsx from 'clsx';
import { ContentBlock, ContentState, EditorBlock } from 'draft-js';
import { MdPersonAdd, MdPersonPin } from 'react-icons/md';
import VisibilitySensor from "react-visibility-sensor";
import React from 'reactn';
import { CustomTheme } from '../../../theme/index';
import { Segment, SegmentBlockData } from '../../../types';
import { formatSecondsDuration } from '../../../util/misc';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    root: {
      margin: theme.spacing(1),
    },
    hiddenIcon: {
      color: theme.palette.background.paper,
    },
    button: {
      marginLeft: theme.spacing(2),
      textTransform: 'none',
    },
    outlineHidden: {
      borderColor: `${theme.palette.background.paper} !important`,
    },
    infoGrid: {
      marginBottom: theme.spacing(1),
      "&:hover": {
        cursor: 'default',
      }
    },
    block: {
      marginLeft: theme.spacing(1),
    },
    tooltipContent: {
      maxWidth: 'none',
    },
    changedTextBadge: {
      backgroundColor: theme.editor.changes,
    },
    highRistkBadge: {
      marginLeft: theme.spacing(1),
    },
    timeButton: {
      padding: 0,
      margin: 0,
    },
  }),
);

interface VisibilitySensorOffsetShape {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

/** accounts for the editor control bar and audio player */
const DEFAULT_OFFSET: VisibilitySensorOffsetShape = {
  top: 140,
  bottom: 190,
};


interface SegmentBlockSubProps {
  showPopups: boolean;
  /** opens the assign speaker dialog for the segment */
  assignSpeakerForSegment: (segmentId: string) => void;
}

interface SegmentBlockProps extends EditorBlock {
  contentState: ContentState,
  block: ContentBlock,
  blockProps: SegmentBlockSubProps,
}

export const SegmentBlock = (props: SegmentBlockProps) => {
  const classes = useStyles();
  const { blockProps, block } = props;
  const { showPopups, assignSpeakerForSegment } = blockProps;
  const rawBlockData = block.getData();
  const blockData: SegmentBlockData = rawBlockData.toJS();
  const segment = blockData.segment || {} as Segment;
  const { id, transcript, decoderTranscript, start, speaker, highRisk } = segment;
  const displayTextChangedHover = ((transcript?.trim() !== decoderTranscript?.trim()) && !!decoderTranscript?.trim());
  const displayTime = typeof start === 'number' ? formatSecondsDuration(start) : 'calculating...';
  const handleSpeakerPress = () => {
    if (id && assignSpeakerForSegment && typeof assignSpeakerForSegment === 'function') {
      assignSpeakerForSegment(id);
    }
  };
  const iconHidden = !speaker && !showPopups;
  const icon = <SvgIcon className={iconHidden ? classes.hiddenIcon : undefined} fontSize='small' component={speaker ? MdPersonPin : MdPersonAdd} />;
  const speakerButton = (<Button
    size='small'
    startIcon={icon}
    onClick={handleSpeakerPress}
    color={showPopups ? 'primary' : undefined}
    variant={'outlined'}
    disabled={!showPopups}
    className={clsx(classes.button, !showPopups && classes.outlineHidden)}
  >
    {speaker ? (<span
      contentEditable={false} // prevents the editor from placing the cursor within the content
    >
      {speaker}
    </span>)
      : ('')}
  </Button>);

  return (<div
    className={classes.root}
  >
    <Grid
      container
      wrap='nowrap'
      direction='row'
      alignContent='center'
      alignItems='center'
      justify='flex-start'
      className={classes.infoGrid}
    >
      <Button
        disabled
        className={classes.timeButton}
      >
        <Badge
          invisible={!displayTextChangedHover}
          variant="dot"
          color='error'
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          classes={{
            colorError: classes.changedTextBadge,
          }}
        >
          <Badge
            invisible={!highRisk}
            variant="dot"
            color='error'
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            classes={{
              colorError: classes.highRistkBadge,
            }}
          >
            <Typography
              contentEditable={false} // prevents the editor from placing the cursor within the content
            >
              {displayTime}
            </Typography>
          </Badge>
        </Badge>
      </Button>
      <VisibilitySensor
        offset={DEFAULT_OFFSET}
      >
        {({ isVisible }) => {
          let isOpen = false;
          let title: React.ReactNode = '';
          if (isVisible) {
            isOpen = showPopups;
            if (displayTextChangedHover) {
              title = <Typography contentEditable={false} variant='body1' >{decoderTranscript}</Typography>;
            }
          }
          return (<Tooltip
            placement='right-start'
            title={title}
            open={isOpen}
            arrow={false}
            classes={{ tooltip: classes.tooltipContent }}
          >
            {speakerButton}
          </Tooltip>);
        }
        }
      </VisibilitySensor>
    </Grid>
    <div className={classes.block} >
      <EditorBlock {...props} />
    </div>
  </div>
  );
};
