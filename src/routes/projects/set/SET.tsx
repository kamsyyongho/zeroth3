import { BulletList } from 'react-content-loader';
import React from 'reactn';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { ProblemKind } from '../../../services/api/types';
import { DataSet, VoiceData, PaginatedResults, ModelConfig, GenericById, TranscriberStats, VoiceDataResults } from '../../../types';
import log from '../../../util/log/logger';
import { Forbidden } from '../../shared/Forbidden';
import { AddTranscriberDialog } from './components/AddTranscriberDialog';
import { SetTable } from './components/SetTable';
import { EvaluationDetailModal } from './components/EvaluationDetailModal';
import { ConfirmationDialog } from "../TDP/components/Confirmation";
import { SNACKBAR_VARIANTS } from '../../../types/snackbar.types';
import { useSnackbar } from 'notistack';
import { ServerError } from '../../../services/api/types/api-problem.types';


interface SETProps {
  initialDataSets: DataSet[];
  projectId: string;
  refreshCounter?: number;
  modelConfigs: ModelConfig[];
  getTranscribersWithStats: (page?:number, size?: number) => void;
  displaySubSetInTDP: (setId: string, subSetType: string) => void;
  transcribersStats: TranscriberStats[];
  transcriberStatDataLoading: boolean;
  pagination?: PaginatedResults;
}

export default function SET(props: SETProps) {
  const { initialDataSets, projectId, refreshCounter, modelConfigs, getTranscribersWithStats, displaySubSetInTDP, transcribersStats, transcriberStatDataLoading, pagination } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isForbidden, setIsForbidden] = React.useState(false);
  const [transcribersDialogOpen, setTranscribersDialogOpen] = React.useState(false);
  const [setsLoading, setSetsLoading] = React.useState(false);
  const [dataSets, setDataSets] = React.useState<DataSet[]>([]);
  const [selectedDataSet, setSelectedDataSet] = React.useState<DataSet | undefined>();
  const [selectedDataSetIndex, setSelectedDataSetIndex] = React.useState<number | undefined>();
  const [isEvaluationRequested, setIsEvaluationRequested] = React.useState(false);
  const [contentMsg, setContentMsg] = React.useState('');
  const [selectedModelConfigId, setSelectedModelConfigId] = React.useState('');
  // const [isShowEvaluationDetail, setIsShowEvaluationDetail] = React.useState(false);

  // const closeEvaluationDetail = () => setIsShowEvaluationDetail(false);

  const getDataSets = React.useCallback(async () => {
    if (api?.dataSet && projectId) {
      setSetsLoading(true);
      const response = await api.dataSet.getAll(projectId);
      if (response.kind === 'ok') {
        setDataSets(response.dataSets);
      } else {
        log({
          file: `SET.tsx`,
          caller: `getDataSets - failed to get data sets`,
          value: response,
          important: true,
        });
      }
      setSetsLoading(false);
    }
  }, [api, projectId]);

  const modelConfigsById: GenericById<ModelConfig> = React.useMemo(
      () => {
        const modelConfigsByIdTemp: { [x: string]: ModelConfig; } = {};
        modelConfigs.forEach(modelConfig => modelConfigsByIdTemp[modelConfig.id] = modelConfig);
        return modelConfigsByIdTemp;
      },
      [modelConfigs]
  );

  /**
   * should fetch data on initial load and every time the counter changes
   */
  React.useEffect(() => {
    if(refreshCounter && refreshCounter > 0) {
      // getDataSets();
    }
  }, [refreshCounter]);

  /**
   * should refresh if the project has changed
   */
  React.useEffect(() => {
    // getDataSets();
    setDataSets(initialDataSets);
  }, [initialDataSets]);

  const openTranscriberDialog = () => setTranscribersDialogOpen(true);
  const closeTranscriberDialog = () => {
    setTranscribersDialogOpen(false);
    setSelectedDataSet(undefined);
    setSelectedDataSetIndex(undefined);
  };

  const openRequestEvaluationDialog = (contentMsg: string, index: number) => {
    setContentMsg(contentMsg);
    setSelectedDataSet(dataSets[index]);
    setSelectedDataSetIndex(index);
    setIsEvaluationRequested(true);
  };

  const handleEvaluationRequested = async () => {
    setSetsLoading(true);
    if(api?.dataSet && selectedDataSet && selectedModelConfigId) {
      let serverError: ServerError | undefined;
      const response = await api.dataSet.requestEvaluation(projectId, selectedDataSet.id, selectedModelConfigId);

      if(response.kind === 'ok') {
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
      } else {
        log({
          file: 'SetItem.tsx',
          caller: 'createTrainingSet - failed to send post request',
          value: response,
          important: true,
        });
        serverError = response.serverError;
        let errorMessageText = translate('common.error');
        if(serverError?.message) {
          errorMessageText = serverError.message;
        }
        enqueueSnackbar(errorMessageText, { variant: SNACKBAR_VARIANTS.error })
      }
    }
    setContentMsg('');
    setSelectedDataSet(undefined);
    setSelectedDataSetIndex(undefined);
    setSetsLoading(false);
    setIsEvaluationRequested(false);
  }

  const handleCloseEvaluationRequest = () => {
    setIsEvaluationRequested(false);
    setContentMsg('');
    setSelectedDataSet(undefined);
    setSelectedDataSetIndex(undefined);
    setSetsLoading(false);
  };

  const handleTranscriberEditClick = (dataSetIndex: number) => {
    setSelectedDataSet(dataSets[dataSetIndex]);
    setSelectedDataSetIndex(dataSetIndex);
    openTranscriberDialog();
  };

  // const handleEvaluationDetailClick = (dataSetIndex: number) => {
  //   setSelectedDataSet(dataSets[dataSetIndex]);
  //   setSelectedDataSetIndex(dataSetIndex);
  //   setIsShowEvaluationDetail(true);
  // };

  const onUpdateDataSetSuccess = (updatedDataSet: DataSet, dataSetIndex: number): void => {
    setDataSets((prevDataSets) => {
      const updatedDataSets = [...prevDataSets];
      updatedDataSets.splice(dataSetIndex, 1, updatedDataSet);
      return updatedDataSets;
    });
  };

  if (isForbidden) {
    return <Forbidden />;
  }

  return (
    <>
      <AddTranscriberDialog
        transcribers={transcribersStats}
        transcribersLoading={transcriberStatDataLoading}
        open={transcribersDialogOpen}
        onClose={closeTranscriberDialog}
        projectId={projectId}
        dataSet={selectedDataSet}
        dataSetIndex={selectedDataSetIndex}
        onUpdateDataSetSuccess={onUpdateDataSetSuccess}
      />
       <ConfirmationDialog
          contentMsg={contentMsg}
          buttonMsg={translate('SET.requestEvaluation')}
          open={isEvaluationRequested}
          onClose={handleCloseEvaluationRequest}
          onSuccess={handleEvaluationRequested}
          modelConfigsById={modelConfigsById}
          selectedDataSet={selectedDataSet}
          setSelectedModelConfigId={(modelConfigId: string) => setSelectedModelConfigId(modelConfigId)}/>
      {/*Evulation Detail modal is commented out for potential future use*/}
      {/*<EvaluationDetailModal*/}
      {/*    dataSet={selectedDataSet}*/}
      {/*    closeEvaluationDetail={closeEvaluationDetail}*/}
      {/*    open={isShowEvaluationDetail}/>*/}
      {setsLoading ? <BulletList /> :
        <SetTable
          projectId={projectId}
          dataSets={dataSets}
          openTranscriberDialog={handleTranscriberEditClick}
          openRequestEvaluationDialog={openRequestEvaluationDialog}
          // openEvaluationDetail={handleEvaluationDetailClick}
          displaySubSetInTDP={displaySubSetInTDP}
        />
      }
    </>
  );
};