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

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    card: {
      backgroundColor: theme.palette.background.default,
    },
    cardContent: {
      padding: 0,
    },
  }),
);

export interface ModelConfigListProps {
  project: Project;
  canModify: boolean;
  modelConfigsLoading: boolean;
  modelConfigs: ModelConfig[];
  topGraphs: TopGraph[];
  subGraphs: SubGraph[];
  acousticModels: AcousticModel[];
  languageModels: LanguageModel[];
  handleModelConfigUpdate: (modelConfig: ModelConfig, isEdit?: boolean) => void;
  handleSubGraphListUpdate: (subGraph: SubGraph, isEdit?: boolean) => void;
  handleLanguageModelCreate: (languageModel: LanguageModel) => void;
  handleModelConfigDelete: (modelConfigId: string) => void;
}


export function ModelConfigList(props: ModelConfigListProps) {
  const {
    project,
    canModify,
    modelConfigsLoading,
    modelConfigs,
    handleModelConfigUpdate,
    handleSubGraphListUpdate,
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

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [modelConfigToEdit, setModelConfigToEdit] = React.useState<ModelConfig | undefined>(undefined);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [organizationConfigSelectOptions, setOrganizationConfigSelectOptions] = React.useState<SelectFormFieldOptions>([]);

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
      const response = await api.modelConfig?.getOrganizationModelConfigs();
      if(response.kind === 'ok') {
         setOrganizationConfigSelectOptions(response.modelConfigs.map(model => ({ label: model.name, value: model.id })));
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
      setDeleteLoading(false);
    }
  };

  const classes = useStyles();

  const renderListItems = () => {
    if (!modelConfigs.length) {
      return <Typography align='center' >{translate('modelConfig.noResults')}</Typography>;
    }
    return modelConfigs.map((modelConfig, index) => {
      return (
        <ModelConfigListItem
          key={index}
          modelConfig={modelConfig}
          setModelConfigToEdit={setModelConfigToEdit}
          openConfirm={openConfirm}
          deleteLoading={deleteLoading}
          expandProps={{
            projectId: project.id,
            onSuccess: handleModelConfigUpdate,
            topGraphs: topGraphs,
            subGraphs: subGraphs,
            languageModels: languageModels,
            acousticModels: acousticModels,
            handleSubGraphListUpdate: handleSubGraphListUpdate,
            handleLanguageModelCreate: handleLanguageModelCreate,
          }}
        />
      );
    });
  };

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
          title={<HeaderBreadcrumbs breadcrumbs={breadcrumbs} />}
          action={canModify &&
          <>
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
                style={{ marginLeft: '10px' }}
                variant='outlined'
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
        languageModels={languageModels}
        acousticModels={acousticModels}
        handleSubGraphListUpdate={handleSubGraphListUpdate}
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
      <ImportConfigDialog
          open={isImportOpen}
          projectId={project.id}
          onClose={() => setIsImportOpen(false)}
          onSuccess={() => window.location.reload()}
          selectOptions={organizationConfigSelectOptions} />
    </Container>
  );
}