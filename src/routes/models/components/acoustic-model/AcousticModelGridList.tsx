import { Button, Card, CardContent, Grid, Typography } from '@material-ui/core';
import CardHeader from '@material-ui/core/CardHeader';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import CachedIcon from '@material-ui/icons/Cached';
import DeleteIcon from '@material-ui/icons/Delete';
import { BulletList } from 'react-content-loader';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { AcousticModel, SNACKBAR_VARIANTS, BooleanById } from '../../../../types';
import { deleteLanguageModelResult, ServerError } from '../../../../services/api/types';
import log from '../../../../util/log/logger';
import { EditOpenByModelId, CheckedModelById } from '../language-model/LanguageModelGridList';
import { AcousticModelGridItem } from './AcousticModelGridItem';
import { ConfirmationDialog } from '../../../shared/ConfirmationDialog';
import { useSnackbar } from 'notistack';

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      backgroundColor: theme.palette.background.default,
    },
  }),
);

interface AcousticModelGridListProps {
  canModify: boolean;
}


export function AcousticModelGridList(props: AcousticModelGridListProps) {
  const { canModify } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [models, setModels] = React.useState<AcousticModel[]>([]);
  const [modelsLoading, setModelsLoading] = React.useState(true);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState<EditOpenByModelId>({});
  const [checkedModels, setCheckedModels] = React.useState<CheckedModelById>({});
  const [isConfirmationOpen, setIsConfirmationOpen] = React.useState(false);

  const theme = useTheme();
  const classes = useStyles();

  let modelsToDelete: string[] = [];
  Object.keys(checkedModels).forEach(modelId => {
    const checked = checkedModels[modelId];
    if (checked) {
      modelsToDelete.push(modelId);
    }
  });

  const handleEditOpen = (modelId: string) => setEditOpen(prevOpen => {
    return { ...prevOpen, [modelId]: true };
  });
  const handleEditClose = (modelId: string) => setEditOpen(prevOpen => {
    return { ...prevOpen, [modelId]: false };
  });
  const confirmDelete = () => setIsConfirmationOpen(true);
  const closeConfirmation = () => setIsConfirmationOpen(false);


  React.useEffect(() => {
    const getModels = async () => {
      if (api?.models) {
        const response = await api.models.getAcousticModels();
        if (response.kind === 'ok') {
          setModels(response.acousticModels);
        } else {
          log({
            file: `AcousticModelGridList.tsx`,
            caller: `getModels - failed to get acoustic models`,
            value: response,
            important: true,
          });
        }
        setModelsLoading(false);
      }
    };
    getModels();
  }, []);

  const refreshAndGetModels = async () => {
    if (api?.models && !modelsLoading) {
      setModelsLoading(true);
      const response = await api.models.refreshAndGetAcousticModels();
      if (response.kind === 'ok') {
        setModels(response.acousticModels);
      } else {
        log({
          file: `AcousticModelGridList.tsx`,
          caller: `refreshAndGetModels - failed to refresh and get acoustic models`,
          value: response,
          important: true,
        });
      }
      setModelsLoading(false);
    }
  };

  const handleModelListUpdate = (model: AcousticModel, isEdit?: boolean) => {
    if (isEdit) {
      setModels(prevModels => {
        const idToUpdate = model.id;
        for (let i = 0; i < prevModels.length; i++) {
          if (prevModels[i].id === idToUpdate) {
            prevModels[i] = model;
            break;
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

  const handleEditSuccess = (updatedModel: AcousticModel, isEdit?: boolean) => {
    handleModelListUpdate(updatedModel, isEdit);
    handleEditClose(updatedModel.id);
  };

  
  const handleModelCheck = (modelId: string, value: boolean) : void => {
    setCheckedModels((prevCheckedModels) => {
      return { ...prevCheckedModels, [modelId]: value };
    })
  }

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

  const handleModelDelete = async () => {
    if (!canModify) return;
    setDeleteLoading(true);
    closeConfirmation();
    const deleteProjectPromises: Promise<deleteLanguageModelResult>[] = [];
    const successIds: string[] = [];
    modelsToDelete.forEach(modelId => {
      if (api?.models) {
        deleteProjectPromises.push(api.models.deleteAcousticModel(modelId));
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
        enqueueSnackbar(errorMessageText, { variant: SNACKBAR_VARIANTS.error });
      } else {
        successIds.push(modelsToDelete[responseIndex]);
        enqueueSnackbar(translate('common.success'), { variant: 'success', preventDuplicate: true });
      }
    });
    // update the model list
    handleDeleteSuccess(successIds);
    setDeleteLoading(false);
  };


  const renderModels = () => {
    if (!models.length) {
      return <Typography align='center' variant='h6' >{translate('models.tabs.acousticModel.noResults')}</Typography>;
    }
    return models.map((model, index) => (
      <AcousticModelGridItem
        key={index}
        model={model}
        canModify={canModify}
        checkedModels={checkedModels}
        editOpen={editOpen}
        handleEditOpen={handleEditOpen}
        handleEditClose={handleEditClose}
        handleEditSuccess={handleEditSuccess}
        handleModelCheck={handleModelCheck}
      />
    ));
  };

  if (modelsLoading) {
    return <BulletList />;
  }

  return (
    <Card elevation={0} className={classes.root} >
      <CardHeader
        action={
          <Grid container spacing={1}>
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
                  disabled={modelsLoading}
                  variant="outlined"
                  color="primary"
                  onClick={refreshAndGetModels}
                  startIcon={modelsLoading ? <MoonLoader
                      sizeUnit={"px"}
                      size={15}
                      color={theme.palette.common.white}
                      loading={true}
                  /> : <CachedIcon />}>
                {translate('common.refresh')}
              </Button>
            </Grid>
          </Grid>
        } />
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
          open={isConfirmationOpen}
          onSubmit={handleModelDelete}
          onCancel={closeConfirmation}
      />
    </Card>
  );
}
