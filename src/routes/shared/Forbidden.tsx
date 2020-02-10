import { Button, Grid, Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
import React from 'reactn';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { PATHS } from '../../types/path.types';

interface ForbiddenProps {
  text?: string;
  link?: string;
  CustomComponent?: React.ComponentType;
}

export function Forbidden(props: ForbiddenProps) {
  const { text, link, CustomComponent } = props;
  const { translate } = React.useContext(I18nContext);

  if (CustomComponent) {
    return <CustomComponent />;
  }

  return (<Grid
    container
    spacing={0}
    direction="column"
    alignItems="center"
    justify="center"
    style={{ minHeight: '100vh' }}
  >
    <Grid item xs={3}>
      <Typography variant='h4' >{text || `403 ${translate('common.forbidden')}`}</Typography>
    </Grid>
    <Grid item xs={3}>
      <Button color='primary' variant='contained' component={Link} to={link ? link : (PATHS.home.to || '/')} >{translate('path.home')}</Button>
    </Grid>
  </Grid>);
}
