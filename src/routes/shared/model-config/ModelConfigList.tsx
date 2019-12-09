import { Container, ListItemSecondaryAction, ListSubheader, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useSnackbar } from 'notistack';
import React from 'react';
import { BulletList } from 'react-content-loader';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { AcousticModel, LanguageModel, ModelConfig, SubGraph, TopGraph } from '../../../types';
import { SnackbarError } from '../../../types/snackbar.types';
import log from '../../../util/log/logger';
import { ConfirmationDialog } from '../ConfirmationDialog';
import { ModelConfigDialog } from './ModelConfigDialog';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      padding: 0,
      marginHorizontal: 0,
      marginBottom: 0,
      marginTop: 20,
    },
    cardContent: {
      padding: 0,
    },
    card: {
      minWidth: 275,
    },
    text: {
      overflowWrap: 'break-word'
    }
  }),
);

export interface ModelConfigListProps {
  projectId: string;
  canModify: boolean;
  modelConfigsLoading: boolean;
  modelConfigs: ModelConfig[];
  topGraphs: TopGraph[];
  subGraphs: SubGraph[];
  acousticModels: AcousticModel[];
  languageModels: LanguageModel[];
  handleModelConfigUpdate: (modelConfig: ModelConfig, isEdit?: boolean) => void;
  handleSubGraphListUpdate: (subGraph: SubGraph, isEdit?: boolean) => void;
  handleAcousticModelCreate: (acousticModel: AcousticModel) => void;
  handleLanguageModelCreate: (languageModel: LanguageModel) => void;
  handleModelConfigDelete: (modelConfigId: string) => void;
}


export function ModelConfigList(props: ModelConfigListProps) {
  const {
    projectId,
    canModify,
    modelConfigsLoading,
    modelConfigs,
    handleModelConfigUpdate,
    handleSubGraphListUpdate,
    handleAcousticModelCreate,
    handleLanguageModelCreate,
    handleModelConfigDelete,
    topGraphs,
    subGraphs,
    languageModels,
    acousticModels
  } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const [configOpen, setCreateOpen] = React.useState(false);
  const [modelConfigToEdit, setModelConfigToEdit] = React.useState<ModelConfig | undefined>(undefined);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>, modelConfig: ModelConfig) => {
    setModelConfigToEdit(modelConfig);
    setAnchorEl(event.currentTarget);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
  };

  const openEditDialog = () => {
    handleActionClose();
    setCreateOpen(true);
  };

  const closeDialog = () => {
    setModelConfigToEdit(undefined);
    setCreateOpen(false);
  };

  const openCreateDialog = () => setCreateOpen(true);

  const confirmDelete = () => {
    handleActionClose();
    setConfirmationOpen(true);
  };

  const closeConfirmation = () => {
    setConfirmationOpen(false);
    setModelConfigToEdit(undefined);
  };

  const handleDelete = async () => {
    if (api && api.modelConfig && modelConfigToEdit) {
      setDeleteLoading(true);
      const modelConfigId = modelConfigToEdit.id;
      closeConfirmation();
      const response = await api.modelConfig.deleteModelConfig(projectId, modelConfigId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        handleModelConfigDelete(modelConfigId);
      } else {
        log({
          file: `ModelConfigList.tsx`,
          caller: `handleDelete - failed to delete model config`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError && snackbarError.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setDeleteLoading(false);
    }
  };

  const classes = useStyles();

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

  const renderListItems = () => modelConfigs.map(modelConfig => {
    const { acousticModel, languageModel, name, id, description } = modelConfig;
    return (
      <Card key={id}>
        <ListItem>
          <ListItemText
            primary={name}
            secondary={description}
          />
          <ListSubheader component='div' >{acousticModel.name}</ListSubheader>
          <ListSubheader component='div' >{languageModel.name}</ListSubheader>
          {canModify && <ListItemSecondaryAction>
            <IconButton edge="end" aria-label="edit" onClick={(event: React.MouseEvent<HTMLButtonElement>) => handleActionClick(event, modelConfig)} >
              <MoreVertIcon />
            </IconButton>
          </ListItemSecondaryAction>}
        </ListItem>
        {renderItemMenu()}
      </Card>
    );
  });

  return (
    <Container maxWidth={false} className={classes.container} >
      <Card>
        <CardHeader
          title={translate("modelConfig.header", { count: modelConfigs.length })}
        />
        {modelConfigsLoading ? <BulletList /> : (
          <>
            <CardContent className={classes.cardContent} >
              <List >
                {renderListItems()}
              </List>
            </CardContent>
            {canModify && <CardActions>
              <Button
                color="primary"
                variant='contained'
                onClick={openCreateDialog}
                startIcon={<AddIcon />}
              >
                {translate('modelConfig.create')}
              </Button>
            </CardActions>}
          </>)}
      </Card>
      <ModelConfigDialog
        projectId={projectId}
        open={configOpen}
        configToEdit={modelConfigToEdit}
        onClose={closeDialog}
        onSuccess={handleModelConfigUpdate}
        topGraphs={topGraphs}
        subGraphs={subGraphs}
        languageModels={languageModels}
        acousticModels={acousticModels}
        handleSubGraphListUpdate={handleSubGraphListUpdate}
        handleAcousticModelCreate={handleAcousticModelCreate}
        handleLanguageModelCreate={handleLanguageModelCreate}
      />
      <ConfirmationDialog
        destructive
        titleText={`${translate('modelConfig.delete')}?`}
        submitText={translate('common.delete')}
        open={confirmationOpen}
        onSubmit={handleDelete}
        onCancel={closeConfirmation}
      />
    </Container>
  );
}