import { Badge, Button, Grid, Popper, Tooltip, Typography } from '@material-ui/core';
import Fade from '@material-ui/core/Fade';
import Paper from '@material-ui/core/Paper';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import SvgIcon from '@material-ui/core/SvgIcon';
import RecordVoiceOverIcon from '@material-ui/icons/RecordVoiceOver';
import clsx from 'clsx';
import { ContentBlock, ContentState, EditorBlock } from 'draft-js';
import { MdPersonAdd, MdPersonPin } from 'react-icons/md';
import VisibilitySensor from "react-visibility-sensor";
import React, { useGlobal } from 'reactn';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../theme/index';
import { Segment, SegmentBlockData } from '../../../types';
import { formatSecondsDuration } from '../../../util/misc';
import { getIndexOfBlock } from './helpers/segment-block.helper';

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
    popper: {
      zIndex: theme.zIndex.drawer,
    },
    playingIconContainer: {
      padding: 0,
      margin: 0,
      height: 35,
      width: 35,
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


export interface SegmentBlockSubProps {
  readOnly?: boolean;
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
  const [playingBlockIndex, setPlayingBlockIndex] = useGlobal('playingBlockIndex');
  const [showEditorPopups, setShowEditorPopups] = useGlobal('showEditorPopups');
  const { translate } = React.useContext(I18nContext);
  const segmentRef = React.useRef<HTMLButtonElement | null>(null);
  const { contentState, blockProps, block } = props;
  const { readOnly, assignSpeakerForSegment } = blockProps;
  const blockIndex = getIndexOfBlock(contentState, block);
  const rawBlockData = block.getData();
  const blockData: SegmentBlockData = rawBlockData.toJS();
  const segment = blockData.segment || {} as Segment;
  const { id, transcript, decoderTranscript, start, speaker, highRisk } = segment;
  const displayTextChangedHover = (!readOnly && (transcript?.trim() !== decoderTranscript?.trim()) && !!decoderTranscript?.trim());
  const displayTime = typeof start === 'number' ? formatSecondsDuration(start) : `${translate('editor.calculating')}..`;
  const handleSpeakerPress = () => {
    if (id && assignSpeakerForSegment && typeof assignSpeakerForSegment === 'function') {
      assignSpeakerForSegment(id);
    }
  };
  const iconHidden = !speaker && !showEditorPopups;
  const icon = <SvgIcon className={iconHidden ? classes.hiddenIcon : undefined} fontSize='small' component={speaker ? MdPersonPin : MdPersonAdd} />;
  const speakerButton = (<Button
    size='small'
    startIcon={icon}
    onClick={handleSpeakerPress}
    color={showEditorPopups ? 'primary' : undefined}
    variant={'outlined'}
    disabled={!showEditorPopups}
    className={clsx(classes.button, !showEditorPopups && classes.outlineHidden)}
  >
    {speaker ? (<span
      contentEditable={false} // prevents the editor from placing the cursor within the content
    >
      {speaker}
    </span>)
      : ('')}
  </Button>);

  const renderPopper = (curretRef: HTMLButtonElement | null, isPlayingBlock: boolean, isVisible: boolean) => {
    if (!curretRef) {
      return null;
    }
    return (<Popper
      open={isPlayingBlock && !isVisible}
      className={classes.popper}
      anchorEl={segmentRef.current}
      placement="bottom"
      disablePortal={false}
      transition
      modifiers={{
        flip: {
          enabled: true,
        },
        preventOverflow: {
          enabled: true,
          boundariesElement: 'scrollParent',
        },
      }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={100}>
          <Paper className={classes.playingIconContainer} elevation={5}>
            <RecordVoiceOverIcon color='primary' fontSize='large' />
          </Paper>
        </Fade>
      )}
    </Popper>);
  };

  const isPlayingBlock = React.useMemo(() => blockIndex === playingBlockIndex, [playingBlockIndex]);

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
        ref={segmentRef}
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
        scrollCheck
      >
        {({ isVisible }) => {
          let isOpen = false;
          let title: React.ReactNode = '';
          if (isVisible) {
            isOpen = !!showEditorPopups;
            if (displayTextChangedHover) {
              title = <Typography contentEditable={false} variant='body1' >{decoderTranscript}</Typography>;
            }
          }
          return (<>
            <Tooltip
              placement='right-start'
              title={title}
              open={isOpen}
              arrow={false}
              classes={{ tooltip: classes.tooltipContent }}
            >
              {speakerButton}
            </Tooltip>
            {renderPopper(segmentRef.current, isPlayingBlock, isVisible)}
          </>);
        }
        }
      </VisibilitySensor>
    </Grid>
    <div className={classes.block} >
      <EditorBlock {...props} />
    </div>
  </div >
  );
};
