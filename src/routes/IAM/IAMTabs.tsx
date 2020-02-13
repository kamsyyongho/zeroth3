import Paper from '@material-ui/core/Paper';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import React from 'reactn';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { BooleanById } from '../../types';
import { TabPanel } from '../shared/TabPanel';
import { TranscribersSummary } from './TranscribersSummary';
import { UsersSummary } from './UsersSummary';

enum TAB_INDEX {
  USERS,
  TRANSCRIBERS,
}

const STARTING_TAB_INDEX = TAB_INDEX.USERS;

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      backgroundColor: theme.palette.background.default,
    },
  }),
);

export type CheckedSubGraphById = BooleanById;

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface IAMTabsProps {
  usersAccess: boolean;
  transcribersAccess: boolean;
}

export function IAMTabs(props: IAMTabsProps) {
  const { usersAccess, transcribersAccess } = props;
  const { translate } = React.useContext(I18nContext);
  const [activeTab, setActiveTab] = React.useState(STARTING_TAB_INDEX);
  const [transcriberRefreshCounter, setTranscriberRefreshCounter] = React.useState(0);

  const classes = useStyles();

  /** used to prevent tabs from rendering before they should be displayed */
  const tabsThatShouldRender = React.useMemo<Set<number>>(() => new Set([activeTab]), []);

  const handleChange = (event: React.ChangeEvent<{}>, newActiveTab: number) => {
    tabsThatShouldRender.add(newActiveTab);
    setActiveTab(newActiveTab);
  };

  // index will be `0` if there is only one item in the list
  const transcribersTabIndex = usersAccess ? TAB_INDEX.TRANSCRIBERS : 0;

  /**
   * Increments the counter that is passed to the `TranscribersSummary` component
   * - the child component refetches all data everytime the counter changes
   * - called whenever the transcriber role is changed for a user
   */
  const handleTranscriberRoleAssign = () => {
    if (tabsThatShouldRender.has(transcribersTabIndex)) {
      setTranscriberRefreshCounter(transcriberRefreshCounter + 1);
    }
  };

  return (
    <Paper square elevation={0} className={classes.root} >
      <Tabs
        centered={false}
        value={activeTab}
        indicatorColor="primary"
        textColor="primary"
        onChange={handleChange}
      >
        {usersAccess && <Tab label={translate('IAM.users')} />}
        {transcribersAccess && <Tab label={translate('IAM.transcribers')} />}
      </Tabs>
      {usersAccess && <TabPanel value={activeTab} index={TAB_INDEX.USERS}>
        {tabsThatShouldRender.has(TAB_INDEX.USERS) && <UsersSummary hasAccess={usersAccess} onTranscriberAssign={handleTranscriberRoleAssign} />}
      </TabPanel>}
      {transcribersAccess && <TabPanel value={activeTab} index={transcribersTabIndex}>
        {tabsThatShouldRender.has(transcribersTabIndex) && <TranscribersSummary hasAccess={transcribersAccess} refreshCounter={transcriberRefreshCounter} />}
      </TabPanel>}
    </Paper>
  );
}