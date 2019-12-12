import { Card, CardContent, CardHeader } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import BackupIcon from '@material-ui/icons/Backup';
import { useSnackbar } from 'notistack';
import React from "react";
import { BulletList } from 'react-content-loader';
import { PERMISSIONS } from '../../constants/permission.constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { getAssignedDataResult, SearchDataRequest, searchDataResult } from '../../services/api/types';
import { ModelConfig, Project, SnackbarError, VoiceData, VoiceDataResults } from '../../types';
import log from '../../util/log/logger';
import { AudioUploadDialog } from '../projects/components/AudioUploadDialog';
import { TDPTable } from './components/TDPTable';

interface TDPProps {
  projectId: string;
  project?: Project;
  modelConfigs: ModelConfig[];
}


export interface ModelConfigsById {
  [x: string]: ModelConfig;
}

const useStyles = makeStyles((theme) =>
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

export function TDP(props: TDPProps) {
  const { projectId, project, modelConfigs = [] as ModelConfig[] } = props;
  const { translate } = React.useContext(I18nContext);
  const { hasPermission } = React.useContext(KeycloakContext);
  const { enqueueSnackbar } = useSnackbar();
  const api = React.useContext(ApiContext);
  const [onlyAssignedData, setOnlyAssignedData] = React.useState(false);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [initialVoiceDataLoading, setInitialVoiceDataLoading] = React.useState(true);
  const [voiceDataLoading, setVoiceDataLoading] = React.useState(true);
  const [assignDataLoading, setAssignDataLoading] = React.useState(false);
  const [selectedModelConfigId, setSelectedModelConfigId] = React.useState<string | undefined>(undefined);
  const [voiceDataResults, setVoiceDataResults] = React.useState<VoiceDataResults>({} as VoiceDataResults);

  const classes = useStyles();

  const canModify = React.useMemo(() => hasPermission(PERMISSIONS.crud), []);

  const getVoiceData = React.useCallback(async (options: SearchDataRequest = {}) => {
    if (api?.voiceData && projectId) {
      setVoiceDataLoading(true);
      let response: getAssignedDataResult | searchDataResult | undefined;
      if (onlyAssignedData) {
        response = await api.voiceData.getAssignedData(projectId, { page: options.page, size: options.size });
      } else {
        response = await api.voiceData.searchData(projectId, options);
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
  }, [api, onlyAssignedData, projectId]);

  React.useEffect(() => {
    getVoiceData();
  }, []);

  const handleAssignSubmit = async () => {
    if (!selectedModelConfigId) return;
    if (api?.voiceData) {
      setAssignDataLoading(true);
      const response = await api.voiceData.fetchUnconfirmedData(projectId, selectedModelConfigId);
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
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
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
      const modelConfigsByIdTemp: { [x: string]: ModelConfig; } = {};
      modelConfigs.forEach(modelConfig => modelConfigsByIdTemp[modelConfig.id] = modelConfig);
      return modelConfigsByIdTemp;
    },
    [modelConfigs]
  );

  const openDialog = () => setIsUploadOpen(true);
  const closeDialog = () => setIsUploadOpen(false);

  const renderContent = () => {
    return (<Card elevation={0} >
      <CardHeader
        action={canModify && <Button
          variant='outlined'
          color="primary"
          onClick={openDialog}
          startIcon={<BackupIcon />}
        >
          {translate('TDP.uploadData')}
        </Button>}
        title={translate('TDP.TDP')}
      />
      <CardContent className={classes.cardContent} >
        {(!project || initialVoiceDataLoading) ? <BulletList /> :
          <TDPTable
            projectId={projectId}
            projectName={project?.name}
            modelConfigsById={modelConfigsById}
            voiceDataResults={voiceDataResults}
            getVoiceData={getVoiceData}
            onlyAssignedData={onlyAssignedData}
            handleVoiceDataUpdate={handleVoiceDataUpdate}
            loading={voiceDataLoading}
          />
        }
      </CardContent>
    </Card>);
  };

  return (
    <>
      {!project ? <BulletList /> :
        renderContent()
      }
      <AudioUploadDialog
        open={isUploadOpen}
        onClose={closeDialog}
        onSuccess={closeDialog}
        projectId={projectId}
        modelConfigs={modelConfigs}
      />
    </>
  );
}