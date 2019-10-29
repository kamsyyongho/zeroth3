import { Button, Grid } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import React from 'react';
import { BulletList } from 'react-content-loader';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { LanguageModel, SubGraph, TopGraph } from '../../../../types';
import log from '../../../../util/log/logger';
import { LanguageModelDialog } from './LanguageModelDialog';
import { LanguageModelGridItem } from './LanguageModelGridItem';

interface LanguageModelGridListProps {
  topGraphs: TopGraph[]
  subGraphs: SubGraph[]
  handleSubGraphCreate: (subGraph: SubGraph) => void
}

export interface EditOpenByModelId {
  [x: number]: boolean
}

export function LanguageModelGridList(props: LanguageModelGridListProps) {
  const { topGraphs, subGraphs, handleSubGraphCreate } = props;
  const api = React.useContext(ApiContext)
  const { translate } = React.useContext(I18nContext);
  const [models, setModels] = React.useState<LanguageModel[]>([]);
  const [modelsLoading, setModelsLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState<EditOpenByModelId>({});

  const handleEditOpen = (modelId: number) => setEditOpen(prevOpen => {
    return { ...prevOpen, [modelId]: true }
  });
  const handleEditClose = (modelId: number) => setEditOpen(prevOpen => {
    return { ...prevOpen, [modelId]: false }
  });

  const handleCreateOpen = () => setCreateOpen(true);
  const handleCreateClose = () => setCreateOpen(false);

  React.useEffect(() => {
    const getModels = async () => {
      if (api && api.models) {
        const response = await api.models.getLanguageModels();
        if (response.kind === "ok") {
          setModels(response.languageModels)
        } else {
          log({
            file: `LanguageModelGridList.tsx`,
            caller: `getModels - failed to get language models`,
            value: response,
            important: true,
          })
        }
        setModelsLoading(false);
      }
    }
    getModels();
  }, []);

  const handleModelListUpdate = (model: LanguageModel, isEdit?: boolean) => {
    if (isEdit) {
      setModels(prevModels => {
        const idToUpdate = model.id;
        for (let i = 0; i < prevModels.length; i++) {
          if (prevModels[i].id === idToUpdate) {
            prevModels[i] = model;
          }
        }
        return prevModels
      })
    } else {
      setModels(prevModels => {
        prevModels.push(model);
        return prevModels
      })
    }
  }

  const handleEditSuccess = (updatedModel: LanguageModel, isEdit?: boolean) => {
    handleModelListUpdate(updatedModel, isEdit);
    handleEditClose(updatedModel.id);
  }

  // HANDLE EDIT

  // CHANGE EDIT ICON AND TEXT


  const renderModels = () => models.map((model, index) => (
    <LanguageModelGridItem
      key={index}
      model={model}
      editOpen={editOpen}
      topGraphs={topGraphs}
      subGraphs={subGraphs}
      handleEditClose={handleEditClose}
      handleEditOpen={handleEditOpen}
      handleSubGraphCreate={handleSubGraphCreate}
      handleEditSuccess={handleEditSuccess}
    />
  ))

  const renderCreateButton = () => <Button
    variant="contained"
    color="primary"
    onClick={handleCreateOpen}
    startIcon={<AddIcon />}
  >
    {translate('models.tabs.languageModel.create')}
  </Button>

  if (modelsLoading) {
    return <BulletList />
  }
  if (!models.length) {
    return (
      <>
        {renderCreateButton()}
        <LanguageModelDialog
          open={createOpen}
          onClose={handleCreateClose}
          onSuccess={handleModelListUpdate}
          topGraphs={topGraphs}
          subGraphs={subGraphs}
          handleSubGraphCreate={handleSubGraphCreate}
        />
      </>
    )
  }
  return (
    <Grid container spacing={2} >
      {renderModels()}
      <Grid item md={12}>
        {renderCreateButton()}
      </Grid>
      <LanguageModelDialog
        open={createOpen}
        onClose={handleCreateClose}
        onSuccess={handleModelListUpdate}
        topGraphs={topGraphs}
        subGraphs={subGraphs}
        handleSubGraphCreate={handleSubGraphCreate}
      />
    </Grid>
  )
}
