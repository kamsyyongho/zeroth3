import { Box, Card, CardContent, CardHeader, Container, Grid, TextField, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from "react";
import { BulletList } from 'react-content-loader';
import { RouteComponentProps } from "react-router";
import { useHistory } from 'react-router-dom';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { NavigationPropsContext } from '../../hooks/navigation-props/NavigationPropsContext';
import { ProblemKind } from '../../services/api/types';
import { CustomTheme } from '../../theme/index';
import { ModelConfig, PATHS, Project } from '../../types';
import log from '../../util/log/logger';
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
  const { setProps } = React.useContext(NavigationPropsContext);
  const [isValidId, setIsValidId] = React.useState(true);
  const [isValidProject, setIsValidProject] = React.useState(true);
  const [projectLoading, setProjectLoading] = React.useState(true);
  const [modelConfigsLoading, setModelConfigsLoading] = React.useState(true);
  const [project, setProject] = React.useState<Project | undefined>();
  const [modelConfigs, setModelConfigs] = React.useState<ModelConfig[]>([]);

  const classes = useStyles();
  const theme: CustomTheme = useTheme();

  /**
   * navigates to the the model config page
   * - passes the project to prevent the need for unnecessary loads
   */
  const handleModelConfigClick = () => {
    if (!project) return;
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
            {renderModelConfigArea()}
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
      {project && isValidProject && <ProjectTableTabs projectId={projectId} project={project} modelConfigs={modelConfigs} />}
    </Container >
  );
}