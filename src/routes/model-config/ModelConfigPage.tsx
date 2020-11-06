import { Container } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { BulletList } from 'react-content-loader';
import { RouteComponentProps } from "react-router";
import React, { useGlobal } from "reactn";
import { useSnackbar } from 'notistack';
import { PERMISSIONS } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { ProblemKind } from '../../services/api/types';
import { ModelConfig, Project, SubGraph, TopGraph, SnackbarError, SNACKBAR_VARIANTS } from '../../types';
import { AcousticModel, LanguageModel } from '../../types/models.types';
import log from '../../util/log/logger';
import { setPageTitle } from '../../util/misc';
import { Forbidden } from '../shared/Forbidden';
import { NotFound } from '../shared/NotFound';
import { ModelConfigList } from './ModelConfigList';

interface ModelConfigPageProps {
  projectId: string;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      backgroundColor: theme.palette.background.default,
      padding: 0,
    },
    cardContent: {
      padding: 0,
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
  }),
);

export function ModelConfigPage({ match }: RouteComponentProps<ModelConfigPageProps>) {
  const { projectId } = match.params;
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const { hasPermission, roles } = React.useContext(KeycloakContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isValidId, setIsValidId] = React.useState(true);
  const [isValidProject, setIsValidProject] = React.useState(true);
  const [projectLoading, setProjectLoading] = React.useState(true);
  const [modelConfigsLoading, setModelConfigsLoading] = React.useState(true);
  const [topGraphsLoading, setTopGraphsLoading] = React.useState(true);
  const [subGraphsLoading, setSubGraphsLoading] = React.useState(true);
  const [languageModelsLoading, setLanguageModelsLoading] = React.useState(true);
  const [acousticModelsLoading, setAcousticModelsLoading] = React.useState(true);

  // get the passed info if we got here via the details page
  interface NavigationPropsToGet {
    project?: Project;
    modelConfigs?: ModelConfig[];
    topGraphs?: TopGraph[];
    subGraphs?: SubGraph[];
    languageModels?: LanguageModel[];
    acousticModels?: AcousticModel[];
  }
  const [navigationProps, setNavigationProps] = useGlobal<{ navigationProps?: NavigationPropsToGet; }>('navigationProps');
  const [project, setProject] = React.useState<Project | undefined>(navigationProps?.project);
  const [modelConfigs, setModelConfigs] = React.useState<ModelConfig[]>(navigationProps?.modelConfigs || []);
  const [topGraphs, setTopGraphs] = React.useState<TopGraph[]>(navigationProps?.topGraphs || []);
  const [subGraphs, setSubGraphs] = React.useState<SubGraph[]>(navigationProps?.subGraphs || []);
  const [languageModels, setLanguageModels] = React.useState<LanguageModel[]>(navigationProps?.languageModels || []);
  const [acousticModels, setAcousticModels] = React.useState<AcousticModel[]>(navigationProps?.acousticModels || []);

  const classes = useStyles();

  const hasModelConfigPermission = React.useMemo(() => hasPermission(roles, PERMISSIONS.modelConfig), [roles]);

  const handleModelConfigUpdate = (modelConfig: ModelConfig, isEdit?: boolean) => {
    if (isEdit) {
      setModelConfigs(prevConfigs => {
        const idToUpdate = modelConfig.id;
        for (let i = 0; i < prevConfigs.length; i++) {
          if (prevConfigs[i].id === idToUpdate) {
            prevConfigs[i] = modelConfig;
            break;
          }
        }
        return [...prevConfigs];
      });
    } else {
      setModelConfigs(prevConfigs => {
        prevConfigs.push(modelConfig);
        return [...prevConfigs];
      });
    }
  };

  const handleSubGraphListUpdate = (newSubGraph: SubGraph) => {
    setSubGraphs((prevSubGraphs) => {
      prevSubGraphs.push(newSubGraph);
      return prevSubGraphs;
    });
  };

  const handleLanguageModelCreate = (newLanguageModel: LanguageModel) => {
    setLanguageModels((prevLanguageModels) => {
      prevLanguageModels.push(newLanguageModel);
      return prevLanguageModels;
    });
  };

  /**
   * remove the deleted model config from the list
   */
  const handleModelConfigDelete = (modelConfigId: string) => {
    const modelConfigsCopy = modelConfigs.slice();
    // count down to account for removing indexes
    for (let i = modelConfigsCopy.length - 1; i >= 0; i--) {
      const modelConfig = modelConfigsCopy[i];
      if (modelConfig.id === modelConfigId) {
        modelConfigsCopy.splice(i, 1);
      }
    }
    setModelConfigs(modelConfigsCopy);
  };

  const handleImportSuccess = (modelConfig: ModelConfig) => {
    setModelConfigs([...modelConfigs, modelConfig]);
  };

  const handleModelUpdateSuccess = (modelConfig: ModelConfig) => {
    const mapUpdatedConfigs = (model: ModelConfig) => {
      if(model.id === modelConfig.id) return modelConfig;
      return model;
    };
    const updatedModalConfigs = modelConfigs.map(mapUpdatedConfigs)

    setModelConfigs(updatedModalConfigs);
  };

  const getModelConfigs = async () => {
    if (api?.modelConfig) {
      const response = await api.modelConfig.getModelConfigs(projectId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        setModelConfigs(response.modelConfigs);
      } else {
        log({
          file: `ModelConfigPage.tsx`,
          caller: `getModelConfigs - failed to get model configs`,
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
      setModelConfigsLoading(false);
    }
  };

  React.useEffect(() => {
    const getProject = async () => {
      if (api?.projects) {
        const response = await api.projects.getProject(projectId);
        let snackbarError: SnackbarError | undefined = {} as SnackbarError;

        if (response.kind === 'ok') {
          setProject(response.project);
        } else {
          if (response.kind === ProblemKind["not-found"]) {
            log({
              file: `ModelConfigPage.tsx`,
              caller: `getProject - project does not exist`,
              value: response,
              important: true,
            });
            setIsValidProject(false);
          } else {
            log({
              file: `ModelConfigPage.tsx`,
              caller: `getProject - failed to get project`,
              value: response,
              important: true,
            });
          }
          snackbarError.isError = true;
          const { serverError } = response;
          if (serverError) {
            snackbarError.errorText = serverError.message || "";
          }
        }
        snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
        setProjectLoading(false);
      }
    };
    const getTopGraphs = async () => {
      if (api?.models) {
        const response = await api.models.getTopGraphs();
        let snackbarError: SnackbarError | undefined = {} as SnackbarError;

        if (response.kind === 'ok') {
          setTopGraphs(response.topGraphs);
        } else {
          log({
            file: `ModelConfigPage.tsx`,
            caller: `getTopGraphs - failed to get topgraphs`,
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
        setTopGraphsLoading(false);
      }
    };
    const getSubGraphs = async () => {
      if (api?.models) {
        const response = await api.models.getSubGraphs();
        let snackbarError: SnackbarError | undefined = {} as SnackbarError;
        if (response.kind === 'ok') {
          setSubGraphs(response.subGraphs);
        } else {
          log({
            file: `ModelConfigPage.tsx`,
            caller: `getSubGraphs - failed to get subgraphs`,
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
        setSubGraphsLoading(false);
      }
    };
    const getLanguageModels = async () => {
      if (api?.models) {
        const response = await api.models.getLanguageModels();
        let snackbarError: SnackbarError | undefined = {} as SnackbarError;

        if (response.kind === 'ok') {
          setLanguageModels(response.languageModels);
        } else {
          log({
            file: `ModelConfigPage.tsx`,
            caller: `getLanguageModels - failed to get language models`,
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
        setLanguageModelsLoading(false);
      }
    };
    const getAcousticModels = async () => {
      if (api?.models) {
        const response = await api.models.getAcousticModels();
        let snackbarError: SnackbarError | undefined = {} as SnackbarError;

        if (response.kind === 'ok') {
          setAcousticModels(response.acousticModels);
        } else {
          log({
            file: `ModelConfigPage.tsx`,
            caller: `getAcousticModels - failed to get acoustic models`,
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
    if (!projectId) {
      setIsValidId(false);
      setProjectLoading(false);
      log({
        file: `ModelConfigPage.tsx`,
        caller: `project id not valid`,
        value: projectId,
        important: true,
      });
    } else {
      // only get if we weren't passed anything from the previous page
      if (hasModelConfigPermission) {
        if (!modelConfigs.length) {
          getModelConfigs();
        } else {
          setModelConfigsLoading(false);
        }
        if (!project) {
          getProject();
        } else {
          setProjectLoading(false);
        }
        if (!topGraphs.length) {
          getTopGraphs();
        } else {
          setTopGraphsLoading(false);
        }
        if (!subGraphs.length) {
          getSubGraphs();
        } else {
          setSubGraphsLoading(false);
        }
        if (!languageModels.length) {
          getLanguageModels();
        } else {
          setLanguageModelsLoading(false);
        }
        if (!acousticModels.length) {
          getAcousticModels();
        } else {
          setAcousticModelsLoading(false);
        }
      }
    }
    setPageTitle(translate('modelConfig.header'));
    return () => {
      // to remove the navigation props that were received from the previous page
      setNavigationProps({});
    };
  }, []);

  const renderContent = () => {
    if (!isValidId) {
      return <NotFound text={translate('common.invalidId')} />;
    }
    if (!project || !isValidProject) {
      return <NotFound text={translate('projects.notFound')} />;
    }
    return (
      <ModelConfigList
        project={project}
        canModify={hasModelConfigPermission}
        modelConfigs={modelConfigs}
        modelConfigsLoading={modelConfigsLoading}
        topGraphs={topGraphs}
        subGraphs={subGraphs}
        languageModels={languageModels}
        acousticModels={acousticModels}
        handleImportSuccess={handleImportSuccess}
        handleModelConfigUpdate={handleModelConfigUpdate}
        handleModelConfigDelete={handleModelConfigDelete}
        handleSubGraphListUpdate={handleSubGraphListUpdate}
        handleLanguageModelCreate={handleLanguageModelCreate}
        handleModelUpdateSuccess={handleModelUpdateSuccess}
        getModelConfigs={getModelConfigs}
        setModelConfigsLoading={setModelConfigsLoading}
      />);
  };

  if (!hasModelConfigPermission) {
    return <Forbidden />;
  }

  return (
    <Container maxWidth={false} className={classes.container} >
      {projectLoading ? <BulletList /> :
        renderContent()
      }
    </Container >
  );
}
