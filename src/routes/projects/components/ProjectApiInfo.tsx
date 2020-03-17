import { Box, Grid, TextField, Typography } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import CachedIcon from '@material-ui/icons/Cached';
import clsx from 'clsx';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../theme/index';
import { Project } from '../../../types';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    infoBox: {
      minHeight: 180,
    },
    boxSpacing: {
      marginRight: theme.spacing(1),
    },
    apiHeading: {
      minWidth: 75,
      margin: theme.spacing(1),
    },
    apiInfo: {
      minWidth: 250,
      backgroundColor: theme.palette.grey[200],
    },
    refreshButton: {
      marginTop: theme.spacing(1),
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
  }),
);

interface ProjectApiInfoProps {
  project: Project;
  loading?: boolean;
  onClick: () => void;
}


export function ProjectApiInfo(props: ProjectApiInfoProps) {
  const {
    project,
    loading,
    onClick,
  } = props;
  const { translate } = React.useContext(I18nContext);

  const classes = useStyles();
  const theme: CustomTheme = useTheme();

  return (<Grid
    container
    item
    direction='column'
    component={Box}
    border={1}
    borderColor={theme.table.border}
    xs={5}
    className={clsx(classes.infoBox, classes.boxSpacing)}
  >
    <Grid
      container
      item
      direction='row'
      justify='flex-start'
      alignItems='center'
      alignContent='center'
    >
      <Typography align='left' className={classes.apiHeading} >{translate('projects.apiKey')}</Typography>
      <TextField
        id="api-key"
        value={project?.apiKey ?? ""}
        className={clsx(classes.textField, classes.apiInfo)}
        margin="normal"
        InputProps={{
          readOnly: true,
        }}
        variant="outlined"
      />
    </Grid>
    <Grid
      container
      item
      justify='flex-start'
      alignItems='center'
      alignContent='center'
    >
      <Typography align='left' className={classes.apiHeading} >{translate('projects.apiSecret')}</Typography>
      <TextField
        id="api-secret"
        value={project?.apiSecret ?? ""}
        className={clsx(classes.textField, classes.apiInfo)}
        margin="normal"
        InputProps={{
          readOnly: true,
        }}
        variant="outlined"
      />
      <IconButton
        disabled={loading}
        color={'primary'}
        onClick={onClick}
        className={classes.refreshButton}
      >
        {loading ? <MoonLoader
          sizeUnit={"px"}
          size={15}
          color={theme.palette.primary.main}
          loading={true}
        /> : <CachedIcon />}
      </IconButton>
    </Grid>
  </Grid>
  );
};