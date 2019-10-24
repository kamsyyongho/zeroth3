import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { TabPanel } from '../../shared/TabPanel';
import { AcousticModelGridList } from './acoustic-model/AcousticModelGridList';

export function ModelTabs() {
  const [activeTab, setActiveTab] = React.useState(0);
  const { translate } = React.useContext(I18nContext);

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
        <Typography>
          Item Two
        </Typography>
      </TabPanel>
    </Paper>
  );
}