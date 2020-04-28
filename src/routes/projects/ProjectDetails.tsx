import { Card, CardContent, CardHeader, Container, Grid, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { BulletList } from 'react-content-loader';
import { RouteComponentProps } from "react-router";
import { useHistory } from 'react-router-dom';
import React, { useGlobal } from "reactn";
import { PERMISSIONS } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { ProblemKind } from '../../services/api/types';
import { AcousticModel, DataSet, LanguageModel, ModelConfig, PATHS, Project, SubGraph, TopGraph } from '../../types';
import log from '../../util/log/logger';
import { setPageTitle } from '../../util/misc';
import { ModelConfigDialog } from '../model-config/ModelConfigDialog';
import { NotFound } from '../shared/NotFound';
import { ProjectApiInfo } from './components/ProjectApiInfo';
import { ProjectModelConfigBox } from './components/ProjectModelConfigBox';
import { ProjectTableTabs } from './ProjectTableTabs';

interface ProjectDetailsProps {
  projectId: string;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    card: {
      backgroundColor: theme.palette.background.default,
    },
    cardContent: {
      padding: 0,
    },
  }),
);

export function ProjectDetails({ match }: RouteComponentProps<ProjectDetailsProps>) {
  const { projectId } = match.params;
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const history = useHistory();
  const { hasPermission, roles } = React.useContext(KeycloakContext);
  const [navigationProps, setNavigationProps] = useGlobal('navigationProps');
  const [isValidId, setIsValidId] = React.useState(true);
  const [isValidProject, setIsValidProject] = React.useState(true);
  const [projectLoading, setProjectLoading] = React.useState(true);
  const [project, setProject] = React.useState<Project | undefined>();
  const [modelConfigs, setModelConfigs] = React.useState<ModelConfig[]>([]);
  const [topGraphs, setTopGraphs] = React.useState<TopGraph[]>([]);
  const [subGraphs, setSubGraphs] = React.useState<SubGraph[]>([]);
  const [languageModels, setLanguageModels] = React.useState<LanguageModel[]>([]);
  const [acousticModels, setAcousticModels] = React.useState<AcousticModel[]>([]);
  const [dataSets, setDataSets] = React.useState<DataSet[]>([]);
  const [modelConfigsLoading, setModelConfigsLoading] = React.useState(true);
  const [updateSecretLoading, setUpdateSecretLoading] = React.useState(false);
  const [topGraphsLoading, setTopGraphsLoading] = React.useState(true);
  const [subGraphsLoading, setSubGraphsLoading] = React.useState(true);
  const [languageModelsLoading, setLanguageModelsLoading] = React.useState(true);
  const [acousticModelsLoading, setAcousticModelsLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [hideBackdrop, setHideBackdrop] = React.useState(false);


  const openDialog = (hideBackdrop = false) => {
    setHideBackdrop(hideBackdrop);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setHideBackdrop(false);
    setDialogOpen(false);
  };

  const classes = useStyles();

  const hasAdminPermissions = React.useMemo(() => hasPermission(roles, PERMISSIONS.projects.administration), [roles]);
  const hasModelConfigPermissions = React.useMemo(() => hasPermission(roles, PERMISSIONS.modelConfig), [roles]);
  const hasTdpPermissions = React.useMemo(() => hasPermission(roles, PERMISSIONS.projects.TDP), [roles]);

  /**
   * navigates to the the model config page
   * - passes the project to prevent the need for unnecessary loads
   */
  const handleModelConfigClick = () => {
    if (!project) return;
    // to store props that will be used on the next page
    const propsToSet = { project, modelConfigs, topGraphs, subGraphs, languageModels, acousticModels };
    setNavigationProps(propsToSet);
    PATHS.modelConfig.function && history.push(PATHS.modelConfig.function(project.id));
  };

  const updateSecret = async () => {
    if (api?.projects && project) {
      setProject({ ...project, apiSecret: '' });
      setUpdateSecretLoading(true);
      const response = await api.projects.updateSecret(projectId);
      if (response.kind === 'ok') {
        setProject(response.project);
      } else {
        log({
          file: `ProjectDetails.tsx`,
          caller: `updateSecret - failed to update secret`,
          value: response,
          important: true,
        });
      }
      setUpdateSecretLoading(false);
    }
  };

  React.useEffect(() => {
    const getProject = async () => {
      if (api?.projects) {
        const response = await api.projects.getProject(projectId);
        if (response.kind === 'ok') {
          setProject(response.project);
        } else if (response.kind === ProblemKind["not-found"]) {
          log({
            file: `ProjectDetails.tsx`,
            caller: `getProject - project does not exist`,
            value: response,
            important: true,
          });
          setIsValidProject(false);
        } else {
          log({
            file: `ProjectDetails.tsx`,
            caller: `getProject - failed to get project`,
            value: response,
            important: true,
          });
        }
        setProjectLoading(false);
      }
    };
    const getModelConfigs = async () => {
      if (api?.modelConfig) {
        const response = await api.modelConfig.getModelConfigs(projectId);
        if (response.kind === 'ok') {
          setModelConfigs(response.modelConfigs);
        } else {
          log({
            file: `ProjectDetails.tsx`,
            caller: `getModelConfigs - failed to get model configs`,
            value: response,
            important: true,
          });
        }
        setModelConfigsLoading(false);
      }
    };
    const getAllDataSets = async () => {
      if (api?.dataSet && projectId) {
        const response = await api.dataSet.getAll(projectId);
        if (response.kind === 'ok') {
          setDataSets(response.dataSets);
        } else {
          log({
            file: `ProjectDetails.tsx`,
            caller: `getAllDataSets - failed to get data sets`,
            value: response,
            important: true,
          });
        }
      }
    };
    const getTopGraphs = async () => {
      if (api?.models) {
        const response = await api.models.getTopGraphs();
        if (response.kind === 'ok') {
          setTopGraphs(response.topGraphs);
        } else {
          log({
            file: `ProjectDetails.tsx`,
            caller: `getTopGraphs - failed to get topgraphs`,
            value: response,
            important: true,
          });
        }
        setTopGraphsLoading(false);
      }
    };
    const getSubGraphs = async () => {
      if (api?.models) {
        const response = await api.models.getSubGraphs();
        if (response.kind === 'ok') {
          setSubGraphs(response.subGraphs);
        } else {
          log({
            file: `ProjectDetails.tsx`,
            caller: `getSubGraphs - failed to get subgraphs`,
            value: response,
            important: true,
          });
        }
        setSubGraphsLoading(false);
      }
    };
    const getLanguageModels = async () => {
      if (api?.models) {
        const response = await api.models.getLanguageModels();
        if (response.kind === 'ok') {
          setLanguageModels(response.languageModels);
        } else {
          log({
            file: `ProjectDetails.tsx`,
            caller: `getLanguageModels - failed to get language models`,
            value: response,
            important: true,
          });
        }
        setLanguageModelsLoading(false);
      }
    };
    const getAcousticModels = async () => {
      if (api?.models) {
        const response = await api.models.getAcousticModels();
        if (response.kind === 'ok') {
          setAcousticModels(response.acousticModels);
        } else {
          log({
            file: `ProjectDetails.tsx`,
            caller: `getAcousticModels - failed to get acoustic models`,
            value: response,
            important: true,
          });
        }
        setAcousticModelsLoading(false);
      }
    };
    if (!projectId) {
      setIsValidId(false);
      setProjectLoading(false);
      log({
        file: `ProjectDetails.tsx`,
        caller: `project id not valid`,
        value: projectId,
        important: true,
      });
    } else {
      getProject();
      if (hasModelConfigPermissions) {
        getModelConfigs();
      }
    }
    if (hasModelConfigPermissions) {
      getTopGraphs();
      getSubGraphs();
      getLanguageModels();
      getAcousticModels();
    }
    if (hasTdpPermissions) {
      getAllDataSets();
    }
  }, [api, projectId]);

  React.useEffect(() => {
    setPageTitle(translate('path.projects'));
  }, []);

  const handleModelConfigUpdate = (modelConfig: ModelConfig) => {
    setModelConfigs(prevConfigs => {
      prevConfigs.push(modelConfig);
      return prevConfigs;
    });
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

  const renderContent = () => {
    if (!isValidId) {
      return <NotFound text={translate('common.invalidId')} />;
    }
    if (!project || !isValidProject) {
      return <NotFound text={translate('projects.notFound')} />;
    }

    return (<Card elevation={0} className={classes.card} >
      <CardHeader
        title={<Typography variant='h2'>{project.name}</Typography>}
      />
      <CardContent className={classes.cardContent} >
        {projectLoading ? <BulletList /> :
          <Grid
            container
            direction='row'
            justify='center'
            alignItems='flex-start'
            alignContent='center'
            spacing={2}
          >
            <ProjectApiInfo
              loading={updateSecretLoading}
              onClick={updateSecret}
              project={project}
            />
            <ProjectModelConfigBox
              hasPermission={(hasAdminPermissions && hasModelConfigPermissions)}
              onModelConfigNavigateClick={handleModelConfigClick}
              onModelConfigCreateClick={openDialog}
            />
          </Grid>
        }
      </CardContent>
    </Card>);
  };

  return (
    <Container >
      {projectLoading ? <BulletList /> :
        renderContent()
      }
      {project && isValidProject &&
        <>
          <ProjectTableTabs
            projectId={projectId}
            project={project}
            modelConfigs={modelConfigs}
            dataSets={dataSets}
            openModelConfigDialog={openDialog}
            modelConfigDialogOpen={dialogOpen}
          />
          <ModelConfigDialog
            projectId={projectId}
            hideBackdrop={hideBackdrop}
            open={dialogOpen}
            onClose={closeDialog}
            onSuccess={handleModelConfigUpdate}
            topGraphs={topGraphs}
            subGraphs={subGraphs}
            languageModels={languageModels}
            acousticModels={acousticModels}
            handleSubGraphListUpdate={handleSubGraphListUpdate}
            handleLanguageModelCreate={handleLanguageModelCreate}
          />
        </>
      }
    </Container >
  );
};