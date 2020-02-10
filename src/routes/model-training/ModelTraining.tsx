import { Container } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { useSnackbar } from 'notistack';
import React from 'react';
import { BulletList } from 'react-content-loader';
import { PERMISSIONS } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { GlobalStateContext } from '../../hooks/global-state/GlobalStateContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { CustomTheme } from '../../theme';
import { AcousticModel, DataSet, GenericById, SnackbarError, SNACKBAR_VARIANTS } from '../../types';
import log from '../../util/log/logger';
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
  const { hasPermission } = React.useContext(KeycloakContext);
  const api = React.useContext(ApiContext);
  const { globalState } = React.useContext(GlobalStateContext);
  const { enqueueSnackbar } = useSnackbar();
  const { currentProject } = globalState;
  const [projectId, setProjectId] = React.useState<string | undefined>(currentProject?.id);
  const [initialLoad, setInitialLoad] = React.useState(false);
  const [acousticModelsLoading, setAcousticModelsLoading] = React.useState(true);
  const [acousticModels, setAcousticModels] = React.useState<AcousticModel[]>([]);
  const [acousticModelsById, setAcousticModelsById] = React.useState<GenericById<AcousticModel>>({});
  const [dataSetsById, setDataSetsById] = React.useState<GenericById<DataSet>>({});
  const [dataSetsLoading, setDataSetsLoading] = React.useState(true);
  const [dataSets, setDataSets] = React.useState<DataSet[]>([]);

  const classes = useStyles();

  const canSeeModels = React.useMemo(() => hasPermission(PERMISSIONS.models), []);

  const getAcousticModels = async () => {
    if (api?.models) {
      const response = await api.models.getAcousticModels();
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        const acousticModelsById: GenericById<AcousticModel> = {};
        response.acousticModels.forEach(model => acousticModelsById[model.id] = model);
        setAcousticModelsById(acousticModelsById);
        setAcousticModels(response.acousticModels);
      } else {
        log({
          file: `ModelTraining.tsx`,
          caller: `getAcousticModels - failed to get model configs`,
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
      setAcousticModelsLoading(false);
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

  React.useEffect(() => {
    if (currentProject?.id && canSeeModels) {
      setProjectId(currentProject.id);
    }
  }, [currentProject, canSeeModels]);

  React.useEffect(() => {
    if (projectId && !initialLoad && canSeeModels) {
      setInitialLoad(true);
      getAcousticModels();
      getDataSets(projectId);
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
        {(acousticModelsLoading || dataSetsLoading) ?
          (<BulletList />) :
          (<ModelTrainingForm
            acousticModels={acousticModels}
            dataSets={dataSets}
            acousticModelsById={acousticModelsById}
            dataSetsById={dataSetsById}
          />)
        }
      </Card>
    </Container >
  );
}
