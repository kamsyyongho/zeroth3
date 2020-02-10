import { Box, CardHeader, Grid } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import EditIcon from '@material-ui/icons/Edit';
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../../theme';
import { LanguageModel, SubGraph, TopGraph } from '../../../../types';
import { ChipList } from '../../../shared/ChipList';
import { LanguageModelDialog } from './LanguageModelDialog';
import { CheckedModelById, EditOpenByModelId } from './LanguageModelGridList';

const MIN_CARD_WIDTH = 300;
const MAX_CARD_WIDTH = MIN_CARD_WIDTH * 2;
const MAX_TITLE_WIDTH = MAX_CARD_WIDTH - 250;

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      minWidth: MIN_CARD_WIDTH,
      maxWidth: MAX_CARD_WIDTH,
      margin: theme.spacing(1),
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
  const theme: CustomTheme = useTheme();
  const isOpen = !!editOpen[model.id];
  let isChecked = false;
  if (checkedModels && typeof checkedModels[model.id] === 'boolean') {
    isChecked = checkedModels[model.id];
  }

  return (<Box key={model.id} border={1} borderColor={theme.table.border} className={classes.root}>
    <Grid item xs component={Card} elevation={0} >
      <LanguageModelDialog
        open={isOpen}
        onClose={() => handleEditClose(model.id)}
        onSuccess={handleEditSuccess}
        topGraphs={topGraphs}
        subGraphs={subGraphs}
        handleSubGraphListUpdate={handleSubGraphListUpdate}
        modelToEdit={model}
      />
      <CardHeader
        className={classes.text}
        title={model.name}
        titleTypographyProps={{ noWrap: true, style: { maxWidth: MAX_TITLE_WIDTH } }}
        subheader={model.description}
        subheaderTypographyProps={{ noWrap: true, style: { maxWidth: MAX_TITLE_WIDTH } }}
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
          >
            {`${translate('common.version')}:`}
          </Typography>
          <Typography color="textSecondary" className={classes.text}>
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
          >
            {`${translate('forms.top')}:`}
          </Typography>
          <Typography component="p" className={classes.text}>
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
          >
            {`${translate('forms.sub')}:`}
          </Typography>
          <ChipList values={model.subGraphs.map(subGraph => subGraph.name)} light />
        </Grid>
      </CardContent>
    </Grid>
  </Box>);
};