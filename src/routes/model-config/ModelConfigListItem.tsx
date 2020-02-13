/* eslint-disable react/prop-types */
import { Box, Divider, Grid, Grow, TextField, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import clsx from 'clsx';
import React from 'reactn';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { useWindowSize } from '../../hooks/window/useWindowSize';
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
  openConfirm: () => void;
  deleteLoading: boolean;
  expandProps: ModelConfigListItemExpandPropsFromParent;
}


export function ModelConfigListItem(props: ModelConfigListItemProps) {
  const {
    modelConfig,
    setModelConfigToEdit,
    expandProps,
    openConfirm,
    deleteLoading,
  } = props;
  const { acousticModel, languageModel, name, id, progress } = modelConfig;
  const { translate } = React.useContext(I18nContext);
  const { width } = useWindowSize();
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
        <Grid
          container
          item
          wrap='nowrap'
          direction='column'
          alignContent='flex-start'
          alignItems='flex-start'
          justify='center'
          className={classes.headerNameGrid}
          xs={3}
        >

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
        <Grow in={!expanded}>
          <Grid
            container
            item
            wrap='nowrap'
            direction='column'
            alignContent='flex-end'
            alignItems='flex-end'
            justify='center'
            className={classes.headerGrid}
            xs={2}
          >
            <Typography className={classes.subTitle} >{`${translate('forms.languageModel')}:`}</Typography>
            <Typography className={classes.subTitle} >{`${translate('forms.acousticModel')}:`}</Typography>
          </Grid>
        </Grow>
        <Grow in={!expanded}>
          <Grid
            container
            item
            wrap='nowrap'
            direction='column'
            alignContent='flex-start'
            alignItems='flex-start'
            justify='center'
            className={classes.headerGrid}
            xs={3}
          >
            <Typography >{languageModel.name}</Typography>
            <Typography >{acousticModel.name}</Typography>
          </Grid>
        </Grow>
        <Grid
          container
          item
          wrap='nowrap'
          direction='column'
          alignContent='flex-end'
          alignItems='flex-end'
          justify='center'
          xs={3}
        >
          <Grid item>
            <TrainingChip progress={progress} />
          </Grid>
          <Grow in={!expanded}>
            <Grid item>
              <ChipList max={1} light labels={[`${acousticModel.sampleRate} Hz`]} />
            </Grid>
          </Grow>
        </Grid>
        <Grid
          container
          item
          wrap='nowrap'
          direction='column'
          alignContent='center'
          alignItems='center'
          justify='flex-start'
          xs={1}
        >
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
        configToEdit={modelConfig}
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
        {expanded && <Divider className={classes.divider} />}
        {renderExpandedEdit()}
      </Grid>
    </Box>
  );

}