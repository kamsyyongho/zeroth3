import { Card, CardContent, CardHeader, Container, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import React from "react";
import { BulletList } from 'react-content-loader';
import { RouteComponentProps } from "react-router";
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { ProblemKind, VoiceDataResults } from '../../services/api/types';
import { ModelConfig, PATHS, Project, VoiceData } from '../../types';
import log from '../../util/log/logger';
import { Breadcrumb, HeaderBreadcrumbs } from '../shared/HeaderBreadcrumbs';
import { TDPTable } from './components/TDPTable';

interface ProjectDetailsProps {
  projectId: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
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

export function TDP({ match }: RouteComponentProps<ProjectDetailsProps>) {
  const { projectId } = match.params;
  const projectIdNumber = Number(projectId);
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [isValidId, setIsValidId] = React.useState(true);
  const [isValidProject, setIsValidProject] = React.useState(true);
  const [projectLoading, setProjectLoading] = React.useState(true);
  const [initialVoiceDataLoading, setInitialVoiceDataLoading] = React.useState(true);
  const [voiceDataLoading, setVoiceDataLoading] = React.useState(true);
  const [modelConfigsLoading, setModelConfigsLoading] = React.useState(true);
  const [modelConfigs, setModelConfigs] = React.useState<ModelConfig[]>([]);
  const [project, setProject] = React.useState<Project | undefined>(undefined);
  const [voiceDataResults, setVoiceDataResults] = React.useState<VoiceDataResults>({} as VoiceDataResults);
  const [voiceData, setVoiceData] = React.useState<VoiceData[]>([]);


  //!
  //TODO
  //* IMMEDIATELY REDIRECT IF USER DOESN'T HAVE THE CORRECT ROLES

  const classes = useStyles();

  const getVoiceData = React.useCallback(async (page = 0, size = 10) => {
    if (api && api.voiceData) {
      setVoiceDataLoading(true);
      const response = await api.voiceData.searchData(projectIdNumber, { page, size });
      if (response.kind === 'ok') {
        log({
          file: `TDP.tsx`,
          caller: `getVoiceData`,
          value: response.data,
          important: true,
        });
        setVoiceDataResults(response.data);
        setVoiceData(response.data.content);
      } else {
        log({
          file: `TDP.tsx`,
          caller: `getAcousticModels - failed to get voice data`,
          value: response,
          important: true,
        });
      }
      setVoiceDataLoading(false);
      setInitialVoiceDataLoading(false);
    }
  }, [api, projectIdNumber]);

  React.useEffect(() => {
    const getProject = async () => {
      if (api && api.projects) {
        const response = await api.projects.getProject(projectIdNumber);
        if (response.kind === 'ok') {
          setProject(response.project);
        } else if (response.kind === ProblemKind["not-found"]) {
          log({
            file: `TDP.tsx`,
            caller: `getProject - project does not exist`,
            value: response,
            important: true,
          });
          setIsValidProject(false);
        } else {
          log({
            file: `TDP.tsx`,
            caller: `getProject - failed to get project`,
            value: response,
            important: true,
          });
        }
        setProjectLoading(false);
      }
    };
    const getModelConfigs = async () => {
      if (api && api.modelConfig) {
        const response = await api.modelConfig.getModelConfigs(projectIdNumber);
        if (response.kind === 'ok') {
          setModelConfigs(response.modelConfigs);
        } else {
          log({
            file: `TDP.tsx`,
            caller: `getModelConfigs - failed to get model configs`,
            value: response,
            important: true,
          });
        }
        setModelConfigsLoading(false);
      }
    };
    if (isNaN(projectIdNumber)) {
      setIsValidId(true);
      setProjectLoading(false);
      log({
        file: `TDP.tsx`,
        caller: `project id not valid`,
        value: projectId,
        important: true,
      });
    } else {
      getProject();
      getVoiceData();
      getModelConfigs();
    }
  }, [api, getVoiceData, projectId, projectIdNumber]);



  const renderContent = () => {
    if (!isValidId) {
      return <Typography>{'INVALID PROJECT ID'}</Typography>;
    }
    if (!project || !isValidProject) {
      return <Typography>{'PROJECT NOT FOUND'}</Typography>;
    }
    const breadcrumbs: Breadcrumb[] = [
      PATHS.projects,
      {
        to: PATHS.project.function && PATHS.project.function(projectId),
        rawTitle: project.name,
      },
      {
        rawTitle: `${translate('projects.TDP')}`,
      },
    ];
    return (<Card>
      <CardHeader
        action={<Button
          variant="contained"
          color="primary"
          onClick={() => { }}
        >
          {'TEST BUTTON'}
        </Button>}
        title={<HeaderBreadcrumbs breadcrumbs={breadcrumbs} />}
      />
      <CardContent className={classes.cardContent} >
        {(initialVoiceDataLoading || modelConfigsLoading) ? <BulletList /> :
          ((voiceData.length) ?
            (<TDPTable
              voiceDataResults={voiceDataResults}
              modelConfigs={modelConfigs}
              getVoiceData={getVoiceData}
              loading={voiceDataLoading}
            />) :
            <p>NO RESULTS</p>)
        }
      </CardContent>
    </Card>);
  };

  return (
    <Container maxWidth={false} className={classes.container} >
      {projectLoading ? <BulletList /> :
        renderContent()
      }
    </Container >
  );
}