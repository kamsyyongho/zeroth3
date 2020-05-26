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
import {
  DataSet,
  FilterParams,
  GenericById,
  LOCAL_STORAGE_KEYS,
  ModelConfig,
  Project,
  Transcriber,
  VoiceData,
  VoiceDataResults } from '../../../types';
import log from '../../../util/log/logger';
import { AudioUploadDialog } from '../../projects/components/AudioUploadDialog';
import { CreateSetFormDialog } from '../set/components/CreateSetFormDialog';
import { TDPTable } from './components/TDPTable';
import { ConfirmationDialog } from "./components/Confirmation";
import DeleteIcon from "@material-ui/icons/Delete";

interface TDPProps {
  projectId: string;
  project?: Project;
  modelConfigs: ModelConfig[];
  dataSets: DataSet[];
  onSetCreate: () => void;
  modelConfigDialogOpen?: boolean;
  openModelConfigDialog?: (hideBackdrop?: boolean) => void;
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
    dataSets = [] as DataSet[],
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
  const [voiceDataDeleteLoading, setVoiceDataDeleteLoading] = React.useState(false);
  const [previousSearchOptions, setPreviousSearchOptions] = React.useState({} as SearchDataRequest);
  const [voiceDataResults, setVoiceDataResults] = React.useState<VoiceDataResults>({} as VoiceDataResults);
  const [isDeleteSetOpen, setIsDeleteSetOpen] = React.useState(false);

  const classes = useStyles();

  const canUpload = React.useMemo(() => hasPermission(roles, PERMISSIONS.projects.administration), [roles]);
  const hasTdpPermission = React.useMemo(() => hasPermission(roles, PERMISSIONS.projects.TDP), [roles]);
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

  const getVoiceData = React.useCallback(async (options: SearchDataRequest = {}) => {
    if (api?.voiceData && projectId) {
      setVoiceDataLoading(true);
      //save the options to allow us to redo a search
      // in case we delete a row and it would lead us to have no results
      setPreviousSearchOptions(options);
      const response = await api.voiceData.searchData(projectId, options);
      if (response.kind === 'ok') {
        setVoiceDataResults(response.data);
      } else {
        log({
          file: `TDP.tsx`,
          caller: `getVoiceData - failed to get voice data`,
          value: response,
          important: true,
        });
      }
      setVoiceDataLoading(false);
      setInitialVoiceDataLoading(false);
    }
  }, [api, projectId]);

  /**
   * Removes all data in given filter setting
   */
  const handleDeleteAll = async () => {
    setIsDeleteSetOpen(false);
    if(api?.voiceData && projectId) {
      setVoiceDataDeleteLoading(true);
      const response = await api.voiceData.deleteAllDataSet(projectId, filterParams);
      if(response.kind === 'ok') {
        setInitialVoiceDataLoading(true);
        getVoiceData({...previousSearchOptions, page: 0});
      } else {
        log({
          file: `TDP.tsx`,
          caller: `handleDeleteAll - failed to delete voice data`,
          value: response,
          important: true,
        });
      }
    }
    setVoiceDataDeleteLoading(false);
  };
  /**
   * Removes a single item after deleting
   */
  const handleVoiceDataDelete = (dataIndex: number) => {
    setVoiceDataResults(prevResults => {
      const updatedContent = [...prevResults.content];
      updatedContent.splice(dataIndex, 1);
      return { ...prevResults, content: updatedContent, totalElements: prevResults.totalElements - 1 };
    });
  };

  /**
   * Deletes voice data and updates the table
   * @param voiceDataId 
   * @param voiceDataIndex 
   * @param shoudRefresh determines if we need to redo a search 
   * because the current page would have no results after deletion
   */
  const deleteUnconfirmedVoiceData = async (voiceDataId: string, voiceDataIndex: number, shoudRefresh: boolean) => {
    if (api?.voiceData && projectId) {
      setVoiceDataDeleteLoading(true);
      const response = await api.voiceData.deleteUnconfirmedVoiceData(projectId, voiceDataId);
      if (response.kind === 'ok') {
        if (shoudRefresh) {
          // redo seach if the page would show no results
          setInitialVoiceDataLoading(true);
          getVoiceData({ ...previousSearchOptions, page: undefined });
        } else {
          handleVoiceDataDelete(voiceDataIndex);
        }
      } else {
        log({
          file: `TDP.tsx`,
          caller: `deleteUnconfirmedVoiceData - failed to delete voice data`,
          value: response,
          important: true,
        });
      }
      setVoiceDataDeleteLoading(false);
    }
  };

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

  const modelConfigsById: GenericById<ModelConfig> = React.useMemo(
    () => {
      const modelConfigsByIdTemp: { [x: string]: ModelConfig; } = {};
      modelConfigs.forEach(modelConfig => modelConfigsByIdTemp[modelConfig.id] = modelConfig);
      return modelConfigsByIdTemp;
    },
    [modelConfigs]
  );

  const dataSetsById: GenericById<DataSet> = React.useMemo(
    () => {
      const dataSetsByIdTemp: { [x: string]: DataSet; } = {};
      dataSets.forEach(dataSet => dataSetsByIdTemp[dataSet.id] = dataSet);
      console.log(dataSetsByIdTemp)
      return dataSetsByIdTemp;
    },
    [dataSets]
  );

  const transcribersById = React.useMemo(() => {
    const transcribersById: Transcriber[] = [];
    const checkIdForDuplicate = (id: string) => {
      const exisitingIds = transcribersById.map((transcriber: any) => transcriber.id);
      return exisitingIds.includes(id);
    }
    dataSets.forEach(dataSet => dataSet.transcribers.forEach(transcriber => {
      if(!checkIdForDuplicate(transcriber.id)){transcribersById.push(transcriber)}}));
    return transcribersById;
  },[dataSets])

  const openUploadDialog = () => setIsUploadOpen(true);
  const closeUploadDialog = () => setIsUploadOpen(false);

  const openCreateSetDialog = () => setIsCreateSetOpen(true);
  const closeCreateSetDialog = () => setIsCreateSetOpen(false);



  const renderContent = () => {
    return (<Card elevation={0} className={classes.card} >
      <CardHeader
        action={<Grid container spacing={1}>
          {hasTdpPermission && <Grid item>
            <Button
              variant='outlined'
              color="primary"
              disabled={!filterParams || voiceDataResults.empty || !voiceDataResults.content?.length}
              onClick={openCreateSetDialog}
              startIcon={<AddIcon />}
            >
              {translate('SET.createSetFromFilter')}
            </Button>
          </Grid>}
          {canUpload && <Grid item>
            <Button
                color='secondary'
                variant='contained'
                size='small'
                // disabled={voiceDataResults.empty || !voiceDataResults.content?.length}
                onClick={() => setIsDeleteSetOpen(true)}
                startIcon={<DeleteIcon />}
            >
              {translate('SET.deleteAll')}
            </Button>
          </Grid>}
          {canUpload && <Grid item>
            <Button
              variant='contained'
              color="secondary"
              size='small'
              onClick={openUploadDialog}
              startIcon={<BackupIcon />}
            >
              {translate('TDP.decodeData')}
            </Button>
          </Grid>}
        </Grid>}
      />
      {hasTdpPermission && <CardContent className={classes.cardContent} >
        {(!project || initialVoiceDataLoading) ? <BulletList /> :
          <TDPTable
            projectId={projectId}
            modelConfigsById={modelConfigsById}
            dataSetsById={dataSetsById}
            transcribersById={transcribersById}
            voiceDataResults={voiceDataResults}
            getVoiceData={getVoiceData}
            handleVoiceDataUpdate={handleVoiceDataUpdate}
            loading={voiceDataLoading || voiceDataDeleteLoading}
            setFilterParams={setFilterParams}
            deleteUnconfirmedVoiceData={deleteUnconfirmedVoiceData}
          />
        }
      </CardContent>}
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
      <ConfirmationDialog
          contentMsg={translate('SET.deleteAllMsg')}
          buttonMsg={translate("common.delete")}
          open={isDeleteSetOpen}
          onClose={() => setIsDeleteSetOpen(false)}
          onSuccess={handleDeleteAll}/>
    </>
  );
}