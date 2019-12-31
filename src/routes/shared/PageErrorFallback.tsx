import { Grid, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import WarningIcon from '@material-ui/icons/Warning';
import React from 'react';
import { FallbackProps } from 'react-error-boundary';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../theme';
import log from '../../util/log/logger';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    root: {
      minHeight: '100vh',
    },
    error: {
      color: theme.error,
    },
  }),
);

export const PageErrorFallback = (fallbackProps: FallbackProps) => {
  const { error, componentStack } = fallbackProps;
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();

  //!
  //TODO
  //* DO SOMETHING WITH THE ERROR
  log({
    file: `PageErrorFallback.tsx`,
    caller: `FATAL COMPONENT ERROR:`,
    value: { error: error?.toString(), componentStack },
    important: false,
    trace: false,
    error: false,
    warn: false,
  });

  return (<Grid
    container
    direction='row'
    spacing={1}
    justify='center'
    alignItems='center'
    alignContent='center'
    wrap='nowrap'
    className={classes.root}
  >
    <Grid item>
      <WarningIcon fontSize='large' className={classes.error} />
    </Grid>
    <Grid item>
      <Typography
        variant='h4'
        align='center'
      >
        {translate('common.pageError')}
      </Typography>
    </Grid>
  </Grid>);
};