import { Container } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { useSnackbar } from 'notistack';
import { BulletList } from 'react-content-loader';
import React, { useGlobal } from 'reactn';
import { PERMISSIONS } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { CustomTheme } from '../../theme';
import { AcousticModel, DataSet, GenericById, ModelConfig, SnackbarError, SNACKBAR_VARIANTS, TRAINING_METHODS } from '../../types';
import log from '../../util/log/logger';
import { setPageTitle } from '../../util/misc';
import { Forbidden } from '../shared/Forbidden';
import { ModelTrainingForm } from './ModelTrainingForm';


const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    card: {
      backgroundColor: theme.palette.background.default,
      maxWidth: 700,
    },
    font: {
      fontFamily: 'Muli',
      fontWeight: 'bold',
      color: theme.header.lightBlue,
    },
  }),
);

export function ModelTraining() {
  const { translate } = React.useContext(I18nContext);
  const { hasPermission, roles } = React.useContext(KeycloakContext);
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();
  const [currentProject, setCurrentProject] = useGlobal('currentProject');
  const [projectId, setProjectId] = React.useState<string | undefined>(currentProject?.id);
  const [initialLoad, setInitialLoad] = React.useState(false);
  const [acousticModelsLoading, setAcousticModelsLoading] = React.useState(true);
  const [acousticModels, setAcousticModels] = React.useState<AcousticModel[]>([]);
  const [modelConfigsById, setModelConfigsById] = React.useState<GenericById<ModelConfig>>({});
  const [dataSetsById, setDataSetsById] = React.useState<GenericById<DataSet>>({});
  const [modelConfigsLoading, setModelConfigsLoading] = React.useState(true);
  const [modelConfigs, setModelConfigs] = React.useState<ModelConfig[]>([]);
  const [dataSetsLoading, setDataSetsLoading] = React.useState(true);
  const [dataSets, setDataSets] = React.useState<DataSet[]>([]);
  const [trainingMethodsLoading, setTrainingMethodsLoading] = React.useState(true);
  const [trainingMethods, setTrainingMethods] = React.useState<TRAINING_METHODS[]>([]);

  const classes = useStyles();

  const canSeeModels = React.useMemo(() => hasPermission(roles, PERMISSIONS.modelTraining), [roles]);

  const getModelConfigs = async (projectId: string) => {
    if (api?.modelConfig) {
      const response = await api.modelConfig.getModelConfigs(projectId);
      if (response.kind === 'ok') {
        const modelConfigsById: GenericById<ModelConfig> = {};
        response.modelConfigs.forEach(modelConfig => modelConfigsById[modelConfig.id] = modelConfig);
        setModelConfigsById(modelConfigsById);
        setModelConfigs(response.modelConfigs);
      } else {
        log({
          file: `ModelTraining.tsx`,
          caller: `getModelConfigs - failed to get model configs`,
          value: response,
          important: true,
        });
      }
      setModelConfigsLoading(false);
    }
  };

  const getDataSets = async (projectId: string) => {
    if (api?.dataSet) {
      const response = await api.dataSet.getAll(projectId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        const dataSetsById: GenericById<DataSet> = {};
        response.dataSets.forEach(dataSet => dataSetsById[dataSet.id] = dataSet);
        setDataSetsById(dataSetsById);
        setDataSets(response.dataSets);
      } else {
        log({
          file: `ModelTraining.tsx`,
          caller: `getDataSets - failed to get data sets`,
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
      setDataSetsLoading(false);
    }
  };

  const getTrainingMethods = async () => {
    if (api?.models) {
      const response = await api.models.getTrainingMethods();
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        setTrainingMethods(response.trainingMethods);
      } else {
        log({
          file: `ModelTraining.tsx`,
          caller: `getDataSets - failed to get data sets`,
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
      setTrainingMethodsLoading(false);
    }
  };

  React.useEffect(() => {
    setPageTitle(translate('path.modelTraining'));
  }, []);

  React.useEffect(() => {
    if (currentProject?.id && canSeeModels) {
      setProjectId(currentProject.id);
    }
  }, [currentProject, canSeeModels]);

  React.useEffect(() => {
    if (projectId && !initialLoad && canSeeModels) {
      setInitialLoad(true);
      getModelConfigs(projectId);
      getDataSets(projectId);
      getTrainingMethods();
    }
  }, [projectId, initialLoad, canSeeModels]);

  if (!canSeeModels) {
    return <Forbidden />;
  }

  return (
    <Container >
      <Card elevation={0} className={classes.card} >
        <CardHeader
          title={translate("modelTraining.header")}
          titleTypographyProps={{
            className: classes.font,
          }}
        />
        {(modelConfigsLoading || dataSetsLoading || trainingMethodsLoading || !projectId) ?
          (<BulletList />) :
          (<ModelTrainingForm
            modelConfigs={modelConfigs}
            projectId={projectId}
            dataSets={dataSets}
            modelConfigsById={modelConfigsById}
            dataSetsById={dataSetsById}
            trainingMethods={trainingMethods}
          />)
        }
      </Card>
    </Container >
  );
}
