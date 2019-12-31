import { Grid, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { I18nContext } from '../../../hooks/i18n/I18nContext';

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      minHeight: '100vh',
    },
  }),
);

export function EditorNothingToFetch() {
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();

  return (<Grid
    container
    spacing={0}
    direction="column"
    alignItems="center"
    justify="center"
    alignContent='center'
    className={classes.root}
  >
    <Grid item xs={3}>
      <Typography
        variant='h3'
        align='center'
      >
        {translate('editor.nothingToTranscribe')}
      </Typography>
    </Grid>
  </Grid>);
}
