import Button, { ButtonProps } from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import PublishIcon from '@material-ui/icons/Publish';
import React from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { ICONS } from '../../../theme/icons';
import { EDITOR_MODES } from '../Editor';

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
  }),
);

export enum EDITOR_CONTROLS {
  save,
  confirm,
  undo,
  redo,
  edit,
  merge,
  split,
}

const primaryControlOrder = [
  EDITOR_CONTROLS.save,
  EDITOR_CONTROLS.undo,
  EDITOR_CONTROLS.redo,
  EDITOR_CONTROLS.edit,
  EDITOR_CONTROLS.merge,
  EDITOR_CONTROLS.split,
];

const secondaryControlOrder = [
  EDITOR_CONTROLS.confirm,
];

interface EditorControlsProps {
  onModeChange: (newMode: EDITOR_MODES) => void;
  onAction: (confirm?: boolean) => void;
  editorMode: EDITOR_MODES;
  disabledControls?: EDITOR_CONTROLS[];
  loading?: boolean;
}

export const EditorControls = (props: EditorControlsProps) => {
  const { editorMode, onModeChange, onAction, disabledControls = [], loading } = props;
  const { translate } = React.useContext(I18nContext);

  const classes = useStyles();
  const theme = useTheme();

  const renderButton = (label: string, Icon: JSX.Element | null, buttonProps?: ButtonProps, selected?: boolean) => (
    <Button
      key={label}
      {...buttonProps}
      classes={{
        root: selected ? classes.buttonSelected : classes.buttonRoot,
        disabled: classes.buttonDisabled,
      }}
      className={classes.button}
    >
      <Grid
        container
        direction='column'
        alignItems='center'
      >
        {Icon}
        {label}
      </Grid>
    </Button>);

  const renderButtons = (controlOrder: EDITOR_CONTROLS[]) => {
    return controlOrder.map((control) => {
      let label = '';
      let icon: JSX.Element | null = null;
      let props: ButtonProps = {};
      let selected = false;
      switch (control) {
        case EDITOR_CONTROLS.save:
          label = translate('common.save');
          icon = <ICONS.Save />;
          props = {
            onClick: () => onAction(),
            disabled: disabledControls.includes(EDITOR_CONTROLS.save)
          };
          break;
        case EDITOR_CONTROLS.confirm:
          label = translate('editor.confirm');
          icon = <PublishIcon />;
          props = {
            onClick: () => onAction(true),
            disabled: disabledControls.includes(EDITOR_CONTROLS.confirm)
          };
          break;
        case EDITOR_CONTROLS.undo:
          label = translate('editor.undo');
          icon = <ICONS.Undo />;
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
          props = {
            onClick: () => {
              //!
              //TODO
              //do nothing
            },
            disabled: true,
          };
          break;
        case EDITOR_CONTROLS.edit:
          label = translate('editor.edit');
          icon = <ICONS.Edit />;
          selected = editorMode === EDITOR_MODES.edit;
          props = {
            onClick: () => onModeChange(EDITOR_MODES.edit),
          };
          break;
        case EDITOR_CONTROLS.merge:
          label = translate('editor.merge');
          icon = <ICONS.Merge />;
          selected = editorMode === EDITOR_MODES.merge;
          props = {
            onClick: () => onModeChange(EDITOR_MODES.merge),
            disabled: disabledControls.includes(EDITOR_CONTROLS.merge)
          };
          break;
        case EDITOR_CONTROLS.split:
          label = translate('editor.split');
          icon = <ICONS.Split />;
          selected = editorMode === EDITOR_MODES.split;
          props = {
            onClick: () => onModeChange(EDITOR_MODES.split),
            disabled: disabledControls.includes(EDITOR_CONTROLS.split)
          };
          break;
      }
      if (loading) {
        props.disabled = true;
      }
      return renderButton(label, icon, props, selected);
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
    </Grid>
  );
};