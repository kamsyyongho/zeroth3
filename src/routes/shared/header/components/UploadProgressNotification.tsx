/* eslint-disable react/display-name */
import { Grid } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import clsx from 'clsx';
import { useSnackbar } from 'notistack';
import React from 'react';
import { ProgressBar } from '../../ProgressBar';

const useStyles = makeStyles((theme) =>
  createStyles({
    card: {
      maxWidth: 500,
      minWidth: 350,
    },
    typography: {
      fontWeight: 'bold',
    },
    uploadFinishedText: {
      color: theme.palette.common.white,
    },
    actionRoot: {
      padding: '8px 8px 8px 16px',
    },
    actionUploading: {
      backgroundColor: theme.palette.grey[300],
    },
    actionUploadFinished: {
      backgroundColor: theme.palette.success.main,
    },
    icons: {
      maxWidth: 120,
    },
    expand: {
      padding: '8px 8px',
      transform: 'rotate(0deg)',
      transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
      }),
    },
    expandOpen: {
      transform: 'rotate(180deg)',
    },
    collapse: {
      padding: 16,
    },
    button: {
      padding: 0,
      textTransform: 'none',
    },
  }),
);

interface UploadProgressNotificationProps {
  key: string | number | undefined;
  message: React.ReactNode;
  progress?: number;
  complete?: boolean;
  onClose?: () => void;
}

export const UploadProgressNotification = React.forwardRef((props: UploadProgressNotificationProps, ref) => {
  const { key, message, progress, complete, onClose } = props;
  const { closeSnackbar } = useSnackbar();
  const [expanded, setExpanded] = React.useState(true);

  const theme = useTheme();
  const classes = useStyles();

  const showProgress = typeof progress === 'number';

  let isComplete = !!complete;
  if(showProgress){
    isComplete = progress === 100;
  }

  const iconStyle: React.CSSProperties | undefined = isComplete ? { color: theme.palette.common.white } : undefined;


  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleDismiss = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
    closeSnackbar(key);
  };

  return (
    <Card className={classes.card} ref={ref}>
      <CardActions classes={{ root: (clsx(classes.actionRoot, isComplete ? classes.actionUploadFinished : classes.actionUploading)) }}>
        <Grid container wrap='nowrap' justify='space-between' alignItems='center' alignContent='center' >
          <Grid container item justify='flex-start' >
            <Typography variant="subtitle2" className={clsx(classes.typography, isComplete && classes.uploadFinishedText)}>{message}</Typography>
          </Grid>
          <Grid container item justify='flex-end' spacing={1} className={classes.icons} >
            {showProgress && <Grid item>
              <IconButton
                aria-label="Show more"
                className={clsx(classes.expand, { [classes.expandOpen]: expanded })}
                onClick={handleExpandClick}
              >
                <ExpandLessIcon style={iconStyle} />
              </IconButton>
            </Grid>}
            <Grid item>
              <IconButton className={classes.expand} onClick={handleDismiss}>
                <CloseIcon style={iconStyle} />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
      </CardActions>
      {showProgress && <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Paper className={classes.collapse}>
          <ProgressBar value={progress ?? 0} maxWidth={400} minWidth={300} />
        </Paper>
      </Collapse>}
    </Card>
  );
});
