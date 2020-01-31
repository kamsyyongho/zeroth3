import { Box, Chip, Grid, Typography } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import React from 'react';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { useWindowSize } from '../../hooks/window/useWindowSize';
import { CustomTheme } from '../../theme';
import { ModelConfig } from '../../types';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    modelConfigRoot: {
      margin: theme.spacing(1),
      backgroundColor: theme.palette.background.paper,
    },
    modelConfigExpandedDetails: {
      paddingTop: 0,
      paddingBottom: theme.spacing(1),
    },
    text: {
      overflowWrap: 'break-word'
    },
    category: {
      marginRight: theme.spacing(1),
    },
    chip: {
      marginRight: theme.spacing(0.5),
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
    },
    divider: {
      width: '95%',
      height: 1,
      backgroundColor: theme.table.border,
    },
    listItem: {
      width: '100%',
      paddingLeft: 24,
    },
    expandContent: {
      marginBottom: 10,
      paddingLeft: 0,
      paddingRight: 0,
      paddingBottom: 0,
    },
  }),
);

export interface ModelConfigListItemProps {
  modelConfig: ModelConfig;
  setModelConfigToEdit: (modelConfig: ModelConfig) => void;
  openDialog: () => void;
  openConfirm: () => void;
  deleteLoading: boolean;
}


export function ModelConfigListItem(props: ModelConfigListItemProps) {
  const {
    modelConfig,
    setModelConfigToEdit,
    openDialog,
    openConfirm,
    deleteLoading,
  } = props;
  const { acousticModel, languageModel, name, id, thresholdLr, thresholdHr, description } = modelConfig;
  const { translate } = React.useContext(I18nContext);
  const { width } = useWindowSize();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);



  const classes = useStyles();
  const theme: CustomTheme = useTheme();

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>, modelConfig: ModelConfig) => {
    event.stopPropagation();
    setModelConfigToEdit(modelConfig);
    setAnchorEl(event.currentTarget);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
  };

  const openEditDialog = () => {
    handleActionClose();
    openDialog();
  };

  const confirmDelete = () => {
    handleActionClose();
    openConfirm();
  };

  const maxTitleWidth = width ? (width * 0.6) : 500;

  const renderItemMenu = () => (<Menu
    id="list-item-menu"
    anchorEl={anchorEl}
    keepMounted
    open={Boolean(anchorEl)}
    onClose={handleActionClose}
  >
    <MenuItem disabled={deleteLoading} onClick={openEditDialog}>
      <ListItemIcon>
        <EditIcon fontSize="small" />
      </ListItemIcon>
      <Typography variant="inherit">{translate('common.edit')}</Typography>
    </MenuItem>
    <MenuItem onClick={confirmDelete}>
      <ListItemIcon>
        <DeleteIcon fontSize="small" />
      </ListItemIcon>
      <Typography variant="inherit">{translate('common.delete')}</Typography>
    </MenuItem>
  </Menu>);

  const divider = <div className={classes.divider} />;

  return (
    <Box
      key={id}
      border={1}
      borderColor={theme.table.border}
      className={classes.modelConfigRoot}
    >
      <ExpansionPanel elevation={0}>
        <ExpansionPanelSummary
          aria-controls="model-config-expand"
          id="model-config-expand"
          expandIcon={<IconButton
            aria-label="options"
            onFocus={event => event.stopPropagation()}
            onClick={event => handleActionClick(event, modelConfig)} >
            <MoreVertIcon />
          </IconButton>}
        >
          <CardHeader
            title={name}
            titleTypographyProps={{ noWrap: true, style: { maxWidth: maxTitleWidth } }}
            subheader={description}
            subheaderTypographyProps={{ noWrap: true, style: { maxWidth: maxTitleWidth } }}
          />
        </ExpansionPanelSummary>
        <ExpansionPanelDetails
          className={classes.expandContent}
        >
          <Grid
            container
            wrap='nowrap'
            direction='column'
            alignContent='center'
            alignItems='center'
            justify='flex-start'
          >
            <Card
              elevation={0}
              className={classes.listItem}
            >
              <CardContent className={classes.modelConfigExpandedDetails} >
                <Grid
                  container
                  wrap='nowrap'
                  direction='row'
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                >
                  <Typography
                    className={classes.category}
                    variant='subtitle2'
                  >
                    {`${translate('forms.thresholdHr')}:`}
                  </Typography>
                  <Typography color="textSecondary" className={classes.text}>
                    {thresholdHr}
                  </Typography>
                </Grid>
                <Grid
                  container
                  wrap='nowrap'
                  direction='row'
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                >
                  <Typography
                    className={classes.category}
                    variant='subtitle2'
                  >
                    {`${translate('forms.thresholdLr')}:`}
                  </Typography>
                  <Typography color="textSecondary" className={classes.text}>
                    {thresholdLr}
                  </Typography>
                </Grid>
              </CardContent>
            </Card>
            {divider}
            <Card
              elevation={0}
              className={classes.listItem}
            >
              <CardHeader
                title={translate('forms.languageModel')}
                titleTypographyProps={{ variant: 'h6' }}
                subheader={languageModel.name}
              />
              <CardContent>
                <Grid
                  container
                  wrap='nowrap'
                  direction='row'
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                >
                  <Typography
                    className={classes.category}
                    variant='subtitle2'
                  >
                    {`${translate('forms.top')}:`}
                  </Typography>
                  <Typography color="textSecondary" className={classes.text}>
                    {languageModel.topGraph.name}
                  </Typography>
                </Grid>
                <Grid
                  container
                  wrap='nowrap'
                  direction='row'
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                >
                  <Typography
                    className={classes.category}
                    variant='subtitle2'
                  >
                    {`${translate('forms.sub')}:`}
                  </Typography>
                  {languageModel.subGraphs.map((subGraph, index) => <Chip key={index}
                    label={subGraph.name}
                    className={classes.chip}
                  />)}
                </Grid>
              </CardContent>
            </Card>
            {divider}
            <Card
              elevation={0}
              className={classes.listItem}
            >
              <CardHeader
                title={translate('forms.acousticModel')}
                titleTypographyProps={{ variant: 'h6' }}
                subheader={acousticModel.name}
              />
              <CardContent>
                <Grid
                  container
                  wrap='nowrap'
                  direction='row'
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                >
                  <Typography
                    className={classes.category}
                    variant='subtitle2'
                  >
                    {`${translate('forms.sampleRate')}:`}
                  </Typography>
                  <Typography component="p" className={classes.text}>
                    {acousticModel.sampleRate}{' kHz'}
                  </Typography>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          {renderItemMenu()}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    </Box>
  );

}