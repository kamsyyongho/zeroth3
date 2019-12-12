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
import { LanguageModel, SubGraph, TopGraph } from '../../../../types';
import { ChipList } from '../../../shared/ChipList';
import { LanguageModelDialog } from './LanguageModelDialog';
import { CheckedModelById, EditOpenByModelId } from './LanguageModelGridList';

const useStyles = makeStyles((theme) =>
  createStyles({
    card: {
      minWidth: 275,
    },
    category: {
      marginRight: theme.spacing(1),
    },
    text: {
      overflowWrap: 'break-word'
    }
  }),
);

interface LanguageModelGridItemProps {
  model: LanguageModel;
  canModify: boolean;
  topGraphs: TopGraph[];
  subGraphs: SubGraph[];
  editOpen: EditOpenByModelId;
  checkedModels: CheckedModelById;
  handleSubGraphListUpdate: (subGraph: SubGraph, isEdit?: boolean) => void;
  handleEditOpen: (modelId: string) => void;
  handleEditClose: (modelId: string) => void;
  handleEditSuccess: (updatedModel: LanguageModel, isEdit?: boolean) => void;
  handleModelCheck: (modelId: string, value: boolean) => void;
}

export function LanguageModelGridItem(props: LanguageModelGridItemProps) {
  const {
    model,
    canModify,
    topGraphs,
    subGraphs,
    editOpen,
    checkedModels,
    handleEditOpen,
    handleEditClose,
    handleEditSuccess,
    handleSubGraphListUpdate,
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
    <LanguageModelDialog
      open={isOpen}
      onClose={() => handleEditClose(model.id)}
      onSuccess={handleEditSuccess}
      topGraphs={topGraphs}
      subGraphs={subGraphs}
      handleSubGraphListUpdate={handleSubGraphListUpdate}
      modelToEdit={model}
    />
    <Card className={classes.card} elevation={2}>
      <CardHeader
        className={classes.text}
        title={model.name}
        subheader={model.description}
        action={(canModify && <>
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
            {`${translate('forms.top')}:`}
          </Typography>
          <Typography gutterBottom component="p" className={classes.text}>
            {model.topGraph.name}
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
            {`${translate('forms.sub')}:`}
          </Typography>
          <ChipList values={model.subGraphs.map(subGraph => subGraph.name)} light />
        </Grid>
      </CardContent>
    </Card>
  </Grid>);
};