import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import React from 'react';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { SubGraph, TopGraph } from '../../../types';
import log from '../../../util/log/logger';
import { TabPanel } from '../../shared/TabPanel';
import { AcousticModelGridList } from './acoustic-model/AcousticModelGridList';
import { LanguageModelGridList } from './language-model/LanguageModelGridList';
import { SubGraphList } from './subgraph/SubGraphList';

const STARTING_TAB_INDEX = 1;

export function ModelTabs() {
  const [activeTab, setActiveTab] = React.useState(STARTING_TAB_INDEX);
  const [topGraphs, setTopGraphs] = React.useState<TopGraph[]>([] as TopGraph[]);
  const [subGraphs, setSubGraphs] = React.useState<SubGraph[]>([] as SubGraph[]);
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);

  React.useEffect(() => {
    const getTopGraphs = async () => {
      if (api && api.models) {
        const response = await api.models.getTopGraphs();
        if (response.kind === "ok") {
          setTopGraphs(response.topGraphs)
        } else {
          log({
            file: `ModelTabs.tsx`,
            caller: `getTopGraphs - failed to get top graphs`,
            value: response,
            important: true,
          })
        }
      }
    }
    getTopGraphs();
  }, []);

  React.useEffect(() => {
    const getSubGraphs = async () => {
      if (api && api.models) {
        const response = await api.models.getSubGraphs();
        if (response.kind === "ok") {
          setSubGraphs(response.subGraphs)
        } else {
          log({
            file: `ModelTabs.tsx`,
            caller: `getSubGraphs - failed to get sub graphs`,
            value: response,
            important: true,
          })
        }
      }
    }
    getSubGraphs();
  }, []);

  const handleSubGraphCreate = (newSubGraph: SubGraph) => {
    setSubGraphs((prevSubGraphs) => {
      prevSubGraphs.push(newSubGraph);
      return prevSubGraphs
    })
  }

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Paper square>
      <Tabs
        centered={false}
        value={activeTab}
        indicatorColor="primary"
        textColor="primary"
        onChange={handleChange}
      >
        <Tab label={translate('models.tabs.acousticModel.header')} />
        <Tab label={translate('models.tabs.languageModel.header')} />
      </Tabs>
      <TabPanel value={activeTab} index={0}>
        <AcousticModelGridList />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <LanguageModelGridList
          topGraphs={topGraphs}
          subGraphs={subGraphs}
          handleSubGraphCreate={handleSubGraphCreate}
        />
        <SubGraphList
          subGraphs={subGraphs}
          handleSubGraphCreate={handleSubGraphCreate}
        />
      </TabPanel>
    </Paper>
  );
}