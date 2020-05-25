import { Card } from '@material-ui/core';
import CardContent from '@material-ui/core/CardContent';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { BulletList } from 'react-content-loader';
import React from "reactn";
import { ApiContext } from '../../hooks/api/ApiContext';
import { ProblemKind } from '../../services/api/types/api-problem.types';
import { LOCAL_STORAGE_KEYS } from '../../types';
import { PaginatedResults } from '../../types/pagination.types';
import { TranscriberStats } from '../../types/transcriber.types';
import log from '../../util/log/logger';
import { Forbidden } from '../shared/Forbidden';
import { TranscribersTable } from './components/transcribers/TranscribersTable';

const useStyles = makeStyles((theme) =>
  createStyles({
    card: {
      backgroundColor: theme.palette.background.default,
    },
    cardContent: {
      padding: 0,
    },
  }),
);

interface TranscribersSummaryProps {
  hasAccess: boolean;
  refreshCounter?: number;
}

export function TranscribersSummary(props: TranscribersSummaryProps) {
  const { hasAccess, refreshCounter } = props;
  const api = React.useContext(ApiContext);
  const [isForbidden, setIsForbidden] = React.useState(false);
  const [transcriberStatDataLoading, setTranscriberStatDataLoading] = React.useState(true);
  const [initialDataLoading, setInitialDataLoading] = React.useState(true);
  const [transcribersStats, setTranscribersStats] = React.useState<TranscriberStats[]>([]);
  const [pagination, setPagination] = React.useState<PaginatedResults>({} as PaginatedResults);

  const classes = useStyles();
  const initialPageSize = React.useMemo(() => {
    const rowsPerPageString = localStorage.getItem(LOCAL_STORAGE_KEYS.TRANSCRIBER_TABLE_ROWS_PER_PAGE);
    if (rowsPerPageString) {
      const rowsPerPage = Number(rowsPerPageString);
      if (!isNaN(rowsPerPage)) {
        return rowsPerPage;
      }
    }
    return undefined;
  }, []);

  const getTranscribersWithStats = async (page?: number, size?: number) => {
    if (api?.transcriber) {
      setTranscriberStatDataLoading(true);
      const response = await api.transcriber.getTranscribersWithStats(page, size);
      if (response.kind === 'ok') {
        console.log('=======response.transcriberStats', response.transcribersStats);
        setTranscribersStats(response.transcribersStats);
        setPagination(response.pagination);
      } else {
        if (response.kind === ProblemKind['forbidden']) {
          setIsForbidden(true);
        }
        log({
          file: `TranscribersSummary.tsx`,
          caller: `getTranscribersWithStats - failed to get transcribers stat data`,
          value: response,
          important: true,
        });
      }
      setTranscriberStatDataLoading(false);
      setInitialDataLoading(false);
    }
  };

  React.useEffect(() => {
    if (hasAccess) {
      getTranscribersWithStats(undefined, initialPageSize);
    } else {
      setIsForbidden(true);
    }
  }, [refreshCounter]);


  if (isForbidden) {
    return <Forbidden />;
  }

  return (
    <Card elevation={0} className={classes.card} >
      <CardContent className={classes.cardContent} >
        {initialDataLoading ? <BulletList /> :
          <TranscribersTable
            loading={transcriberStatDataLoading}
            pagination={pagination}
            transcribersStats={transcribersStats}
            handleUpdate={getTranscribersWithStats}
          />}
      </CardContent>
    </Card>
  );
};
