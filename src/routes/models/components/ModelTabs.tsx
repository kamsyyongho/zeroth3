import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useSnackbar } from 'notistack';
import React from 'react';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { deleteSubGraphResult } from '../../../services/api/types';
import { ServerError } from '../../../services/api/types/api-problem.types';
import { BooleanById, SubGraph, TopGraph } from '../../../types';
import log from '../../../util/log/logger';
import { ConfirmationDialog } from '../../shared/ConfirmationDialog';
import { TabPanel } from '../../shared/TabPanel';
import { AcousticModelGridList } from './acoustic-model/AcousticModelGridList';
import { LanguageModelGridList } from './language-model/LanguageModelGridList';
import { SubGraphList } from './subgraph/SubGraphList';

const STARTING_TAB_INDEX = 1;

export type CheckedSubGraphById = BooleanById;

export function ModelTabs() {
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = React.useState(STARTING_TAB_INDEX);
  const [topGraphs, setTopGraphs] = React.useState<TopGraph[]>([] as TopGraph[]);
  const [subGraphs, setSubGraphs] = React.useState<SubGraph[]>([] as SubGraph[]);
  const [topGraphsLoading, setTopGraphsLoading] = React.useState(true);
  const [subGraphsLoading, setSubGraphsLoading] = React.useState(true);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [checkedSubGraphs, setCheckedSubGraphs] = React.useState<CheckedSubGraphById>({});

  const confirmDelete = () => setConfirmationOpen(true);
  const closeConfirmation = () => setConfirmationOpen(false);

  let subGraphsToDelete: number[] = [];
  Object.keys(checkedSubGraphs).forEach(subGraphId => {
    const checked = checkedSubGraphs[Number(subGraphId)];
    if (checked) {
      subGraphsToDelete.push(Number(subGraphId));
    }
  });

  /**
   * remove the deleted subGraph from all lists
   */
  const handleDeleteSuccess = (idsToDelete: number[]) => {
    const subGraphsCopy = subGraphs.slice();
    // count down to account for removing indexes
    for (let i = subGraphs.length - 1; i >= 0; i--) {
      const model = subGraphs[i];
      if (idsToDelete.includes(model.id)) {
        subGraphsCopy.splice(i, 1);
      }
    }
    subGraphsToDelete = [];
    setCheckedSubGraphs({});
    setSubGraphs(subGraphsCopy);
  };

  const handleSubGraphCheck = (subGraphId: number, value: boolean): void => {
    setCheckedSubGraphs((prevCheckedSubGraphs) => {
      return { ...prevCheckedSubGraphs, [subGraphId]: value };
    });
  };

  const handleSubGraphDelete = async () => {
    setDeleteLoading(true);
    closeConfirmation();
    const deleteProjectPromises: Promise<deleteSubGraphResult>[] = [];
    const successIds: number[] = [];
    subGraphsToDelete.forEach(subGraphId => {
      if (api && api.models) {
        deleteProjectPromises.push(api.models.deleteSubGraph(subGraphId));
      } else {
        return;
      }
    });
    let serverError: ServerError | undefined;
    const responseArray = await Promise.all(deleteProjectPromises);
    responseArray.forEach((response, responseIndex) => {
      if (response.kind !== "ok") {
        log({
          file: `ModelTabs.tsx`,
          caller: `handleSubGraphDelete - Error:`,
          value: response,
          error: true,
        });
        serverError = response.serverError;
        let errorMessageText = translate('common.error');
        if (serverError && serverError.message) {
          errorMessageText = serverError.message;
        }
        enqueueSnackbar(errorMessageText, { variant: 'error' });
      } else {
        successIds.push(subGraphsToDelete[responseIndex]);
        enqueueSnackbar(translate('common.success'), { variant: 'success', preventDuplicate: true });
      }
    });
    // update the subGraph list
    handleDeleteSuccess(successIds);
    setDeleteLoading(false);
  };

  React.useEffect(() => {
    const getTopGraphs = async () => {
      if (api && api.models) {
        const response = await api.models.getTopGraphs();
        if (response.kind === 'ok') {
          setTopGraphs(response.topGraphs);
        } else {
          log({
            file: `ModelTabs.tsx`,
            caller: `getTopGraphs - failed to get top graphs`,
            value: response,
            important: true,
          });
        }
        setTopGraphsLoading(false);
      }
    };
    getTopGraphs();
  }, [api]);

  React.useEffect(() => {
    const getSubGraphs = async () => {
      if (api && api.models) {
        const response = await api.models.getSubGraphs();
        if (response.kind === 'ok') {
          setSubGraphs(response.subGraphs);
        } else {
          log({
            file: `ModelTabs.tsx`,
            caller: `getSubGraphs - failed to get sub graphs`,
            value: response,
            important: true,
          });
        }
        setSubGraphsLoading(false);
      }
    };
    getSubGraphs();
  }, [api]);

  const handleSubGraphListUpdate = (newSubGraph: SubGraph, isEdit?: boolean) => {
    if (isEdit) {
      setSubGraphs(prevSubGraphs => {
        const idToUpdate = newSubGraph.id;
        for (let i = 0; i < prevSubGraphs.length; i++) {
          if (prevSubGraphs[i].id === idToUpdate) {
            prevSubGraphs[i] = newSubGraph;
          }
        }
        return prevSubGraphs;
      });
    } else {
      setSubGraphs(prevSubGraphs => {
        prevSubGraphs.push(newSubGraph);
        return prevSubGraphs;
      });
    }
  };

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
          handleSubGraphListUpdate={handleSubGraphListUpdate}
        />
        <SubGraphList
          subGraphsLoading={subGraphsLoading}
          checkedSubGraphs={checkedSubGraphs}
          handleSubGraphCheck={handleSubGraphCheck}
          confirmDelete={confirmDelete}
          deleteLoading={deleteLoading}
          canDelete={!!subGraphsToDelete.length}
          subGraphs={subGraphs}
          handleSubGraphListUpdate={handleSubGraphListUpdate}
        />
      </TabPanel>
      <ConfirmationDialog
        destructive
        titleText={`${translate('models.deleteSubGraph', { count: subGraphsToDelete.length })}?`}
        submitText={translate('common.delete')}
        open={confirmationOpen}
        onSubmit={handleSubGraphDelete}
        onCancel={closeConfirmation}
      />
    </Paper>
  );
}