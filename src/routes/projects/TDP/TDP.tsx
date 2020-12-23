import { Card, CardContent, CardHeader, Grid } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import BackupIcon from '@material-ui/icons/Backup';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import PublishIcon from '@material-ui/icons/Publish';
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
  SnackbarError,
  SNACKBAR_VARIANTS,
  VoiceData,
  VoiceDataResults,
  TranscriberStats } from '../../../types';
import log from '../../../util/log/logger';
import { AudioUploadDialog } from '../../projects/components/AudioUploadDialog';
import { ImportDataSetDialog } from '../../projects/components/ImportDataSetDialog';
import { CreateSetFormDialog } from '../set/components/CreateSetFormDialog';
import { TDPTable } from './components/TDPTable';
import { ConfirmationDialog } from "./components/Confirmation";
import { StatusLogModal } from './components/StatusLogModal';
import DeleteIcon from "@material-ui/icons/Delete";
import { useSnackbar } from 'notistack';

interface TDPProps {
  projectId: string;
  project?: Project;
  modelConfigs: ModelConfig[];
  dataSets: DataSet[];
  getDataSets: () => void;
  onSetCreate: () => void;
  modelConfigDialogOpen?: boolean;
  openModelConfigDialog?: (hideBackdrop?: boolean) => void;
  transcriberStats: TranscriberStats[];
  setId?: string;
  setType?: string;
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
    getDataSets,
    onSetCreate,
    modelConfigDialogOpen,
    openModelConfigDialog,
    transcriberStats,
    setId,
    setType,
  } = props;
  const { translate } = React.useContext(I18nContext);
  const { hasPermission, roles } = React.useContext(KeycloakContext);
  const api = React.useContext(ApiContext);
  const [projectTdpDataShouldRefresh, setProjectTdpDataShouldRefresh] = useGlobal('projectTdpDataShouldRefresh');
  const { enqueueSnackbar } = useSnackbar();
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isImportDataSetOpen, setIsImportDataSetOpen] = React.useState(false);
  const [isCreateSetOpen, setIsCreateSetOpen] = React.useState(false);
  const [filterParams, setFilterParams] = React.useState<FilterParams | undefined>();
  const [initialVoiceDataLoading, setInitialVoiceDataLoading] = React.useState(true);
  const [voiceDataLoading, setVoiceDataLoading] = React.useState(true);
  const [voiceDataDeleteLoading, setVoiceDataDeleteLoading] = React.useState(false);
  const [previousSearchOptions, setPreviousSearchOptions] = React.useState({} as SearchDataRequest);
  const [voiceDataResults, setVoiceDataResults] = React.useState<VoiceDataResults>({} as VoiceDataResults);
  const [isDeleteSetOpen, setIsDeleteSetOpen] = React.useState(false);
  const [isClassifyHighRiskOpen, setIsClassifyHighRiskOpen] = React.useState(false);
  const [setTypeTDP, setSetTypeTDP] = React.useState<string | undefined>(setType);
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = React.useState<boolean>(false);
  const [selectedData, setSelectedData] = React.useState<VoiceData>({} as VoiceData);
  const [selectedModelConfig, setSelectedModelConfig] = React.useState('');

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
  }, [projectId]);

  /**
   * Removes all data in given filter setting
   */
  const handleDeleteAll = async () => {
    setIsDeleteSetOpen(false);
    if(api?.voiceData && projectId) {
      setVoiceDataDeleteLoading(true);
      const response = await api.voiceData.deleteAllDataSet(projectId, filterParams);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if(response.kind === 'ok') {
        setInitialVoiceDataLoading(true);
        getVoiceData({...previousSearchOptions, page: 0});
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
      } else {
        log({
          file: `TDP.tsx`,
          caller: `handleDeleteAll - failed to delete voice data`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(translate('TDP.deleteFailMsg'), { variant: SNACKBAR_VARIANTS.error });
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
   * @param shouldRefresh determines if we need to redo a search
   * because the current page would have no results after deletion
   */
  const deleteUnconfirmedVoiceData = async (voiceDataId: string, voiceDataIndex: number, shouldRefresh: boolean) => {
    if (api?.voiceData && projectId) {
      setVoiceDataDeleteLoading(true);
      const response = await api.voiceData.deleteUnconfirmedVoiceData(projectId, voiceDataId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        if (shouldRefresh) {
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
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });

      setVoiceDataDeleteLoading(false);
    }
  };

  const getVoiceDataWithDefaultOptions = () => {
    const options: SearchDataRequest = {};
    if (initialPageSize) {
      options.size = initialPageSize;
    }
    getVoiceData(options);
  };

  const getSubSetVoiceData = async (parameter: any = {}) => {
    if (api?.dataSet && projectId && setId && setType) {
      const param = { ...parameter, types: setType }
      if(!parameter?.size && initialPageSize) {
        Object.assign(param, {size: initialPageSize});
      }
      setVoiceDataLoading(true);
      const response = await api.dataSet.getSubSet(projectId, setId, param);
      if (response.kind === 'ok') {
        setVoiceDataResults(response.subSets);
      } else {
        log({
          file: `TDP.tsx`,
          caller: `getSubSetVoiceData - failed to get voice data`,
          value: response,
          important: true,
        });
      }
      setVoiceDataLoading(false);
      setInitialVoiceDataLoading(false);
    }
  };

  const handlePagination = async (pageIndex: number, size: number) => {
    // const options = { page: pageIndex, size }
    const options = {};
    Object.assign(options, filterParams);
    Object.assign(options, {page: pageIndex, size});
    if(setTypeTDP?.length) {
      getSubSetVoiceData(options)
    } else {
      getVoiceData(options);
    }
  };

  const handleStatusChangesModalOpen = (dataIndex: number) => {
    setSelectedData(voiceDataResults.content[dataIndex]);
    setIsStatusChangeModalOpen(true);
  };

  const handleClassificationRequest = async () => {
    setIsClassifyHighRiskOpen(false);
    if(api?.voiceData && selectedModelConfig) {
      setVoiceDataDeleteLoading(true);
      const response = await api.voiceData.classifyTdp(selectedModelConfig);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if(response.kind === 'ok') {
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
      } else {
        log({
          file: `TDP.tsx`,
          caller: `handleClassificationRequest - failed to request classification`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(translate('TDP.deleteFailMsg'), { variant: SNACKBAR_VARIANTS.error });
    }
    setVoiceDataDeleteLoading(false);
  };

  React.useEffect(() => {
    setSetTypeTDP(setType)
    return () => {
      setSetTypeTDP(undefined);
    }
  }, [setType]);

  React.useEffect(() => {
    if(setTypeTDP?.length) {
      getSubSetVoiceData();
    } else if(!(voiceDataResults?.content?.length > 0)) {
      getVoiceDataWithDefaultOptions();
    }
    // if the flag was already set when we first load the page
    if (projectTdpDataShouldRefresh) {
      setProjectTdpDataShouldRefresh(false);
    }
  }, []);

  // React.useEffect(() => {
  //   if(setTypeTDP?.length) {
  //     getSubSetVoiceData();
  //   } else if(!voiceDataResults?.content?.length) {
  //     getVoiceDataWithDefaultOptions();
  //   }
  //   // if the flag was already set when we first load the page
  //   if (projectTdpDataShouldRefresh) {
  //     setProjectTdpDataShouldRefresh(false);
  //   }
  // }, [projectTdpDataShouldRefresh])

  React.useEffect(() => {
    if (projectTdpDataShouldRefresh && !voiceDataLoading) {

      getVoiceDataWithDefaultOptions();
      setProjectTdpDataShouldRefresh(false);
    }
  }, [projectId, projectTdpDataShouldRefresh])

  React.useEffect(() => {
    if(setTypeTDP?.length) {
      getSubSetVoiceData();
    }
  }, [setTypeTDP]);

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
      return dataSetsByIdTemp;
    },
    [dataSets]
  );

  const openUploadDialog = () => setIsUploadOpen(true);
  const closeUploadDialog = () => setIsUploadOpen(false);

  const openImportDataSetDialog = () => setIsImportDataSetOpen(true);
  const closeImportDataSetDialog = () => setIsImportDataSetOpen(false);

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
              size='small'
              disabled={!filterParams || voiceDataResults.empty || !voiceDataResults.content?.length}
              onClick={openCreateSetDialog}
              startIcon={<AddIcon />}>
              {translate('SET.createSetFromFilter')}
            </Button>
          </Grid>}
          {canUpload && <Grid item>
            <Button
                color='secondary'
                variant='contained'
                size='small'
                disabled={voiceDataResults.empty || !voiceDataResults.content?.length}
                onClick={() => setIsClassifyHighRiskOpen(true)}
                startIcon={<PriorityHighIcon />}>
              {translate('TDP.classifyHighRisk')}
            </Button>
          </Grid>}
          {canUpload && <Grid item>
            <Button
                color='secondary'
                variant='contained'
                size='small'
                disabled={voiceDataResults.empty || !voiceDataResults.content?.length}
                onClick={() => setIsDeleteSetOpen(true)}
                startIcon={<DeleteIcon />}>
              {translate('SET.deleteAll')}
            </Button>
          </Grid>}
          {canUpload && <Grid item>
            <Button
                variant='contained'
                color="secondary"
                size='small'
                onClick={openImportDataSetDialog}
                startIcon={<PublishIcon />}>
              {translate('TDP.importDataSet')}
            </Button>
          </Grid>}
          {canUpload && <Grid item>
            <Button
              variant='contained'
              color="secondary"
              size='small'
              onClick={openUploadDialog}
              startIcon={<BackupIcon />}>
              {translate('TDP.dataUpload')}
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
            transcriberStats={transcriberStats}
            voiceDataResults={voiceDataResults}
            getVoiceData={getVoiceData}
            handleVoiceDataUpdate={handleVoiceDataUpdate}
            handlePagination={handlePagination}
            handleStatusChangesModalOpen={handleStatusChangesModalOpen}
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
      {
        isUploadOpen &&
        <AudioUploadDialog
            open={isUploadOpen}
            onClose={closeUploadDialog}
            onSuccess={closeUploadDialog}
            projectId={projectId}
            modelConfigs={modelConfigs}
            openModelConfigDialog={openModelConfigDialog}
            modelConfigDialogOpen={modelConfigDialogOpen}
        />
      }
      {
        isImportDataSetOpen &&
            <ImportDataSetDialog open={isImportDataSetOpen}
                                 onClose={closeImportDataSetDialog}
                                 onSuccess={closeImportDataSetDialog}
                                 projectId={projectId}
                                 modelConfigs={modelConfigs}
                                 openModelConfigDialog={openModelConfigDialog}
                                 modelConfigDialogOpen={modelConfigDialogOpen} />
      }
      <CreateSetFormDialog
        open={isCreateSetOpen}
        onClose={closeCreateSetDialog}
        onSuccess={onSetCreate}
        projectId={projectId}
        filterParams={filterParams as FilterParams}
      />
      {
        isStatusChangeModalOpen &&
          <StatusLogModal
              open={isStatusChangeModalOpen}
              onClose={() => setIsStatusChangeModalOpen(false)}
              projectId={projectId}
              dataId={selectedData.id} />
      }
      <ConfirmationDialog
          contentMsg={translate('SET.deleteAllMsg')}
          buttonMsg={translate('common.delete')}
          open={isDeleteSetOpen}
          onClose={() => setIsDeleteSetOpen(false)}
          onSuccess={handleDeleteAll} />
      <ConfirmationDialog
          contentMsg={translate('TDP.classifyHighRiskHelper')}
          buttonMsg={translate('TDP.requestClassification')}
          open={isClassifyHighRiskOpen}
          modelConfigsById={modelConfigsById}
          setSelectedModelConfigId={setSelectedModelConfig}
          onClose={() => setIsClassifyHighRiskOpen(false)}
          onSuccess={handleClassificationRequest} />
    </>
  );
}
