import { Button, Grid } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'reactn';
import { I18nContext } from '../../../hooks/i18n/I18nContext';

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      minHeight: '100vh',
    },
  }),
);
interface EditorFetchButtonProps {
  onClick: () => void;
}

export function EditorFetchButton(props: EditorFetchButtonProps) {
  const { onClick } = props;
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
