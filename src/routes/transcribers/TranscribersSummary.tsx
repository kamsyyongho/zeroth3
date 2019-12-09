import { Card, CardHeader, Container } from '@material-ui/core';
import CardContent from '@material-ui/core/CardContent';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from "react";
import { BulletList } from 'react-content-loader';
import { PERMISSIONS } from '../../constants/permission.constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { ProblemKind } from '../../services/api/types/api-problem.types';
import { PaginatedResults } from '../../types/pagination.types';
import { TranscriberStats } from '../../types/transcriber.types';
import log from '../../util/log/logger';
import { Forbidden } from '../shared/Forbidden';
import { TranscribersTable } from './components/TranscribersTable';

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      padding: 0,
    },
    cardContent: {
      padding: 0,
    },
  }),
);

export function TranscribersSummary() {
  const api = React.useContext(ApiContext);
  const { hasPermission } = React.useContext(KeycloakContext);
  const { translate } = React.useContext(I18nContext);
  const [isForbidden, setIsForbidden] = React.useState(false);
  const [transcriberStatDataLoading, setTranscriberStatDataLoading] = React.useState(true);
  const [initialDataLoading, setInitialDataLoading] = React.useState(true);
  const [transcribersStats, setTranscribersStats] = React.useState<TranscriberStats[]>([]);
  const [pagination, setPagination] = React.useState<PaginatedResults>({} as PaginatedResults);

  const classes = useStyles();


  const getTranscribersWithStats = async (page?: number, size?: number) => {
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
    const hasAccess = hasPermission(PERMISSIONS.crud);
    if (hasAccess) {
      getTranscribersWithStats();
    } else {
      setIsForbidden(true);
    }
  }, []);


  if (isForbidden) {
    return <Forbidden />;
  }

  return (
    <Container maxWidth={false} className={classes.container} >
      <Card >
        <CardHeader
          title={translate("path.transcribers")}
        />
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
    </Container >
  );
};;;
