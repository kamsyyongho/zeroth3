import { ClickAwayListener, Popper, Tooltip, Typography } from '@material-ui/core';
import Button, { ButtonProps } from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Fade from '@material-ui/core/Fade';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import DeveloperModeIcon from '@material-ui/icons/DeveloperMode';
import MultilineChartIcon from '@material-ui/icons/MultilineChart';
import { default as PublishIcon } from '@material-ui/icons/Publish';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import ToggleIcon from 'material-ui-toggle-icon';
import React from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { ICONS } from '../../../theme/icons';
import { ConfidenceSlider } from './ConfidenceSlider';

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
      zIndex: 100,
    },
  }),
);

export enum EDITOR_CONTROLS {
  confirm,
  save,
  undo,
  redo,
  merge,
  split,
  toggleMore,
  createWord,
  setThreshold,
  debug,
}

const primaryControlOrder = [
  EDITOR_CONTROLS.save,
  EDITOR_CONTROLS.undo,
  EDITOR_CONTROLS.redo,
  EDITOR_CONTROLS.merge,
  EDITOR_CONTROLS.split,
  EDITOR_CONTROLS.toggleMore,
  EDITOR_CONTROLS.createWord,
  EDITOR_CONTROLS.setThreshold,
  EDITOR_CONTROLS.debug,
];

const secondaryControlOrder = [
  EDITOR_CONTROLS.confirm,
];

interface EditorControlsProps {
  onCommandClick: (newMode: EDITOR_CONTROLS) => void;
  onConfirm: () => void;
  disabledControls?: EDITOR_CONTROLS[];
  editorOptionsVisible: boolean;
  debugMode?: boolean;
  toggleDebugMode: () => void;
  loading?: boolean;
  editorReady?: boolean;
  wordConfidenceThreshold: number;
  onThresholdChange: (threshold: number) => void;
}

export const EditorControls = (props: EditorControlsProps) => {
  const {
    onCommandClick,
    onConfirm,
    disabledControls = [],
    editorOptionsVisible,
    debugMode,
    toggleDebugMode,
    loading,
    editorReady,
    wordConfidenceThreshold,
    onThresholdChange,
  } = props;
  const { translate, osText } = React.useContext(I18nContext);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [sliderOpen, setSliderOpen] = React.useState(false);

  const handleThresholdClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClickAway = () => {
    if (sliderOpen) {
      setAnchorEl(null);
    }
  };

  const open = Boolean(anchorEl);

  const classes = useStyles();
  const theme = useTheme();

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
          props = {
            onClick: () => onCommandClick(EDITOR_CONTROLS.save),
            disabled: disabledControls.includes(EDITOR_CONTROLS.save) || !editorReady,
          };
          break;
        case EDITOR_CONTROLS.confirm:
          label = translate('editor.confirm');
          icon = <PublishIcon />;
          props = {
            onClick: onConfirm,
            disabled: disabledControls.includes(EDITOR_CONTROLS.confirm) || !editorReady,
          };
          break;
        case EDITOR_CONTROLS.undo:
          label = translate('editor.undo');
          icon = <ICONS.Undo />;
          tooltipText = osText('undo');
          props = {
            onClick: () => {
              //!
              //TODO
              //do nothing
            },
            disabled: true,
          };
          break;
        case EDITOR_CONTROLS.redo:
          label = translate('editor.redo');
          icon = <ICONS.Redo />;
          tooltipText = osText('redo');
          props = {
            onClick: () => {
              //!
              //TODO
              //do nothing
            },
            disabled: true,
          };
          break;
        case EDITOR_CONTROLS.merge:
          label = translate('editor.merge');
          icon = <ICONS.Merge />;
          tooltipText = osText('merge');
          props = {
            onClick: () => onCommandClick(EDITOR_CONTROLS.merge),
            disabled: disabledControls.includes(EDITOR_CONTROLS.merge) || !editorReady,
          };
          break;
        case EDITOR_CONTROLS.split:
          label = translate('editor.split');
          icon = <ICONS.Split />;
          tooltipText = osText('split');
          props = {
            onClick: () => onCommandClick(EDITOR_CONTROLS.split),
            disabled: disabledControls.includes(EDITOR_CONTROLS.split) || !editorReady,
          };
          break;
        case EDITOR_CONTROLS.toggleMore:
          label = translate('editor.toggleMore');
          icon = <ToggleIcon
            on={editorOptionsVisible}
            onIcon={<VisibilityIcon />}
            offIcon={<VisibilityOffIcon />}
          />;
          tooltipText = osText('toggleMore');
          selected = editorOptionsVisible;
          props = {
            onClick: () => onCommandClick(EDITOR_CONTROLS.toggleMore),
            disabled: disabledControls.includes(EDITOR_CONTROLS.toggleMore) || !editorReady,
          };
          break;
        case EDITOR_CONTROLS.createWord:
          label = translate('editor.createWord');
          icon = <AddIcon />;
          tooltipText = osText('createWord');
          props = {
            onClick: () => onCommandClick(EDITOR_CONTROLS.createWord),
            disabled: disabledControls.includes(EDITOR_CONTROLS.createWord) || !editorReady,
          };
          break;
        case EDITOR_CONTROLS.setThreshold:
          label = translate('editor.wordConfidence');
          icon = <MultilineChartIcon />;
          selected = !!anchorEl;
          props = {
            onClick: (event: React.MouseEvent<HTMLElement>) => {
              handleThresholdClick(event);
              onCommandClick(EDITOR_CONTROLS.setThreshold);
            },
            disabled: disabledControls.includes(EDITOR_CONTROLS.setThreshold) || !editorReady,
          };
          break;
        case EDITOR_CONTROLS.debug:
          label = 'DEBUG';
          icon = <DeveloperModeIcon />;
          selected = !!debugMode;
          props = {
            onClick: () => {
              toggleDebugMode();
              onCommandClick(EDITOR_CONTROLS.debug);
            },
            disabled: disabledControls.includes(EDITOR_CONTROLS.debug) || !editorReady,
          };
          break;
      }
      if (loading) {
        props.disabled = true;
      }
      return renderButton(label, icon, tooltipText, props, selected);
    });
  };

  return (
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
      {loading && <ScaleLoader
        color={theme.palette.common.white}
        loading={true}
      />}
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
                wordConfidenceThreshold={wordConfidenceThreshold}
                onThresholdChange={onThresholdChange}
                isOpen={open}
                setSliderOpen={setSliderOpen}
              />
            </Fade>
          )}
        </Popper>
      </ClickAwayListener>
    </Grid>
  );
};