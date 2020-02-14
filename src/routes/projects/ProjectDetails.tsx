import { Box, Card, CardContent, CardHeader, Container, Grid, TextField, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
import { BulletList } from 'react-content-loader';
import { RouteComponentProps } from "react-router";
import { useHistory } from 'react-router-dom';
import React, { useGlobal } from "reactn";
import { PERMISSIONS } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { ProblemKind } from '../../services/api/types';
import { CustomTheme } from '../../theme/index';
import { AcousticModel, LanguageModel, ModelConfig, PATHS, Project, SubGraph, TopGraph } from '../../types';
import log from '../../util/log/logger';
import { ModelConfigDialog } from '../model-config/ModelConfigDialog';
import { NotFound } from '../shared/NotFound';
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
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    infoBox: {
      minHeight: 180,
    },
    boxSpacing: {
      marginRight: theme.spacing(1),
    },
    apiHeading: {
      minWidth: 75,
      margin: theme.spacing(1),
    },
    apiInfo: {
      minWidth: 250,
      backgroundColor: theme.palette.grey[200],
    },
    modelConfigTextHeading: {
      fontFamily: 'Muli',
      fontWeight: 'bold',
      color: theme.palette.primary.main,
    },
    modelConfigTextContent: {
      fontFamily: 'Lato',
      fontWeight: 600,
      fontSize: 14,
    },
    modelConfigTextGrid: {
      margin: theme.spacing(1),
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
  const [modelConfigsLoading, setModelConfigsLoading] = React.useState(true);
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
  const theme: CustomTheme = useTheme();

  const canModify = React.useMemo(() => hasPermission(roles, PERMISSIONS.crud), [roles]);

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
      getModelConfigs();
    }
    if (canModify) {
      getTopGraphs();
      getSubGraphs();
      getLanguageModels();
      getAcousticModels();
    }
  }, [api, projectId]);


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

  const renderApiInfo = () => {
    return (<Grid
      container
      item
      direction='column'
      component={Box}
      border={1}
      borderColor={theme.table.border}
      xs={5}
      className={clsx(classes.infoBox, classes.boxSpacing)}
    >
      <Grid
        container
        item
        direction='row'
        justify='flex-start'
        alignItems='center'
        alignContent='center'
      >
        <Typography align='left' className={classes.apiHeading} >{translate('projects.apiKey')}</Typography>
        <TextField
          id="api-key"
          defaultValue={project?.apiKey ?? ""}
          className={clsx(classes.textField, classes.apiInfo)}
          margin="normal"
          InputProps={{
            readOnly: true,
          }}
          variant="outlined"
        />
      </Grid>
      <Grid
        container
        item
        justify='flex-start'
        alignItems='center'
        alignContent='center'
      >
        <Typography align='left' className={classes.apiHeading} >{translate('projects.apiSecret')}</Typography>
        <TextField
          id="api-secret"
          defaultValue={project?.apiSecret ?? ""}
          className={clsx(classes.textField, classes.apiInfo)}
          margin="normal"
          InputProps={{
            readOnly: true,
          }}
          variant="outlined"
        />
      </Grid>
    </Grid>
    );
  };

  const renderModelConfigArea = () => {
    return (<Grid
      container
      item
      direction='row'
      component={Box}
      border={1}
      borderColor={theme.table.border}
      xs={5}
      className={classes.infoBox}
    >
      <Grid
        container
        item
        direction='column'
        justify='flex-start'
        alignItems='flex-start'
        alignContent='flex-start'
        xs={6}
        spacing={1}
      >
        <Grid
          item
          className={classes.modelConfigTextGrid}
        >
          <Typography align='left' className={classes.modelConfigTextHeading} >{translate('modelConfig.header')}</Typography>
        </Grid>
        <Grid
          item
          className={classes.modelConfigTextGrid}
        >
          <Typography align='left' className={classes.modelConfigTextContent} >{translate('modelConfig.helpText')}</Typography>
        </Grid>
      </Grid>
      <Grid
        container
        item
        direction='column'
        justify='center'
        alignItems='center'
        alignContent='center'
        xs={6}
        spacing={2}
      >
        <Grid item
        >
          <Button
            color='primary'
            variant='contained'
            onClick={handleModelConfigClick}
          >
            {translate('modelConfig.manage')}
          </Button>
        </Grid>
        <Grid item
        >
          <Button
            color='primary'
            variant='outlined'
            onClick={() => openDialog()}
          >
            {translate('modelConfig.create')}
          </Button>
        </Grid>
      </Grid>
    </Grid >
    );
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
            {renderApiInfo()}
            {canModify && renderModelConfigArea()}
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