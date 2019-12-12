import { Button, Card, CardContent, Grid } from '@material-ui/core';
import CardHeader from '@material-ui/core/CardHeader';
import { useTheme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { useSnackbar } from 'notistack';
import React from 'react';
import { BulletList } from 'react-content-loader';
import MoonLoader from 'react-spinners/MoonLoader';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { deleteLanguageModelResult, ServerError } from '../../../../services/api/types';
import { BooleanById, LanguageModel, SubGraph, TopGraph } from '../../../../types';
import log from '../../../../util/log/logger';
import { ConfirmationDialog } from '../../../shared/ConfirmationDialog';
import { LanguageModelDialog } from './LanguageModelDialog';
import { LanguageModelGridItem } from './LanguageModelGridItem';

interface LanguageModelGridListProps {
  canModify: boolean;
  topGraphs: TopGraph[];
  subGraphs: SubGraph[];
  handleSubGraphListUpdate: (subGraph: SubGraph, isEdit?: boolean) => void;
}

export type EditOpenByModelId = BooleanById;

export type CheckedModelById = BooleanById;

export function LanguageModelGridList(props: LanguageModelGridListProps) {
  const { canModify, topGraphs, subGraphs, handleSubGraphListUpdate } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [models, setModels] = React.useState<LanguageModel[]>([]);
  const [modelsLoading, setModelsLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState<EditOpenByModelId>({});
  const [checkedModels, setCheckedModels] = React.useState<CheckedModelById>({});

  const theme = useTheme();

  const handleEditOpen = (modelId: string) => setEditOpen(prevOpen => {
    return { ...prevOpen, [modelId]: true };
  });
  const handleEditClose = (modelId: string) => setEditOpen(prevOpen => {
    return { ...prevOpen, [modelId]: false };
  });

  const handleCreateOpen = () => setCreateOpen(true);
  const handleCreateClose = () => setCreateOpen(false);

  const confirmDelete = () => setConfirmationOpen(true);
  const closeConfirmation = () => setConfirmationOpen(false);

  let modelsToDelete: string[] = [];
  Object.keys(checkedModels).forEach(modelId => {
    const checked = checkedModels[modelId];
    if (checked) {
      modelsToDelete.push(modelId);
    }
  });

  /**
   * remove the deleted models from all lists
   */
  const handleDeleteSuccess = (idsToDelete: string[]) => {
    const modelsCopy = models.slice();
    // count down to account for removing indexes
    for (let i = models.length - 1; i >= 0; i--) {
      const model = models[i];
      if (idsToDelete.includes(model.id)) {
        modelsCopy.splice(i, 1);
      }
    }
    modelsToDelete = [];
    setCheckedModels({});
    setModels(modelsCopy);
  };

  const handleModelCheck = (modelId: string, value: boolean): void => {
    setCheckedModels((prevCheckedModels) => {
      return { ...prevCheckedModels, [modelId]: value };
    });
  };

  React.useEffect(() => {
    const getModels = async () => {
      if (api?.models) {
        const response = await api.models.getLanguageModels();
        if (response.kind === 'ok') {
          setModels(response.languageModels);
        } else {
          log({
            file: `LanguageModelGridList.tsx`,
            caller: `getModels - failed to get language models`,
            value: response,
            important: true,
          });
        }
        setModelsLoading(false);
      }
    };
    getModels();
  }, [api]);

  const handleModelListUpdate = (model: LanguageModel, isEdit?: boolean) => {
    if (isEdit) {
      setModels(prevModels => {
        const idToUpdate = model.id;
        for (let i = 0; i < prevModels.length; i++) {
          if (prevModels[i].id === idToUpdate) {
            prevModels[i] = model;
          }
        }
        return prevModels;
      });
    } else {
      setModels(prevModels => {
        prevModels.push(model);
        return prevModels;
      });
    }
  };

  const handleModelDelete = async () => {
    if (!canModify) return;
    setDeleteLoading(true);
    closeConfirmation();
    const deleteProjectPromises: Promise<deleteLanguageModelResult>[] = [];
    const successIds: string[] = [];
    modelsToDelete.forEach(modelId => {
      if (api?.models) {
        deleteProjectPromises.push(api.models.deleteLanguageModel(modelId));
      } else {
        return;
      }
    });
    let serverError: ServerError | undefined;
    const responseArray = await Promise.all(deleteProjectPromises);
    responseArray.forEach((response, responseIndex) => {
      if (response.kind !== "ok") {
        log({
          file: `LanguageModelGridList.tsx`,
          caller: `handleModelDelete - Error:`,
          value: response,
          error: true,
        });
        serverError = response.serverError;
        let errorMessageText = translate('common.error');
        if (serverError?.message) {
          errorMessageText = serverError.message;
        }
        enqueueSnackbar(errorMessageText, { variant: 'error' });
      } else {
        successIds.push(modelsToDelete[responseIndex]);
        enqueueSnackbar(translate('common.success'), { variant: 'success', preventDuplicate: true });
      }
    });
    // update the model list
    handleDeleteSuccess(successIds);
    setDeleteLoading(false);
  };

  const handleEditSuccess = (updatedModel: LanguageModel, isEdit?: boolean) => {
    handleModelListUpdate(updatedModel, isEdit);
    handleEditClose(updatedModel.id);
  };

  const renderModels = () => models.map((model, index) => (
    <LanguageModelGridItem
      key={index}
      model={model}
      canModify={canModify}
      editOpen={editOpen}
      checkedModels={checkedModels}
      topGraphs={topGraphs}
      subGraphs={subGraphs}
      handleEditClose={handleEditClose}
      handleEditOpen={handleEditOpen}
      handleSubGraphListUpdate={handleSubGraphListUpdate}
      handleEditSuccess={handleEditSuccess}
      handleModelCheck={handleModelCheck}
    />
  ));

  if (modelsLoading) {
    return <BulletList />;
  }

  return (
    <Card elevation={0}>
      <LanguageModelDialog
        open={createOpen}
        onClose={handleCreateClose}
        onSuccess={handleModelListUpdate}
        topGraphs={topGraphs}
        subGraphs={subGraphs}
        handleSubGraphListUpdate={handleSubGraphListUpdate}
      />
      {canModify && <CardHeader
        action={(<Grid container spacing={1}>
          <Grid item>
            {!!models.length && <Button
              disabled={!modelsToDelete.length}
              variant="contained"
              color="secondary"
              onClick={confirmDelete}
              startIcon={deleteLoading ? <MoonLoader
                sizeUnit={"px"}
                size={15}
                color={theme.palette.common.white}
                loading={true}
              /> : <DeleteIcon />}
            >
              {translate('common.delete')}
            </Button>}
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateOpen}
              startIcon={<AddIcon />}
            >
              {translate('models.tabs.languageModel.create')}
            </Button>
          </Grid>
        </Grid>)} />}
      {!!models.length &&
        (<CardContent>
          <Grid container spacing={2} >
            {renderModels()}
          </Grid>
        </CardContent>)}
      <ConfirmationDialog
        destructive
        titleText={`${translate('models.tabs.languageModel.delete', { count: modelsToDelete.length })}?`}
        submitText={translate('common.delete')}
        open={confirmationOpen}
        onSubmit={handleModelDelete}
        onCancel={closeConfirmation}
      />
    </Card>
  );
}
