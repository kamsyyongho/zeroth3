import { CardHeader, Grid } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import EditIcon from '@material-ui/icons/Edit';
import React from 'react';
import { LanguageModel, SubGraph, TopGraph } from '../../../../types';
import { ChipList } from '../../../shared/ChipList';
import { LanguageModelDialog } from './LanguageModelDialog';
import { CheckedModelById, EditOpenByModelId } from './LanguageModelGridList';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    card: {
      minWidth: 275,
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
  handleEditOpen: (modelId: number) => void;
  handleEditClose: (modelId: number) => void;
  handleEditSuccess: (updatedModel: LanguageModel, isEdit?: boolean) => void;
  handleModelCheck: (modelId: number, value: boolean) => void;
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
    <Card className={classes.card}>
      <CardHeader title={model.name} className={classes.text} action={(canModify && <>
        <Checkbox checked={isChecked} value="checkedB" color="secondary" onChange={(event) => handleModelCheck(model.id, event.target.checked)} />
        <IconButton aria-label="edit" onClick={() => handleEditOpen(model.id)}>
          <EditIcon />
        </IconButton></>)} />
      <CardActionArea>
        <CardContent>
          <Typography gutterBottom color="textSecondary" className={classes.text}>
            {model.version}
          </Typography>
          <Typography component="p">
            {model.topGraph.name}
          </Typography>
          <ChipList values={model.subGraphs.map(subGraph => subGraph.name)} />
          <Typography gutterBottom variant="body1" color="textPrimary" className={classes.text} >
            {model.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  </Grid>);
};