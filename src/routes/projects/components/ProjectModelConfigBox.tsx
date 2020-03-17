import { Box, Button, Grid, Typography } from '@material-ui/core';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import React from 'reactn';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../theme/index';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    infoBox: {
      minHeight: 180,
    },
    modelConfigTextHeading: {
      fontFamily: 'Muli',
      fontWeight: 'bold',
      color: theme.palette.primary.main,
    },
    modelConfigTextContent: {
      fontFamily: 'Lato',
      fontWeight: 600,
      fontSize: 14,
    },
    modelConfigTextGrid: {
      margin: theme.spacing(1),
    },
  }),
);

interface ProjectModelConfigBoxProps {
  hasPermission?: boolean;
  onModelConfigNavigateClick: () => void;
  onModelConfigCreateClick: () => void;
}


export function ProjectModelConfigBox(props: ProjectModelConfigBoxProps) {
  const {
    hasPermission,
    onModelConfigNavigateClick,
    onModelConfigCreateClick,
  } = props;
  const { translate } = React.useContext(I18nContext);

  const classes = useStyles();
  const theme: CustomTheme = useTheme();

  if (!hasPermission) return null;

  return (<Grid
    container
    item
    direction='row'
    component={Box}
    border={1}
    borderColor={theme.table.border}
    xs={5}
    className={classes.infoBox}
  >
    <Grid
      container
      item
      direction='column'
      justify='flex-start'
      alignItems='flex-start'
      alignContent='flex-start'
      xs={6}
      spacing={1}
    >
      <Grid
        item
        className={classes.modelConfigTextGrid}
      >
        <Typography align='left' className={classes.modelConfigTextHeading} >{translate('modelConfig.header')}</Typography>
      </Grid>
      <Grid
        item
        className={classes.modelConfigTextGrid}
      >
        <Typography align='left' className={classes.modelConfigTextContent} >{translate('modelConfig.helpText')}</Typography>
      </Grid>
    </Grid>
    <Grid
      container
      item
      direction='column'
      justify='center'
      alignItems='center'
      alignContent='center'
      xs={6}
      spacing={2}
    >
      <Grid item
      >
        <Button
          color='primary'
          variant='contained'
          onClick={onModelConfigNavigateClick}
        >
          {translate('modelConfig.manage')}
        </Button>
      </Grid>
      <Grid item
      >
        <Button
          color='primary'
          variant='outlined'
          onClick={onModelConfigCreateClick}
        >
          {translate('modelConfig.create')}
        </Button>
      </Grid>
    </Grid>
  </Grid >
  );
};