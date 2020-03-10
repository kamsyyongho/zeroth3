import { Popper, Tooltip, Typography } from '@material-ui/core';
import Fade from '@material-ui/core/Fade';
import Paper from '@material-ui/core/Paper';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import RecordVoiceOverIcon from '@material-ui/icons/RecordVoiceOver';
import { ContentState, DraftEntityMutability } from 'draft-js';
import VisibilitySensor from 'react-visibility-sensor';
import React, { useGlobal } from 'reactn';
import { useWindowSize } from '../../../hooks/window/useWindowSize';
import { CustomTheme } from '../../../theme/index';
import { DEFAULT_OFFSET, ENTITY_TYPE, LOCAL_STORAGE_KEYS, MUTABILITY_TYPE, WordAlignmentEntityData } from '../../../types';
import { checkLocationOnScreenAndScroll } from './helpers/entity-content.helper';

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
    },
    block: {
      marginLeft: theme.spacing(1),
    },
    tooltipContent: {
      maxWidth: 'none',
    },
    mutable: {
      backgroundImage: theme.editor.entityGradient,
      padding: '2px 0',
    },
    mutableLongWord: {
      backgroundColor: theme.editor.entity,
      padding: '2px 0',
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

function getEntityClassName(mutability: DraftEntityMutability, classes: any, isLongWord?: boolean) {
  switch (mutability) {
    case MUTABILITY_TYPE.IMMUTABLE:
      return classes.mutable;
    case MUTABILITY_TYPE.MUTABLE:
      if (isLongWord) {
        return classes.mutableLongWord;
      }
      return classes.mutable;
    case MUTABILITY_TYPE.SEGMENTED:
      return classes.mutable;
    default:
      return undefined;
  }
}

interface EntityContentProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  contentState: ContentState,
  blockKey: string,
  offsetKey: string,
  entityKey: string,
  decoratedText: string,
  start: number,
  end: number,
}


export const EntityContent = (props: EntityContentProps) => {
  const { contentState, offsetKey, entityKey } = props;
  const [wordConfidenceThreshold, setWordConfidenceThreshold] = useGlobal('wordConfidenceThreshold');
  const [editorAutoScrollDisabled, setEditorAutoScrollDisabled] = useGlobal('editorAutoScrollDisabled');
  const [editorDebugMode, setEditorDebugMode] = useGlobal('editorDebugMode');
  const [playingWordKey, setPlayingWordKey] = useGlobal('playingWordKey');
  const [editorContentHeight, setEditorContentHeight] = useGlobal('editorContentHeight');
  const segmentRef = React.useRef<HTMLButtonElement | null>(null);
  const classes = useStyles();
  const windowSize = useWindowSize();
  const windowHeight = windowSize.height;
  const theme: CustomTheme = useTheme();
  const tokenEntity = contentState.getEntity(entityKey);
  const type = tokenEntity.getType();
  const mutability = tokenEntity.getMutability();
  const targetData: WordAlignmentEntityData = tokenEntity.getData();
  const { wordAlignment, wordKey } = targetData;
  const isLongWord = wordAlignment.word.length > 15;
  const confidence = wordAlignment?.confidence ?? 0;
  const LC = confidence < (wordConfidenceThreshold ?? 0.85);
  const entityClassName = getEntityClassName(mutability, classes, isLongWord);

  const editorElement = React.useMemo(() => document.querySelector('#scroll-container'), []);
  const playing = React.useMemo(() => playingWordKey === wordKey, [playingWordKey]);

  let style: React.CSSProperties = {};
  if (LC) {
    style = { backgroundImage: theme.editor.LowConfidenceGradient };
  }
  if (type === ENTITY_TYPE.TEMP) {
    style = { ...style, backgroundColor: theme.editor.highlight };
  }
  if (playing) {
    style = {
      ...style,
      color: theme.editor.playing,
      boxShadow: theme.editor.playingShadow,
    };
    checkLocationOnScreenAndScroll(segmentRef.current, editorElement, editorContentHeight, windowHeight, editorAutoScrollDisabled);
  }

  React.useEffect(() => {
    if (typeof wordConfidenceThreshold !== 'number') {
      // use saved value on initial load
      const savedThreshold = localStorage.getItem(LOCAL_STORAGE_KEYS.WORD_CONFIDENCE_THRESHOLD);
      if (typeof Number(savedThreshold) === 'number') {
        setWordConfidenceThreshold(Number(savedThreshold));
      }
    }
  }, []);


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

  const content = (
    <VisibilitySensor
      offset={DEFAULT_OFFSET}
      scrollCheck
    >
      {({ isVisible }) => {
        return (<span ref={segmentRef} data-offset-key={offsetKey} className={entityClassName} style={style}>
          {props.children}
          {renderPopper(segmentRef.current, !isVisible, !playing)}
        </span>);
      }
      }
    </VisibilitySensor>);

  if (editorDebugMode) {
    const timeText = `start: ${wordAlignment?.start}, length: ${wordAlignment?.length}`;
    return <Tooltip
      placement='bottom'
      title={<Typography variant='body1' >{timeText}</Typography>}
      arrow={true}
      classes={{ tooltip: classes.tooltipContent }}
    >
      {content}
    </Tooltip>;
  }

  return (content);
};
