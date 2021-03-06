import { Container, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import { useSnackbar } from 'notistack';
import { BulletList } from 'react-content-loader';
import React from 'reactn';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../theme';
import {
  AcousticModel,
  LanguageModel,
  ModelConfig,
  Capacity,
  Project,
  SubGraph,
  TopGraph } from '../../types';
import { SnackbarError, SNACKBAR_VARIANTS } from '../../types/';
import { PATHS } from '../../types/path.types';
import log from '../../util/log/logger';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { Breadcrumb, HeaderBreadcrumbs } from '../shared/HeaderBreadcrumbs';
import { ModelConfigDialog } from './ModelConfigDialog';
import { ModelConfigListItem } from './ModelConfigListItem';
import { ImportConfigDialog } from './ImportConfigDialog';
import {SelectFormField, SelectFormFieldOptions} from "../shared/form-fields/SelectFormField";
import {UpdateDeploymentDialog} from './UpdateDeploymentDialog';
import RefreshIcon from '@material-ui/icons/Refresh';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    card: {
      backgroundColor: theme.palette.background.default,
    },
    cardContent: {
      padding: 0,
    },
    headerAction: {
      alignSelf: 'auto',
      marginTop: '0px',
      marginRight: '0px',
    },
    capacity: {
      marginBottom: '20px',
    }
  }),
);

export interface ModelConfigListProps {
  project: Project;
  canModify: boolean;
  modelConfigsLoading: boolean;
  modelConfigs: ModelConfig[];
  capacity?: Capacity;
  topGraphs: TopGraph[];
  subGraphs: SubGraph[];
  acousticModels: AcousticModel[];
  // languageModels: LanguageModel[];
  handleImportSuccess: (modelConfig: ModelConfig) => void;
  handleModelConfigUpdate: (modelConfig: ModelConfig, isEdit?: boolean) => void;
  handleSubGraphListUpdate: (subGraph: SubGraph, isEdit?: boolean) => void;
  // handleLanguageModelCreate: (languageModel: LanguageModel) => void;
  handleModelConfigDelete: (modelConfigId: string) => void;
  handleModelUpdateSuccess: (modelConfig: ModelConfig) => void;
  getModelConfigs: () => void;
  getCapacity: () => void;
  setModelConfigsLoading: (loading: boolean) => void;
}


export function ModelConfigList(props: ModelConfigListProps) {
  const {
    project,
    canModify,
    modelConfigsLoading,
    modelConfigs,
    capacity,
    handleImportSuccess,
    handleModelConfigUpdate,
    handleSubGraphListUpdate,
    handleModelConfigDelete,
    topGraphs,
    subGraphs,
    acousticModels,
    handleModelUpdateSuccess,
    getModelConfigs,
    getCapacity,
    setModelConfigsLoading,
  } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [modelConfigToEdit, setModelConfigToEdit] = React.useState<ModelConfig | undefined>(undefined);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [organizationConfigSelectOptions, setOrganizationConfigSelectOptions] = React.useState<SelectFormFieldOptions>([]);
  const [confirmationTitle, setConfirmationTitle] = React.useState('');
  const [handleConfirmation, setHandleConfirmation] = React.useState<any>();
  const [isUpdateDeploymentOpen, setIsUpdateDeploymentOpen] = React.useState(false);
  const [isUpdateDeployment, setIsUpdateDeployment] = React.useState(true);

  const openDialog = () => setDialogOpen(true);

  const openConfirm = () => setConfirmationOpen(true);

  const closeDialog = () => {
    setDialogOpen(false);
    setModelConfigToEdit(undefined);
  };

  const openCreateDialog = () => {
    // to ensure that the there is nothing passed to the dialog
    setModelConfigToEdit(undefined);
    openDialog();
  };

  const openImportDialog = async () => {
    if(api?.modelConfig) {
      const response = await api.modelConfig?.getOrganizationModelConfigs(project.id);
      if(response.kind === 'ok') {
         setOrganizationConfigSelectOptions(response.modelConfigs.map(model => ({
           label: `${translate('forms.name')} : ${model.name}`,
           label2: `${translate('forms.description')} : ${model.description || '-'}`,
           value: model.id
         })));
      } else {
        log({
          file: 'ImportConfigDialog.tsx',
          caller: 'initOrganizationModelConfig - failed to get organization model config',
          value: response,
        });
      }
    }
    setIsImportOpen(true);
  };

  const closeConfirmation = () => {
    setConfirmationOpen(false);
    setConfirmationTitle('');
    setHandleConfirmation(null);
    setModelConfigToEdit(undefined);
  };

  const handleDelete = async () => {
    if (api?.modelConfig && modelConfigToEdit) {
      setDeleteLoading(true);
      const modelConfigId = modelConfigToEdit.id;
      closeConfirmation();
      const response = await api.modelConfig.deleteModelConfig(project.id, modelConfigId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        const updateModelConfig = Object.assign({}, modelConfigToEdit, {replicas: null, uptime: null});
        handleModelUpdateSuccess(updateModelConfig);
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
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
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      closeConfirmation();
      setDeleteLoading(false);
    }
  };

  const handleDestroyModelDeployment = async () => {
    if (api?.modelConfig && modelConfigToEdit) {
      setDeleteLoading(true);
      const modelConfigId = modelConfigToEdit.id;
      closeConfirmation();
      const response = await api.modelConfig.destroyDeployment(project.id, modelConfigId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
      } else {
        log({
          file: `ModelConfigList.tsx`,
          caller: `handleDestroyModelDeployment - failed to destroy model deployment`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      closeConfirmation();
      setDeleteLoading(false);
    }
  };

  const openUpdateDeploymentDialog = () => {
    setIsUpdateDeployment(true);
    setIsUpdateDeploymentOpen(true);
  }

  const classes = useStyles();

  const openDeleteConfirmation = () => {
    setConfirmationTitle(`${translate('modelConfig.delete')}?`);
    setHandleConfirmation(() => handleDelete);
    setConfirmationOpen(true);
  };

  const openDestroyDeploymentConfirmation = () => {
    setConfirmationTitle(translate('modelConfig.destroyDeployment'));
    setHandleConfirmation(() => handleDestroyModelDeployment);
    setConfirmationOpen(true);
  }

  const openDeployModelDialog = () => {
    setIsUpdateDeployment(false);
    setIsUpdateDeploymentOpen(true);
  };

  const renderListItems = () => {
    if (!modelConfigs.length) {
      return <Typography align='center' >{translate('modelConfig.noResults')}</Typography>;
    }
    return modelConfigs.map((modelConfig, index) => {
      return (
        <ModelConfigListItem
          key={`model-config-${index}`}
          index={index}
          modelConfig={modelConfig}
          setModelConfigToEdit={setModelConfigToEdit}
          openModelDeleteConfirmation={openDeleteConfirmation}
          openDestroyDeploymentConfirmation={openDestroyDeploymentConfirmation}
          openUpdateDeployment={openUpdateDeploymentDialog}
          openDeployModelDialog={openDeployModelDialog}
          deleteLoading={deleteLoading}
          expandProps={{
            projectId: project.id,
            onSuccess: handleModelConfigUpdate,
            topGraphs: topGraphs,
            subGraphs: subGraphs,
            acousticModels: acousticModels,
            handleSubGraphListUpdate: handleSubGraphListUpdate,
          }}
        />
      );
    });
  };

  const refreshModelConfigs = async () => {
    setModelConfigsLoading(true);
    await getModelConfigs();
    await getCapacity();
    setModelConfigsLoading(false)
  }

  const breadcrumbs: Breadcrumb[] = [
    {
      to: PATHS.project.function && PATHS.project.function(project.id),
      rawTitle: project.name,
    },
    {
      rawTitle: translate("modelConfig.header", { count: modelConfigs.length }),
    },
  ];

  return (
    <Container >
      <Card elevation={0} className={classes.card} >
        <CardHeader
          classes={{ action: classes.headerAction }}
          title={<HeaderBreadcrumbs breadcrumbs={breadcrumbs} />}
          action={canModify &&
          <>
            <Button
                color="primary"
                variant='outlined'
                style={{ marginRight: '10px' }}
                onClick={refreshModelConfigs}
                startIcon={<RefreshIcon />}
            >
              {translate('common.refresh')}
            </Button>
            <Button
                color="primary"
                variant='outlined'
                onClick={openCreateDialog}
                startIcon={<AddIcon />}
            >
              {translate('modelConfig.create')}
            </Button>
            <Button
                color="primary"
                variant='outlined'
                style={{ marginLeft: '10px' }}
                onClick={openImportDialog}
                startIcon={<AddIcon />}
            >
              {translate('modelConfig.import')}
            </Button>
          </>
          }
        />
        {modelConfigsLoading ? <BulletList /> : (
          <CardContent className={classes.cardContent} >
            <Container >
              <Typography className={classes.capacity}>
                {translate('modelConfig.capacity', { occupied: capacity?.occupied || 0, available: capacity?.available || 0 })}
              </Typography>
              {renderListItems()}
            </Container>
          </CardContent>)}
      </Card>
      <ModelConfigDialog
        projectId={project.id}
        open={dialogOpen}
        configToEdit={modelConfigToEdit}
        onClose={closeDialog}
        onSuccess={handleModelConfigUpdate}
        topGraphs={topGraphs}
        subGraphs={subGraphs}
        acousticModels={acousticModels}
        handleSubGraphListUpdate={handleSubGraphListUpdate}
      />
      <ConfirmationDialog
        destructive
        titleText={confirmationTitle}
        submitText={translate('common.delete')}
        open={confirmationOpen}
        onSubmit={handleConfirmation}
        onCancel={closeConfirmation}
      />
      <ImportConfigDialog
          open={isImportOpen}
          projectId={project.id}
          onClose={() => setIsImportOpen(false)}
          onSuccess={handleImportSuccess}
          selectOptions={organizationConfigSelectOptions}
      />
      <UpdateDeploymentDialog
          projectId={project.id}
          modelConfig={modelConfigToEdit}
          open={isUpdateDeploymentOpen}
          isUpdateDeployment={isUpdateDeployment}
          onClose={() => setIsUpdateDeploymentOpen(false)}
          onSuccess={handleModelUpdateSuccess}
      />
    </Container>
  );
}
