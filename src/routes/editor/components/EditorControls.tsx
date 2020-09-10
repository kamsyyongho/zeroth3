import { ClickAwayListener, Popper, SvgIcon, Tooltip, Typography } from '@material-ui/core';
import Button, { ButtonProps } from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Fade from '@material-ui/core/Fade';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import DeveloperModeIcon from '@material-ui/icons/DeveloperMode';
import MultilineChartIcon from '@material-ui/icons/MultilineChart';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import DescriptionIcon from '@material-ui/icons/Description';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import Divider from '@material-ui/core/Divider';
import { default as PublishIcon } from '@material-ui/icons/Publish';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import ToggleIcon from 'material-ui-toggle-icon';
import { AiOutlineColumnWidth } from 'react-icons/ai';
import ScaleLoader from 'react-spinners/ScaleLoader';
import React, { useGlobal } from 'reactn';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { ICONS } from '../../../theme/icons';
import { isMacOs } from '../../../util/misc';
import { ConfidenceSlider } from './ConfidenceSlider';
import { DEFAULT_SHORTCUTS, renderInputCombination, convertKoreanKeyToEnglish } from '../../../constants'
import { SegmentAndWordIndex, Segment, VoiceData } from '../../../types';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      paddingBottom: 1,
      backgroundColor: theme.palette.secondary.dark,
    },
    buttonGroup: {
      height: 60,
    },
    button: {
      border: `0 !important`,
    },
    buttonRoot: {
      color: theme.palette.secondary.contrastText,
      backgroundColor: theme.palette.secondary.dark,
      "&:hover": {
        backgroundColor: theme.palette.secondary.light,
      }
    },
    buttonSelected: {
      color: theme.palette.secondary.contrastText,
      backgroundColor: theme.palette.secondary.light,
      "&:hover": {
        backgroundColor: theme.palette.secondary.light,
      }
    },
    buttonDisabled: {
      color: `${theme.palette.grey[700]} !important`,
    },
    toggle: {
      color: theme.palette.secondary.contrastText,
    },
    popper: {
      zIndex: theme.zIndex.drawer,
    },
    status: {
      color: theme.palette.common.white,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    voiceDataDetail: {
      color: theme.palette.common.white,
      backgroundColor: theme.palette.secondary.dark,
      marginLeft: '20 px',
      display: 'flex',
      flexDirection: 'row',
    },
    voiceDataTypography :{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
    }
  }),
);

export enum EDITOR_CONTROLS {
  approvalRequest,
  save,
  undo,
  redo,
  merge,
  split,
  toggleMore,
  // createWord,
  editSegmentTime,
  setThreshold,
  speaker,
  // debug,
  shortcuts,
  rewindAudio,
  forwardAudio,
  audioPlayPause,
  toggleAutoSeek,
  toggleAutoScroll,
  loop,
}

const EDITOR_STATUS = {
  loading: 'loading',
  saved: 'saved',
  error: 'error',
}

const primaryControlOrder = [
  EDITOR_CONTROLS.save,
  EDITOR_CONTROLS.undo,
  EDITOR_CONTROLS.redo,
  EDITOR_CONTROLS.merge,
  EDITOR_CONTROLS.split,
  EDITOR_CONTROLS.toggleMore,
  // EDITOR_CONTROLS.createWord,
  EDITOR_CONTROLS.editSegmentTime,
  EDITOR_CONTROLS.setThreshold,
  // EDITOR_CONTROLS.debug,
  EDITOR_CONTROLS.shortcuts,
];

const secondaryControlOrder = [
  EDITOR_CONTROLS.approvalRequest,
];

/** keeps track of the editor state for the keyboard listener
 * - outside the component to keep it out of the react lifecycle
 */
let editorInFocus = false;
let shortcutsStack: string[] = [];
let localShortcuts: any = {};

interface EditorControlsProps {
  onCommandClick: (newMode: EDITOR_CONTROLS) => void;
  onConfirm: () => void;
  disabledControls?: EDITOR_CONTROLS[];
  isLoadingAdditionalSegment?: boolean;
  loading?: boolean;
  editorReady?: boolean;
  playingLocation: SegmentAndWordIndex;
  isSegmentUpdateError: boolean;
  editorCommand?: EDITOR_CONTROLS;
  segments: Segment[];
  voiceData: VoiceData;
}

export const EditorControls = (props: EditorControlsProps) => {
  const {
    onCommandClick,
    onConfirm,
    disabledControls = [],
    isLoadingAdditionalSegment,
    loading,
    editorReady,
    playingLocation,
    isSegmentUpdateError,
    editorCommand,
    segments,
    voiceData,
  } = props;
  const { translate, osText } = React.useContext(I18nContext);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [sliderOpen, setSliderOpen] = React.useState(false);
  const [editorDebugMode, setEditorDebugMode] = useGlobal('editorDebugMode');
  const [showEditorPopups, setShowEditorPopups] = useGlobal('showEditorPopups');
  const [editorFocussed, setEditorFocussed] = useGlobal('editorFocussed');
  const [shortcuts, setShortcuts] = useGlobal<any>('shortcuts');
  const [statusEl, setStatusEl] = React.useState<any>();
  const [isVoiceDataDetailOpen, setIsVoiceDataDetailOpen] = React.useState<boolean>(false)
  // const [shortcutsStack, setShortcutStack] = React.useState<string[]>();

  const handleThresholdClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClickAway = () => {
    if (sliderOpen) {
      setAnchorEl(null);
    }
  };

  const handleClick = (command: EDITOR_CONTROLS) => {
    onCommandClick(command);
    if(playingLocation) {
      const playingBlock = document.getElementById(`word-${playingLocation.segmentIndex}-${playingLocation.wordIndex}`);
      const selection = window.getSelection();
      const range = document.createRange();

      if(playingBlock) {
        range.selectNodeContents(playingBlock);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
        playingBlock.focus();
      }
    }
  }

  const open = Boolean(anchorEl);

  const classes = useStyles();
  const theme = useTheme();

  // to prevent the keypress listeners from firing twice
  // the editor will handle the shortcuts when it is focussed
  React.useEffect(() => {
    editorInFocus = !!editorFocussed;
  }, [editorFocussed]);

  const renderButton = (label: string, Icon: JSX.Element | null, tooltipText: string, buttonProps?: ButtonProps, selected?: boolean) => (
    <Button
      key={label}
      {...buttonProps}
      classes={{
        root: selected ? classes.buttonSelected : classes.buttonRoot,
        disabled: classes.buttonDisabled,
      }}
      className={classes.button}
    >
      <Tooltip
        placement='bottom'
        title={tooltipText ? <Typography variant='h6' >{tooltipText}</Typography> : ''}
        arrow={true}
      >
        <Grid
          container
          direction='column'
          alignItems='center'
        >
          {Icon}
          {label}
        </Grid>
      </Tooltip>
    </Button>
  );

  const renderButtons = (controlOrder: EDITOR_CONTROLS[]) => {
    return controlOrder.map((control) => {
      let label = '';
      let tooltipText = '';
      let icon: JSX.Element | null = null;
      let props: ButtonProps = {};
      let selected = false;
      switch (control) {
        case EDITOR_CONTROLS.save:
          label = translate('common.save');
          icon = <ICONS.Save />;
          tooltipText = renderInputCombination(shortcuts.save);
          props = {
            onClick: () => handleClick(EDITOR_CONTROLS.save),
            disabled: disabledControls.includes(EDITOR_CONTROLS.save),
          };
          break;
        case EDITOR_CONTROLS.approvalRequest:
          label = translate('editor.approvalRequest');
          icon = <PublishIcon />;
          props = {
            onClick: onConfirm,
            disabled: segments.length > 0 && disabledControls.includes(EDITOR_CONTROLS.approvalRequest),
          };
          break;
        case EDITOR_CONTROLS.undo:
          label = translate('editor.undo');
          icon = <ICONS.Undo />;
          tooltipText = renderInputCombination(shortcuts.undo);
          props = {
            onClick: () => handleClick(EDITOR_CONTROLS.undo),
            disabled: disabledControls.includes(EDITOR_CONTROLS.undo),
          };
          break;
        case EDITOR_CONTROLS.redo:
          label = translate('editor.redo');
          icon = <ICONS.Redo />;
          tooltipText = renderInputCombination(shortcuts.redo);
          props = {
            onClick: () => handleClick(EDITOR_CONTROLS.redo),
            disabled: disabledControls.includes(EDITOR_CONTROLS.redo),
          };
          break;
        case EDITOR_CONTROLS.merge:
          label = translate('editor.merge');
          icon = <ICONS.Merge />;
          tooltipText = renderInputCombination(shortcuts.merge);
          props = {
            onClick: () => handleClick(EDITOR_CONTROLS.merge),
            disabled: disabledControls.includes(EDITOR_CONTROLS.merge),
          };
          break;
        case EDITOR_CONTROLS.split:
          label = translate('editor.split');
          icon = <ICONS.Split />;
          tooltipText = renderInputCombination(shortcuts.split);
          props = {
            onClick: () => handleClick(EDITOR_CONTROLS.split),
            disabled: disabledControls.includes(EDITOR_CONTROLS.split),
          };
          break;
        case EDITOR_CONTROLS.toggleMore:
          label = translate('editor.toggleMore');
          icon = <ToggleIcon
            on={!!showEditorPopups}
            onIcon={<VisibilityIcon />}
            offIcon={<VisibilityOffIcon />}
          />;
          tooltipText = renderInputCombination(shortcuts.toggleMore);
          selected = !!showEditorPopups;
          props = {
            onClick: () => handleClick(EDITOR_CONTROLS.toggleMore),
            disabled: disabledControls.includes(EDITOR_CONTROLS.toggleMore),
          };
          break;
        // case EDITOR_CONTROLS.createWord:
        //   label = translate('editor.createWord');
        //   icon = <AddIcon />;
        //   props = {
        //     onClick: () => handleClick(EDITOR_CONTROLS.createWord),
        //     disabled: disabledControls.includes(EDITOR_CONTROLS.createWord),
        //   };
        //   break;
        case EDITOR_CONTROLS.editSegmentTime:
          label = translate('editor.editSegmentTime');
          icon = <SvgIcon><AiOutlineColumnWidth /></SvgIcon>;
          tooltipText = renderInputCombination(shortcuts.editSegmentTime);
          props = {
            onClick: () => onCommandClick(EDITOR_CONTROLS.editSegmentTime),
            disabled: disabledControls.includes(EDITOR_CONTROLS.editSegmentTime),
          };
          break;
        case EDITOR_CONTROLS.setThreshold:
          label = translate('editor.wordConfidence');
          icon = <MultilineChartIcon />;
          selected = !!anchorEl;
          props = {
            onClick: (event: React.MouseEvent<HTMLElement>) => {
              handleThresholdClick(event);
              handleClick(EDITOR_CONTROLS.setThreshold);
            },
            disabled: disabledControls.includes(EDITOR_CONTROLS.setThreshold),
          };
          break;
        // case EDITOR_CONTROLS.debug:
        //   label = 'DEBUG';
        //   icon = <DeveloperModeIcon />;
        //   selected = !!editorDebugMode;
        //   props = {
        //     onClick: () => {
        //       setEditorDebugMode(!editorDebugMode);
        //       handleClick(EDITOR_CONTROLS.debug);
        //     },
        //     disabled: disabledControls.includes(EDITOR_CONTROLS.debug),
        //   };
        //   break;
        case EDITOR_CONTROLS.shortcuts:
          label = 'SHORTCUTS';
          icon = <DescriptionIcon />;
          tooltipText= renderInputCombination(shortcuts.shortcuts);
          props = {
            onClick: () => {
              setEditorDebugMode(!editorDebugMode);
              handleClick(EDITOR_CONTROLS.shortcuts);
            },
            disabled: disabledControls.includes(EDITOR_CONTROLS.shortcuts),
          };
          break;
      }
      if (loading || !editorReady) {
        props.disabled = true;
      }
      return renderButton(label, icon, tooltipText, props, selected);
    });
  };

  const renderVoiceDataDetailList = () => {
    const spacingSpan = () =>{ return (<span style={{ width: '20px' }} />)};
    const voiceDataInfo = `${translate('TDP.originalFilename')} : ${voiceData.originalFilename}${<span style={{ width: '20px' }} />}${translate('forms.status')} : ${voiceData.status}${<span style={{ width: '20px' }} />}${translate('TDP.wordCount')} : ${voiceData.wordCount}`

    return (
        <Accordion expanded={isVoiceDataDetailOpen} className={classes.voiceDataTypography} onChange={() => '=========onCHange======='}>
            <Typography className={classes.voiceDataDetail}>
              <p style={{ width: '15px' }} />
              {
                `${translate('TDP.originalFilename')} : ${voiceData.originalFilename}                  `
              }
              <p style={{ width: '30px' }} />
              {
                `${translate('forms.status')} : ${voiceData.status}`
              }
              <p style={{ width: '30px' }} />
              {
                `${translate('TDP.wordCount')} : ${voiceData.wordCount}`
              }
            </Typography>
        </Accordion>
    )
  }

  React.useEffect(() => {
    if(!!editorCommand) {
      switch (editorCommand) {
        case EDITOR_CONTROLS.save:
          handleClick(EDITOR_CONTROLS.save);
          break;
        case EDITOR_CONTROLS.setThreshold:
          handleClick(EDITOR_CONTROLS.setThreshold);
          break;
        default:
          break;
      }
    }

  }, [editorCommand])

  React.useEffect(() => {
    localShortcuts = shortcuts;
  }, [shortcuts]);

  React.useEffect(() => {
    const statusTextEl = (
        <Typography className={classes.status}>
          {translate('forms.status')}
        </Typography>
    )
    if(loading) {
      const loadingEl = (<ScaleLoader
          color={theme.palette.common.white}
          loading={true}
      />);
      setStatusEl(loadingEl);
      setTimeout(() => {
        setStatusEl(statusTextEl);
      }, 1500);
    }
    if(!isSegmentUpdateError) {
      const successEl = (
          <div className={classes.status}>
            <CheckCircleOutlineIcon />
            <Typography className={classes.status}>
              {translate('common.saved')}
            </Typography>
          </div>
      );
      setStatusEl(successEl);
      setTimeout(() => {
        setStatusEl(statusTextEl);
      }, 1500);
    } else if (isSegmentUpdateError) {
      const errorEl = (
          <div className={classes.status}>
            <ErrorOutlineIcon />
            <Typography className={classes.status}>
              {translate('common.error')}
            </Typography>
          </div>
      );
      setStatusEl(errorEl);
      setTimeout(() => {
        setStatusEl(statusTextEl);
      }, 1500);
    }
  }, [loading, isSegmentUpdateError]);

  React.useEffect(() => {
    const statusTextEl = (
        <Typography className={classes.status}>
          {translate('forms.status')}
        </Typography>
    )
    if(isLoadingAdditionalSegment) {
      const loadingEl = (<ScaleLoader
          color={theme.palette.common.white}
          loading={true}
      />);
      setStatusEl(loadingEl);
    } else {
      const successTextEl = (
          <Typography className={classes.status}>
            {translate('editor.loadingAdditonalSegmentSuccess')}
          </Typography>
      )
      setStatusEl(successTextEl);
      setTimeout(() => {
        setStatusEl(statusTextEl);
      }, 2000);
    }
  }, [isLoadingAdditionalSegment])

  // set on mount and reset values on unmount
  React.useEffect(() => {
    return () => {
      setEditorDebugMode(false);
      setShowEditorPopups(false);
      editorInFocus = false;
    };
  }, []);


  return (
      <Grid
          container
          justify='space-between'
          direction="column"
          alignItems="center"
          className={classes.container}
      >
        <Grid
            container
            justify='space-between'
            direction="row"
            alignItems="center"
            className={classes.container}
        >
          <ButtonGroup
              variant="contained"
              aria-label="primary editor buttons"
              className={classes.buttonGroup}
          >
            {renderButtons(primaryControlOrder)}
          </ButtonGroup>
          {/*{loading && <ScaleLoader
      color={theme.palette.common.white}
      loading={true}
    />}*/}

          <IconButton
              onClick={() => setIsVoiceDataDetailOpen(!isVoiceDataDetailOpen)}
              color={"inherit"}
              edge='start'
              // className={classes.menuButton}
          >
            {statusEl}
            {
              isVoiceDataDetailOpen ?
                  <ExpandLessIcon style={{ color: 'white', marginLeft: '10px' }} />
                  :
                  <ExpandMoreIcon style={{ color: 'white', marginLeft: '10px' }} />
            }
          </IconButton>
          <ButtonGroup
              variant="contained"
              aria-label="secondary editor buttons"
              className={classes.buttonGroup}
          >
            {renderButtons(secondaryControlOrder)}
          </ButtonGroup>
          <ClickAwayListener onClickAway={handleClickAway} >
            <Popper open={open} anchorEl={anchorEl} transition className={classes.popper} >
              {({ TransitionProps }) => (
                  <Fade {...TransitionProps} >
                    <ConfidenceSlider
                        isOpen={open}
                        setSliderOpen={setSliderOpen}
                    />
                  </Fade>
              )}
            </Popper>
          </ClickAwayListener>
          <ICONS.Menu/>

        </Grid>
        <Grid
          container
          justify='space-between'
          direction="row"
          alignItems="center"
          className={classes.container} >
          {
            isVoiceDataDetailOpen && renderVoiceDataDetailList()
          }
        </Grid>
      </Grid>

  );
};