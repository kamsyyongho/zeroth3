import { Card, CardContent, CardHeader, Container, MenuItem, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import BackupIcon from '@material-ui/icons/Backup';
import { useSnackbar } from 'notistack';
import React from "react";
import { BulletList } from 'react-content-loader';
import { RouteComponentProps } from "react-router";
import { PERMISSIONS } from '../../constants/permission.constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { getAssignedDataResult, ProblemKind, SearchDataRequest, searchDataResult } from '../../services/api/types';
import { ModelConfig, PATHS, Project, SnackbarError, Transcriber, VoiceData, VoiceDataResults } from '../../types';
import log from '../../util/log/logger';
import { AudioUploadDialog } from '../projects/components/AudioUploadDialog';
import { DualLabelSwitch } from '../shared/DualLabelSwitch';
import { Breadcrumb, HeaderBreadcrumbs } from '../shared/HeaderBreadcrumbs';
import { TDPTable } from './components/TDPTable';

interface TDPProps {
  projectId: string;
}


export interface ModelConfigsById {
  [x: number]: ModelConfig;
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

export function TDP({ match }: RouteComponentProps<TDPProps>) {
  const { projectId } = match.params;
  const projectIdNumber = Number(projectId);
  const { translate } = React.useContext(I18nContext);
  const { hasPermission } = React.useContext(KeycloakContext);
  const { enqueueSnackbar } = useSnackbar();
  const api = React.useContext(ApiContext);
  const [onlyAssignedData, setOnlyAssignedData] = React.useState(false);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isValidId, setIsValidId] = React.useState(true);
  const [isValidProject, setIsValidProject] = React.useState(true);
  const [projectLoading, setProjectLoading] = React.useState(true);
  const [initialVoiceDataLoading, setInitialVoiceDataLoading] = React.useState(true);
  const [voiceDataLoading, setVoiceDataLoading] = React.useState(true);
  const [assignDataLoading, setAssignDataLoading] = React.useState(false);
  const [selectedModelConfigId, setSelectedModelConfigId] = React.useState<number | undefined>(undefined);
  const [modelConfigsLoading, setModelConfigsLoading] = React.useState(true);
  const [transcribersLoading, setTranscribersLoading] = React.useState(true);
  const [modelConfigs, setModelConfigs] = React.useState<ModelConfig[]>([]);
  const [transcribers, setTranscribers] = React.useState<Transcriber[]>([]);
  const [project, setProject] = React.useState<Project | undefined>(undefined);
  const [voiceDataResults, setVoiceDataResults] = React.useState<VoiceDataResults>({} as VoiceDataResults);

  const classes = useStyles();

  const canModify = React.useMemo(() => hasPermission(PERMISSIONS.crud), []);

  const getVoiceData = React.useCallback(async (options: SearchDataRequest = {}) => {
    if (api && api.voiceData) {
      setVoiceDataLoading(true);
      let response: getAssignedDataResult | searchDataResult | undefined;
      if (onlyAssignedData) {
        response = await api.voiceData.getAssignedData(projectIdNumber, { page: options.page, size: options.size });
      } else {
        response = await api.voiceData.searchData(projectIdNumber, options);
      }
      if (response.kind === 'ok') {
        setVoiceDataResults(response.data);
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
  }, [api, onlyAssignedData, projectIdNumber]);

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
    const getTranscribers = async () => {
      if (api && api.transcriber) {
        const response = await api.transcriber.getTranscribers();
        if (response.kind === 'ok') {
          setTranscribers(response.transcribers);
        } else {
          log({
            file: `TDP.tsx`,
            caller: `getTranscribers - failed to get transcribers`,
            value: response,
            important: true,
          });
        }
        setTranscribersLoading(false);
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
      // don't need transcribers if we can't modify
      if (canModify) {
        getTranscribers();
      }
      getProject();
      getVoiceData();
      getModelConfigs();
    }
  }, []);

  const handleAssignSubmit = async () => {
    if (!selectedModelConfigId) return;
    if (api && api.voiceData) {
      setAssignDataLoading(true);
      const response = await api.voiceData.fetchUnconfirmedData(projectIdNumber, selectedModelConfigId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        // to show the newly assigned data
        setOnlyAssignedData(true);
        getVoiceData();
      } else {
        log({
          file: `TDP.tsx`,
          caller: `handleAssignSubmit - failed assign data`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError && snackbarError.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setAssignDataLoading(false);
    }
  };

  /**
   * Updates a single item after updating
   */
  const handleVoiceDataUpdate = (voiceData: VoiceData, dataIndex: number) => {
    setVoiceDataResults(prevResults => {
      const updatedContent = [...prevResults.content];
      updatedContent.splice(dataIndex, 1, voiceData);
      return { ...prevResults, content: updatedContent };
    });
  };

  const modelConfigsById: ModelConfigsById = React.useMemo(
    () => {
      const modelConfigsByIdTemp: { [x: number]: ModelConfig; } = {};
      modelConfigs.forEach(modelConfig => modelConfigsByIdTemp[modelConfig.id] = modelConfig);
      return modelConfigsByIdTemp;
    },
    [modelConfigs]
  );

  const openDialog = () => setIsUploadOpen(true);
  const closeDialog = () => setIsUploadOpen(false);

  const renderContent = () => {
    if (!isValidId) {
      return <Typography>{'TEST INVALID PROJECT ID'}</Typography>;
    }
    if (!project || !isValidProject) {
      return <Typography>{'TEST PROJECT NOT FOUND'}</Typography>;
    }
    const breadcrumbs: Breadcrumb[] = [
      PATHS.projects,
      {
        to: PATHS.project.function && PATHS.project.function(projectId),
        rawTitle: project.name,
      },
      {
        rawTitle: `${translate('TDP.TDP')}`,
      },
    ];
    return (<Card>
      <CardHeader
        action={<>
          {!!modelConfigs.length && <><FormControl fullWidth>
            <InputLabel id="model-config-select-label">TEST MODEL CONFIG TO ASSIGN</InputLabel>
            <Select
              id="model-config-select"
              value={selectedModelConfigId || ''}
              onChange={(event) => setSelectedModelConfigId(event.target.value as number)}
              autoWidth
            >
              {modelConfigs.map(modelConfig => (<MenuItem key={modelConfig.id} value={modelConfig.id}>{modelConfig.name}</MenuItem>))}
            </Select>
          </FormControl>
            <Button
              disabled={!selectedModelConfigId || assignDataLoading}
              variant='outlined'
              color="primary"
              onClick={handleAssignSubmit}
            >
              {'TEST ASSIGN DATA'}
            </Button>
          </>}
          <DualLabelSwitch
            startLabel={'TEST ALL'}
            endLabel={'TEST ASSIGNED'}
            switchProps={{
              checked: onlyAssignedData,
              value: onlyAssignedData,
              onChange: () => setOnlyAssignedData((prevValue) => !prevValue),
            }}
            labelProps={{
              label: 'TEST SHOWING',
              labelPlacement: 'top',
            }}
          />
          {canModify && <Button
            variant='outlined'
            color="secondary"
            onClick={openDialog}
            startIcon={<BackupIcon />}
          >
            {'TEST UPLOAD DATA'}
          </Button>}
        </>}
        title={<><HeaderBreadcrumbs breadcrumbs={breadcrumbs} /><Typography variant='h4'>{onlyAssignedData ? 'TEST ASSIGNED' : 'TEST ALL'}</Typography></>}
      />
      <CardContent className={classes.cardContent} >
        {(initialVoiceDataLoading || modelConfigsLoading) ? <BulletList /> :
          <TDPTable
            projectId={projectIdNumber}
            projectName={project.name}
            modelConfigsById={modelConfigsById}
            voiceDataResults={voiceDataResults}
            getVoiceData={getVoiceData}
            onlyAssignedData={onlyAssignedData}
            handleVoiceDataUpdate={handleVoiceDataUpdate}
            loading={voiceDataLoading}
            transcribers={transcribers}
          />
        }
      </CardContent>
    </Card>);
  };

  return (
    <Container maxWidth={false} className={classes.container} >
      {projectLoading ? <BulletList /> :
        renderContent()
      }
      <AudioUploadDialog
        open={isUploadOpen}
        onClose={closeDialog}
        onSuccess={closeDialog}
        projectId={projectIdNumber}
        modelConfigs={modelConfigs}
      />
    </Container >
  );
}