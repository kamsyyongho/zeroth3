import { Snackbar } from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import clsx from 'clsx';
import React from 'react';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { SnackbarContext } from '../../hooks/snackbar/SnackbarContext';

const useStyles = makeStyles((theme: Theme) => ({
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing(1),
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
}));


export function AppSnackbar() {
  const { snackbarOpen, closeSnackbar, isError, errorText } = React.useContext(SnackbarContext);
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      open={snackbarOpen}
      onClose={closeSnackbar}
      autoHideDuration={isError ? 5000 : 2500}
      aria-describedby="client-snackbar"
      message={
        <span id="client-snackbar" className={classes.message}>
          {isError ? <ErrorIcon className={clsx(classes.icon, classes.iconVariant)} /> :
            <CheckCircleIcon className={clsx(classes.icon, classes.iconVariant)} />}
          {isError ? errorText : translate(isError ? 'common.error' : 'common.success')}
        </span>
      }
    />
  );
}