import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { BulletList } from 'react-content-loader';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { ProblemKind } from '../../../services/api/types';
import { DataSet, PaginatedResults, TranscriberStats } from '../../../types';
import log from '../../../util/log/logger';
import { Forbidden } from '../../shared/Forbidden';
import { AddTranscriberDialog } from './components/AddTranscriberDialog';
import { SetTable } from './components/SetTable';

interface SETProps {
  projectId: string;
  refreshCounter?: number;
}

export default function SET(props: SETProps) {
  const { projectId, refreshCounter } = props;
  const api = React.useContext(ApiContext);
  const [isForbidden, setIsForbidden] = React.useState(false);
  const [transcribersDialogOpen, setTranscribersDialogOpen] = React.useState(false);
  const [setsLoading, setSetsLoading] = React.useState(true);
  const [dataSets, setDataSets] = React.useState<DataSet[]>([]);
  const [seletectedDataSet, setSelectedDataSet] = React.useState<DataSet | undefined>();
  const [seletectedDataSetIndex, setSelectedDataSetIndex] = React.useState<number | undefined>();
  const [transcriberStatDataLoading, setTranscriberStatDataLoading] = React.useState(true);
  const [transcribersStats, setTranscribersStats] = React.useState<TranscriberStats[]>([]);
  const [pagination, setPagination] = React.useState<PaginatedResults>({} as PaginatedResults);

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

  const getTranscribersWithStats = async (page?: number, size = 10000) => {
    if (api?.transcriber) {
      setTranscriberStatDataLoading(true);
      const response = await api.transcriber.getTranscribersWithStats(page, size);
      if (response.kind === 'ok') {
        setTranscribersStats(response.transcribersStats);
        setPagination(response.pagination);
      } else {
        if (response.kind === ProblemKind['forbidden']) {
          setIsForbidden(true);
        }
        log({
          file: `SET.tsx`,
          caller: `getTranscribersWithStats - failed to get transcribers stat data`,
          value: response,
          important: true,
        });
      }
      setTranscriberStatDataLoading(false);
    }
  };

  React.useEffect(() => {
    getTranscribersWithStats();
  }, []);

  /**
   * should fetch data on initial load and every time the counter changes
   */
  React.useEffect(() => {
    getDataSets();
  }, [refreshCounter]);

  const openTranscriberDialog = () => setTranscribersDialogOpen(true);
  const closeTranscriberDialog = () => {
    setTranscribersDialogOpen(false);
    setSelectedDataSet(undefined);
    setSelectedDataSetIndex(undefined);
  };

  const handleTranscriberEditClick = (dataSetToEdit: DataSet, dataSetIndex: number) => {
    setSelectedDataSet(dataSetToEdit);
    setSelectedDataSetIndex(dataSetIndex);
    openTranscriberDialog();
  };

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
        dataSet={seletectedDataSet}
        dataSetIndex={seletectedDataSetIndex}
        onUpdateDataSetSuccess={onUpdateDataSetSuccess}
      />
      {setsLoading ? <BulletList /> :
        <SetTable
          dataSets={dataSets}
          openTranscriberDialog={handleTranscriberEditClick}
        />
      }
    </>
  );
};