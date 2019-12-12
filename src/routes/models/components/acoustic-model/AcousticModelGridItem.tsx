import { CardHeader, Grid } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import EditIcon from '@material-ui/icons/Edit';
import React from 'react';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { AcousticModel } from '../../../../types';
import { CheckedModelById, EditOpenByModelId } from '../language-model/LanguageModelGridList';
import { AcousticModelDialog } from './AcousticModelDialog';

const useStyles = makeStyles((theme) =>
  createStyles({
    card: {
      minWidth: 275,
    },
    text: {
      overflowWrap: 'break-word'
    },
    category: {
      marginRight: theme.spacing(1),
    },
  }),
);

interface AcousticModelGridItemProps {
  model: AcousticModel;
  canModify: boolean;
  editOpen: EditOpenByModelId;
  checkedModels: CheckedModelById;
  handleEditOpen: (modelId: string) => void;
  handleEditClose: (modelId: string) => void;
  handleEditSuccess: (updatedModel: AcousticModel, isEdit?: boolean) => void;
  handleModelCheck: (modelId: string, value: boolean) => void;
}

export function AcousticModelGridItem(props: AcousticModelGridItemProps) {
  const {
    model,
    canModify,
    editOpen,
    checkedModels,
    handleEditOpen,
    handleEditClose,
    handleEditSuccess,
    handleModelCheck,
  } = props;
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();
  const isOpen = !!editOpen[model.id];
  let isChecked = false;
  if (checkedModels && typeof checkedModels[model.id] === 'boolean') {
    isChecked = checkedModels[model.id];
  }


  return (<Grid item xs key={model.id}>
    <AcousticModelDialog
      open={isOpen}
      onClose={() => handleEditClose(model.id)}
      onSuccess={handleEditSuccess}
      modelToEdit={model}
    />
    <Card className={classes.card} elevation={2}>
      <CardHeader
        className={classes.text}
        title={model.name}
        subheader={model.description}
        action={canModify && (<>
          <Checkbox checked={isChecked} value="checkedB" color="secondary" onChange={(event) => handleModelCheck(model.id, event.target.checked)} />
          <IconButton aria-label="edit" onClick={() => handleEditOpen(model.id)}>
            <EditIcon />
          </IconButton></>)} />
      <CardContent>
        <Grid
          container
          wrap='nowrap'
          direction='row'
          alignContent='center'
          alignItems='center'
          justify='flex-start'
        >
          <Typography
            className={classes.category}
            variant='subtitle2'
          >
            {`${translate('common.version')}:`}
          </Typography>
          <Typography gutterBottom color="textSecondary" className={classes.text}>
            {model.version}
          </Typography>
        </Grid>
        <Grid
          container
          wrap='nowrap'
          direction='row'
          alignContent='center'
          alignItems='center'
          justify='flex-start'
        >
          <Typography
            className={classes.category}
            variant='subtitle2'
          >
            {`${translate('forms.sampleRate')}:`}
          </Typography>
          <Typography gutterBottom component="p" className={classes.text}>
            {model.sampleRate}{' kHz'}
          </Typography>
        </Grid>
      </CardContent>
    </Card>
  </Grid>);
};