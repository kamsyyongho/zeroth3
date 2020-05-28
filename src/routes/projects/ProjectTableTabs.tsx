import Paper from '@material-ui/core/Paper';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import React from 'reactn';
import { PERMISSIONS } from '../../constants';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { ApiContext } from '../../hooks/api/ApiContext';
import { ProblemKind } from '../../services/api/types';
import { BooleanById, DataSet, ModelConfig, PaginatedResults, Project, TranscriberStats } from '../../types';
import { TabPanel } from '../shared/TabPanel';
import SET from './set/SET';
import { TDP } from './TDP/TDP';
import log from '../../util/log/logger';

const STARTING_TAB_INDEX = 0;
enum TAB_INDEX {
  TDP,
  SET,
}

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      backgroundColor: theme.palette.background.default,
    },
  }),
);

export type CheckedSubGraphById = BooleanById;

interface ProjectTableTabsProps {
  projectId: string;
  project?: Project;
  modelConfigs: ModelConfig[];
  dataSets: DataSet[];
  modelConfigDialogOpen?: boolean;
  openModelConfigDialog?: (hideBackdrop?: boolean) => void;
}

export function ProjectTableTabs(props: ProjectTableTabsProps) {
  const {
    projectId,
    project,
    modelConfigs,
    dataSets,
    modelConfigDialogOpen,
    openModelConfigDialog,
  } = props;
  const { translate } = React.useContext(I18nContext);
  const { hasPermission, roles } = React.useContext(KeycloakContext);
  const api = React.useContext(ApiContext);
  const [activeTab, setActiveTab] = React.useState(STARTING_TAB_INDEX);
  const [refreshCounterForSet, setRefreshCounterForSet] = React.useState(0);
  const [transcriberStatDataLoading, setTranscriberStatDataLoading] = React.useState(true);
  const [transcribersStats, setTranscribersStats] = React.useState<TranscriberStats[]>([]);
  const [pagination, setPagination] = React.useState<PaginatedResults>({} as PaginatedResults);
  const [isForbidden, setIsForbidden] = React.useState(false);

  const classes = useStyles();
  const hasSetPermissions = React.useMemo(() => hasPermission(roles, PERMISSIONS.projects.SET), [roles]);

  /** used to prevent tabs from rendering before they should be displayed */
  const tabsThatShouldRender = React.useMemo<Set<number>>(() => new Set([activeTab]), []);

  const handleChange = (event: React.ChangeEvent<{}>, newActiveTab: number) => {
    tabsThatShouldRender.add(newActiveTab);
    setActiveTab(newActiveTab);
  };

  /**
   * Increments the counter that is passed to the `SET` component
   * - the child component refetches all data everytime the counter changes
   */
  const handleSetCreate = () => {
    if (tabsThatShouldRender.has(TAB_INDEX.SET)) {
      setRefreshCounterForSet(refreshCounterForSet + 1);
    }
  };

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

  return (
    <Paper square elevation={0} className={classes.root} >
      {hasSetPermissions && <Tabs
        centered={false}
        value={activeTab}
        indicatorColor="primary"
        textColor="primary"
        onChange={handleChange}
      >
        <Tab label={translate('TDP.TDP')} />
        <Tab label={translate('SET.SET')} />
      </Tabs>}
      <TabPanel value={activeTab} index={TAB_INDEX.TDP}>
        {tabsThatShouldRender.has(TAB_INDEX.TDP) &&
          <TDP
            projectId={projectId}
            project={project}
            modelConfigs={modelConfigs}
            dataSets={dataSets}
            onSetCreate={handleSetCreate}
            openModelConfigDialog={openModelConfigDialog}
            modelConfigDialogOpen={modelConfigDialogOpen}
            transcriberStats={transcribersStats}
          />}
      </TabPanel>
      {hasSetPermissions && <TabPanel value={activeTab} index={TAB_INDEX.SET}>
        {tabsThatShouldRender.has(TAB_INDEX.SET) &&
          <SET
            refreshCounter={refreshCounterForSet}
            projectId={projectId}
            modelConfigs={modelConfigs}
            getTranscribersWithStats={getTranscribersWithStats}
            transcribersStats={transcribersStats}
            pagination={pagination}
          />}
      </TabPanel>}
    </Paper>
  );
}