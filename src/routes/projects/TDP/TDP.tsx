import { Card, CardContent, CardHeader, Grid } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import BackupIcon from '@material-ui/icons/Backup';
import { BulletList } from 'react-content-loader';
import React, { useGlobal } from "reactn";
import { PERMISSIONS } from '../../../constants/permission.constants';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../hooks/keycloak/KeycloakContext';
import { SearchDataRequest } from '../../../services/api/types';
import { FilterParams, LOCAL_STORAGE_KEYS, ModelConfig, Project, VoiceData, VoiceDataResults } from '../../../types';
import log from '../../../util/log/logger';
import { AudioUploadDialog } from '../../projects/components/AudioUploadDialog';
import { CreateSetFormDialog } from '../set/components/CreateSetFormDialog';
import { TDPTable } from './components/TDPTable';

interface TDPProps {
  projectId: string;
  project?: Project;
  modelConfigs: ModelConfig[];
  onSetCreate: () => void;
  modelConfigDialogOpen?: boolean;
  openModelConfigDialog?: (hideBackdrop?: boolean) => void;
}


export interface ModelConfigsById {
  [x: string]: ModelConfig;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      padding: 0,
    },
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
  }),
);

export function TDP(props: TDPProps) {
  const {
    projectId,
    project,
    modelConfigs = [] as ModelConfig[],
    onSetCreate,
    modelConfigDialogOpen,
    openModelConfigDialog,

  } = props;
  const { translate } = React.useContext(I18nContext);
  const { hasPermission, roles } = React.useContext(KeycloakContext);
  const api = React.useContext(ApiContext);
  const [projectTdpDataShouldRefresh, setProjectTdpDataShouldRefresh] = useGlobal('projectTdpDataShouldRefresh');
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isCreateSetOpen, setIsCreateSetOpen] = React.useState(false);
  const [filterParams, setFilterParams] = React.useState<FilterParams | undefined>();
  const [initialVoiceDataLoading, setInitialVoiceDataLoading] = React.useState(true);
  const [voiceDataLoading, setVoiceDataLoading] = React.useState(true);
  const [voiceDataResults, setVoiceDataResults] = React.useState<VoiceDataResults>({} as VoiceDataResults);

  const classes = useStyles();

  const canModify = React.useMemo(() => hasPermission(roles, PERMISSIONS.crud), [roles]);
  const initialPageSize = React.useMemo(() => {
    const rowsPerPageString = localStorage.getItem(LOCAL_STORAGE_KEYS.TDP_TABLE_ROWS_PER_PAGE);
    if (rowsPerPageString) {
      const rowsPerPage = Number(rowsPerPageString);
      if (!isNaN(rowsPerPage)) {
        return rowsPerPage;
      }
    }
    return null;
  }, []);

  const getVoiceData = React.useCallback(async (options: SearchDataRequest = {}) => {
    if (api?.voiceData && projectId) {
      setVoiceDataLoading(true);
      const response = await api.voiceData.searchData(projectId, options);
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
  }, [api, projectId]);

  const getVoiceDataWithDefautOptions = () => {
    const options: SearchDataRequest = {};
    if (initialPageSize) {
      options.size = initialPageSize;
    }
    getVoiceData(options);
  };

  React.useEffect(() => {
    // if the flag was already set when we first load the page
    if (projectTdpDataShouldRefresh) {
      setProjectTdpDataShouldRefresh(false);
    }
    getVoiceDataWithDefautOptions();
  }, []);

  React.useEffect(() => {
    // if the flag triggers after we are already on the page
    if (projectTdpDataShouldRefresh && !voiceDataLoading) {
      setProjectTdpDataShouldRefresh(false);
      getVoiceDataWithDefautOptions();
    }
  }, [projectTdpDataShouldRefresh]);

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

  const openUploadDialog = () => setIsUploadOpen(true);
  const closeUploadDialog = () => setIsUploadOpen(false);

  const openCreateSetDialog = () => setIsCreateSetOpen(true);
  const closeCreateSetDialog = () => setIsCreateSetOpen(false);



  const renderContent = () => {
    return (<Card elevation={0} className={classes.card} >
      <CardHeader
        action={canModify && <Grid container spacing={1}>
          <Grid item>
            <Button
              variant='outlined'
              color="primary"
              disabled={!filterParams || voiceDataResults.empty === true || !voiceDataResults.content?.length}
              onClick={openCreateSetDialog}
              startIcon={<AddIcon />}
            >
              {translate('SET.createSetFromFilter')}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant='contained'
              color="primary"
              onClick={openUploadDialog}
              startIcon={<BackupIcon />}
            >
              {translate('TDP.uploadData')}
            </Button>
          </Grid>
        </Grid>}
      />
      <CardContent className={classes.cardContent} >
        {(!project || initialVoiceDataLoading) ? <BulletList /> :
          <TDPTable
            projectId={projectId}
            projectName={project?.name}
            modelConfigsById={modelConfigsById}
            voiceDataResults={voiceDataResults}
            getVoiceData={getVoiceData}
            handleVoiceDataUpdate={handleVoiceDataUpdate}
            loading={voiceDataLoading}
            setFilterParams={setFilterParams}
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
        onClose={closeUploadDialog}
        onSuccess={closeUploadDialog}
        projectId={projectId}
        modelConfigs={modelConfigs}
        openModelConfigDialog={openModelConfigDialog}
        modelConfigDialogOpen={modelConfigDialogOpen}
      />
      <CreateSetFormDialog
        open={isCreateSetOpen}
        onClose={closeCreateSetDialog}
        onSuccess={onSetCreate}
        projectId={projectId}
        filterParams={filterParams as FilterParams}
      />
    </>
  );
}