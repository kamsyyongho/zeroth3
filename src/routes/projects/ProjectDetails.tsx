import { Card, CardContent, CardHeader, Container, TextField, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from "react";
import { BulletList } from 'react-content-loader';
import { RouteComponentProps } from "react-router";
import { useHistory } from 'react-router-dom';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { NavigationPropsContext } from '../../hooks/navigation-props/NavigationPropsContext';
import { ProblemKind } from '../../services/api/types';
import { ModelConfig, PATHS, Project } from '../../types';
import log from '../../util/log/logger';
import { TDP } from '../TDP/TDP';

interface ProjectDetailsProps {
  projectId: string;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    cardContent: {
      padding: 0,
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
  }),
);

export function ProjectDetails({ match }: RouteComponentProps<ProjectDetailsProps>) {
  const { projectId } = match.params;
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const history = useHistory();
  const { setProps } = React.useContext(NavigationPropsContext);
  const [isValidId, setIsValidId] = React.useState(true);
  const [isValidProject, setIsValidProject] = React.useState(true);
  const [projectLoading, setProjectLoading] = React.useState(true);
  const [modelConfigsLoading, setModelConfigsLoading] = React.useState(true);
  const [project, setProject] = React.useState<Project | undefined>();
  const [modelConfigs, setModelConfigs] = React.useState<ModelConfig[]>([]);

  const classes = useStyles();

  /**
   * navigates to the the model config page
   * - passes the project to prevent the need for unnecessary loads
   */
  const handleModelConfigClick = (project: Project) => {
    // to store props that will be used on the next page
    const propsToSet = { project };
    setProps(propsToSet);
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
  }, [api, projectId]);

  const renderContent = () => {
    if (!isValidId) {
      return <Typography>{translate('common.invalidId')}</Typography>;
    }
    if (!project || !isValidProject) {
      return <Typography>{translate('common.notFound')}</Typography>;
    }

    return (<Card elevation={0} >
      <CardHeader
        action={<Button
          onClick={() => handleModelConfigClick(project)}
          variant="contained"
          color="primary">
          {translate('modelConfig.header')}
        </Button>}
        title={<Typography variant='h2'>{project.name}</Typography>}
      />
      <CardContent className={classes.cardContent} >
        {projectLoading ? <BulletList /> :
          <>
            <TextField
              id="api-key"
              label={translate('projects.apiKey')}
              defaultValue={project.apiKey}
              className={classes.textField}
              margin="normal"
              InputProps={{
                readOnly: true,
              }}
              variant="filled"
            />
            <TextField
              id="api-secret"
              label={translate('projects.apiSecret')}
              defaultValue={project.apiSecret}
              className={classes.textField}
              margin="normal"
              InputProps={{
                readOnly: true,
              }}
              variant="filled"
            />
          </>
        }
      </CardContent>
    </Card>);
  };

  return (
    <Container >
      {projectLoading ? <BulletList /> :
        renderContent()
      }
      <TDP projectId={projectId} project={project} modelConfigs={modelConfigs} />
    </Container >
  );
}