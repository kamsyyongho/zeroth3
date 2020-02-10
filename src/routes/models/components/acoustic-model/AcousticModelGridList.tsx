import { Button, Card, CardContent, Grid, Typography } from '@material-ui/core';
import CardHeader from '@material-ui/core/CardHeader';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import CachedIcon from '@material-ui/icons/Cached';
import { BulletList } from 'react-content-loader';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { AcousticModel } from '../../../../types';
import log from '../../../../util/log/logger';
import { EditOpenByModelId } from '../language-model/LanguageModelGridList';
import { AcousticModelGridItem } from './AcousticModelGridItem';

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
  const [models, setModels] = React.useState<AcousticModel[]>([]);
  const [modelsLoading, setModelsLoading] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState<EditOpenByModelId>({});

  const theme = useTheme();
  const classes = useStyles();

  const handleEditOpen = (modelId: string) => setEditOpen(prevOpen => {
    return { ...prevOpen, [modelId]: true };
  });
  const handleEditClose = (modelId: string) => setEditOpen(prevOpen => {
    return { ...prevOpen, [modelId]: false };
  });

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



  const renderModels = () => {
    if (!models.length) {
      return <Typography align='center' variant='h6' >{translate('models.tabs.acousticModel.noResults')}</Typography>;
    }
    return models.map((model, index) => (
      <AcousticModelGridItem
        key={index}
        model={model}
        canModify={canModify}
        editOpen={editOpen}
        handleEditOpen={handleEditOpen}
        handleEditClose={handleEditClose}
        handleEditSuccess={handleEditSuccess}
      />
    ));
  };

  if (modelsLoading) {
    return <BulletList />;
  }

  return (
    <Card elevation={0} className={classes.root} >
      <CardHeader
        action={<Button
          disabled={modelsLoading}
          variant="outlined"
          color="primary"
          onClick={refreshAndGetModels}
          startIcon={modelsLoading ? <MoonLoader
            sizeUnit={"px"}
            size={15}
            color={theme.palette.common.white}
            loading={true}
          /> : <CachedIcon />}
        >
          {translate('common.refresh')}
        </Button>} />
      {!!models.length &&
        (<CardContent>
          <Grid container spacing={2} >
            {renderModels()}
          </Grid>
        </CardContent>)}
    </Card>
  );
}
