/* eslint-disable react/prop-types */
import { Badge, Box, Divider, Grid, Grow, TextField, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import UpdateIcon from '@material-ui/icons/Update';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import clsx from 'clsx';
import React from 'reactn';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../theme';
import { ModelConfig } from '../../types';
import { ChipList } from '../shared/ChipList';
import { TrainingChip } from '../shared/TrainingChip';
import { ModelConfigListItemExpand, ModelConfigListItemExpandPropsFromParent } from './ModelConfigListItemExpand';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    modelConfigRoot: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
      backgroundColor: theme.palette.background.paper,
    },
    configName: {
      fontWeight: 600,
    },
    subTitle: {
      fontWeight: 500,
    },
    headerGrid: {
      padding: theme.spacing(1),
    },
    headerNameGrid: {
      padding: theme.spacing(2),
    },
    hiddenTitle: {
      height: 0,
    },
    divider: {
      width: '100%',
      backgroundColor: theme.table.border,
    },
    fullWidth: {
      width: '100%',
    },
    badgeHeader: {
      alignSelf: 'flex-start',
      marginLeft: '20px',
    },
    badgeHeaderNumber: {
      alignSelf: 'flex-start',
      marginLeft: '40px',
    },
  }),
);

export interface ModelConfigListItemProps {
  index: number;
  modelConfig: ModelConfig;
  setModelConfigToEdit: (modelConfig: ModelConfig) => void;
  openConfirm: () => void;
  deleteLoading: boolean;
  expandProps: ModelConfigListItemExpandPropsFromParent;
  openUpdateDeployment: () => void;
  openDestroyDeploymentConfirmation: () => void;
}


export function ModelConfigListItem(props: ModelConfigListItemProps) {
  const {
    index,
    modelConfig,
    setModelConfigToEdit,
    expandProps,
    openConfirm,
    deleteLoading,
    openUpdateDeployment,
    openDestroyDeploymentConfirmation,
  } = props;
  const { acousticModel, languageModel, name, id, progress } = modelConfig;
  const { translate } = React.useContext(I18nContext);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [nameFormValue, setNameFormValue] = React.useState(name ?? '');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const classes = useStyles();
  const theme: CustomTheme = useTheme();

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>, modelConfig: ModelConfig) => {
    setModelConfigToEdit(modelConfig);
    setAnchorEl(event.currentTarget);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
  };

  const openEditDialog = () => {
    handleActionClose();
    setExpanded(true);
  };

  const closeExpand = () => {
    setExpanded(false);
  };

  const handleCancel = () => {
    setNameFormValue(modelConfig.name);
    closeExpand();
  };

  const confirmDelete = () => {
    handleActionClose();
    openConfirm();
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNameFormValue(event.target.value);
  };

  const handleDeploymentUpdate = () => {
    setModelConfigToEdit(modelConfig);
    openUpdateDeployment();
  };

  const getTrainingStatusText = () => modelConfig.progress < 0 ? translate('models.trainingError') : modelConfig.progress < 100
      ? translate('models.traningInProgress') : translate('models.trainingSuccess');

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
    <MenuItem onClick={handleDeploymentUpdate}>
      <ListItemIcon>
        <UpdateIcon fontSize="small" />
      </ListItemIcon>
      <Typography variant="inherit">{translate('common.updateDeployment')}</Typography>
    </MenuItem>
    <MenuItem onClick={openDestroyDeploymentConfirmation}>
      <ListItemIcon>
        <HighlightOffIcon fontSize="small" />
      </ListItemIcon>
      <Typography variant="inherit">{translate('common.destroy')}</Typography>
    </MenuItem>
  </Menu>);

  const renderHeader = () => {
    return (
      <Grid
        container
        item
        wrap='nowrap'
        direction='row'
        alignContent='center'
        alignItems='center'
        justify='flex-start'
      >
        {
          !expanded &&
              <>
                <Badge
                    color="primary"
                    badgeContent="Status"
                    invisible={!!index}
                    className={classes.badgeHeader}
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }} />
                <Grid
                      container
                      item
                      wrap='nowrap'
                      direction='column'
                      alignContent='flex-start'
                      alignItems='center'
                      justify='center'
                      className={classes.headerGrid}
                      xs={2}
                  >
                    <Typography className={classes.subTitle}>{getTrainingStatusText()}</Typography>
                    <FiberManualRecordIcon fontSize="large" color="primary" />
                  </Grid>
              </>
        }
        <>
          <Badge
              color="primary"
              badgeContent="Name"
              invisible={!!index}
              className={classes.badgeHeader}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }} />
          <Grid
              container
              item
              wrap='nowrap'
              direction='column'
              alignContent='flex-start'
              alignItems='flex-start'
              justify='center'
              className={classes.headerNameGrid}
              xs={4}>
            <Collapse in={!expanded}>
              <Typography className={clsx(classes.configName, expanded && classes.hiddenTitle)} >{nameFormValue}</Typography>
            </Collapse>
            <Collapse in={expanded}>
              <TextField
                  className={clsx(!expanded && classes.hiddenTitle)}
                  helperText={!nameFormValue && translate("forms.validation.required")}
                  error={!nameFormValue}
                  fullWidth
                  onChange={handleNameChange}
                  value={nameFormValue}
              />
            </Collapse>
          </Grid>
        </>

        <>
          <Badge
              color="primary"
              badgeContent="Label"
              invisible={!!index}
              className={classes.badgeHeader}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }} />
          <Grow in={!expanded}>
            <Grid
                container
                item
                wrap='nowrap'
                direction='column'
                alignContent='flex-end'
                alignItems='center'
                justify='center'
                className={classes.headerGrid}
                xs={3}>
              <Typography className={classes.subTitle} >{modelConfig.alias || '-'}</Typography>
            </Grid>
          </Grow>
        </>
        <>
          <Badge
              color="primary"
              badgeContent="Replicas"
              invisible={!!index}
              className={classes.badgeHeaderNumber}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }} />
          <Grow in={!expanded}>
            <Grid
                container
                item
                wrap='nowrap'
                direction='column'
                alignContent='flex-end'
                alignItems='center'
                justify='center'
                className={classes.headerGrid}
                xs={1}>
              <Typography className={classes.subTitle} >{modelConfig.replicas || '-'}</Typography>
            </Grid>
          </Grow>
        </>
        <>
          <Badge
              color="primary"
              badgeContent="Age"
              invisible={!!index}
              className={classes.badgeHeaderNumber}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }} />
          <Grow in={!expanded}>
            <Grid
                container
                item
                wrap='nowrap'
                direction='column'
                alignContent='flex-end'
                alignItems='center'
                justify='center'
                className={classes.headerGrid}
                xs={1}>
              <Typography className={classes.subTitle} >{modelConfig.uptime ? new Date(modelConfig.uptime) : '-'}</Typography>
            </Grid>
          </Grow>
        </>
        <>
          <Badge
              color="primary"
              badgeContent="Rate"
              invisible={!!index}
              className={classes.badgeHeaderNumber}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }} />
          <Grid
              container
              item
              wrap='nowrap'
              direction='column'
              alignContent='flex-end'
              alignItems='center'
              justify='center'
              xs={2}
          >
            <Grow in={!expanded}>
              <Grid item>
                <ChipList max={1} light labels={[`${acousticModel.sampleRate} Hz`]} />
              </Grid>
            </Grow>
          </Grid>
        </>

        <Grid
          container
          item
          wrap='nowrap'
          direction='column'
          alignContent='center'
          alignItems='center'
          justify='flex-start'
          xs={1}>
          {!expanded ? <IconButton
            aria-label="options"
            onClick={event => handleActionClick(event, modelConfig)} >
            <MoreVertIcon />
          </IconButton>
            :
            <Button
              disabled={loading}
              onClick={handleCancel}
              color="primary"
              variant="outlined"
              className={clsx(expanded && classes.headerGrid)}
            >
              {translate('common.close')}
            </Button>}
        </Grid>
        {renderItemMenu()}
      </Grid>);
  };

  const renderExpandedEdit = () => {
    return (<Collapse in={expanded} className={classes.fullWidth} >
      <ModelConfigListItemExpand
        expanded={expanded}
        onLoading={setLoading}
        onClose={closeExpand}
        modelConfig={modelConfig}
        nameFormValue={nameFormValue}
        {...expandProps}
      />
    </Collapse>);
  };

  return (
    <Box
      key={id}
      border={1}
      borderColor={theme.table.border}
      className={classes.modelConfigRoot}
    >
      <Grid
        container
        wrap='nowrap'
        direction='column'
        alignContent='flex-start'
        alignItems='flex-start'
        justify='flex-start'
      >
        {renderHeader()}
        {expanded && <Divider className={classes.divider}/>}
        {renderExpandedEdit()}
      </Grid>
    </Box>
  );

}
