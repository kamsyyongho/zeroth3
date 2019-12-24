import { Button, Grid } from '@material-ui/core';
import React from 'react';
import { I18nContext } from '../../../hooks/i18n/I18nContext';

interface EditorFetchButtonProps {
  onClick: () => void;
}

export function EditorFetchButton(props: EditorFetchButtonProps) {
  const { onClick } = props;
  const { translate } = React.useContext(I18nContext);
  return (<Grid
    container
    spacing={0}
    direction="column"
    alignItems="center"
    justify="center"
    alignContent='center'
    style={{ minHeight: '100vh' }}
  >
    <Grid item xs={3}>
      <Button
        variant='contained'
        color='primary'
        onClick={onClick}
      >
        {translate('editor.fetch')}
      </Button>
    </Grid>
  </Grid>);
}
