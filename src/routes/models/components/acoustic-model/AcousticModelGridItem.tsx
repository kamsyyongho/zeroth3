import { Box, CardHeader, Grid } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import EditIcon from '@material-ui/icons/Edit';
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../../theme';
import { AcousticModel } from '../../../../types';
import { TrainingChip } from '../../../shared/TrainingChip';
import { EditOpenByModelId } from '../language-model/LanguageModelGridList';
import { AcousticModelDialog } from './AcousticModelDialog';

const MIN_CARD_WIDTH = 300;
const MAX_CARD_WIDTH = MIN_CARD_WIDTH * 2;
const MAX_TITLE_WIDTH = MAX_CARD_WIDTH - 250;

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    root: {
      minWidth: MIN_CARD_WIDTH,
      maxWidth: MAX_CARD_WIDTH,
      margin: theme.spacing(1),
      backgroundColor: theme.palette.background.paper,
    },
    text: {
      overflowWrap: 'break-word'
    },
    category: {
      marginRight: theme.spacing(1),
    },
    trainingAlertChip: {
      backgroundColor: theme.error,
      color: theme.palette.primary.contrastText,
      fontWeight: 'bold',
    },
  }),
);

interface AcousticModelGridItemProps {
  model: AcousticModel;
  canModify: boolean;
  editOpen: EditOpenByModelId;
  handleEditOpen: (modelId: string) => void;
  handleEditClose: (modelId: string) => void;
  handleEditSuccess: (updatedModel: AcousticModel, isEdit?: boolean) => void;
}

export function AcousticModelGridItem(props: AcousticModelGridItemProps) {
  const {
    model,
    canModify,
    editOpen,
    handleEditOpen,
    handleEditClose,
    handleEditSuccess,
  } = props;
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();
  const theme: CustomTheme = useTheme();
  const isOpen = !!editOpen[model.id];


  return (<Box key={model.id} border={1} borderColor={theme.table.border} className={classes.root}>
    <Grid item xs component={Card} elevation={0} >
      <AcousticModelDialog
        open={isOpen}
        onClose={() => handleEditClose(model.id)}
        onSuccess={handleEditSuccess}
        modelToEdit={model}
      />
      <CardHeader
        className={classes.text}
        title={model.name}
        titleTypographyProps={{ noWrap: true, style: { maxWidth: MAX_TITLE_WIDTH } }}
        subheader={model.description}
        subheaderTypographyProps={{ noWrap: true, style: { maxWidth: MAX_TITLE_WIDTH } }}
        action={canModify && (<IconButton aria-label="edit" onClick={() => handleEditOpen(model.id)}>
          <EditIcon />
        </IconButton>)} />
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
            variant='subtitle2'
          >
            {`${translate('forms.sampleRate')}:`}
          </Typography>
          <Typography component="p" className={classes.text}>
            {model.sampleRate}{' Hz'}
          </Typography>
        </Grid>
        {model.progress < 100 && <Grid
          container
          wrap='nowrap'
          direction='row'
          alignContent='center'
          alignItems='center'
          justify='flex-start'
        >
          <TrainingChip progress={model.progress} />
        </Grid>}
      </CardContent>
    </Grid>
  </Box>);
};