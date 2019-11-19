import { Button, Grid, Typography } from '@material-ui/core';
import React from 'react';
import { Link } from 'react-router-dom';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { PATHS } from '../../types/path.types';

export function Forbidden() {
  const { translate } = React.useContext(I18nContext);

  return (<Grid
    container
    spacing={0}
    direction="column"
    alignItems="center"
    justify="center"
    style={{ minHeight: '100vh' }}
  >
    <Grid item xs={3}>
      <Typography variant='h4' >{translate('common.forbidden')}</Typography>
    </Grid>
    <Grid item xs={3}>
      <Button color='primary' variant='contained' component={Link} to={PATHS.home.to || '/'} >{translate('path.home')}</Button>
    </Grid>
  </Grid>);
}
