import { Button, Card, Grid, CardContent } from '@material-ui/core';
import CardActions from '@material-ui/core/CardActions';
import AddIcon from '@material-ui/icons/Add';
import React from 'react';
import { BulletList } from 'react-content-loader';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { AcousticModel } from '../../../../types';
import log from '../../../../util/log/logger';
import { AcousticModelDialog } from './AcousticModelDialog';
import { AcousticModelGridItem } from './AcousticModelGridItem';

export function AcousticModelGridList() {
  const api = React.useContext(ApiContext)
  const { translate } = React.useContext(I18nContext);
  const [models, setModels] = React.useState<AcousticModel[]>([]);
  const [modelsLoading, setModelsLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);

  const handleCreateOpen = () => setCreateOpen(true);
  const handleCreateClose = () => setCreateOpen(false);


  React.useEffect(() => {
    const getModels = async () => {
      if (api && api.models) {
        const response = await api.models.getAcousticModels();
        if (response.kind === "ok") {
          setModels(response.acousticModels)
        } else {
          log({
            file: `AcousticModelGridList.tsx`,
            caller: `getModels - failed to get acoustic models`,
            value: response,
            important: true,
          })
        }
        setModelsLoading(false);
      }
    }
    getModels();
  }, []);


  const handleModelListUpdate = (model: AcousticModel) => {
    setModels(prevModels => {
      prevModels.push(model);
      return prevModels
    })
  }


  const renderModels = () => models.map((model, index) => (
    <AcousticModelGridItem
      key={index}
      model={model}
    />
  ))

  if (modelsLoading) {
    return <BulletList />
  }

  return (
    <Card>
      <AcousticModelDialog open={createOpen} onClose={handleCreateClose} onSuccess={handleModelListUpdate} />
      {!!models.length &&
        (<CardContent>
          <Grid container spacing={2} >
            {renderModels()}
          </Grid>
        </CardContent>)}
      <CardActions>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateOpen}
          startIcon={<AddIcon />}
        >
          {translate('models.tabs.acousticModel.create')}
        </Button>
      </CardActions>
    </Card>
  )
}
