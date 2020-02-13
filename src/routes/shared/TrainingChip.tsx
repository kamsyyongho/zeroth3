import Chip from '@material-ui/core/Chip';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'reactn';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../theme/index';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    trainingAlertChip: {
      backgroundColor: theme.error,
      color: theme.palette.primary.contrastText,
      fontWeight: 'bold',
    },
  }),
);

interface TrainingChipProps {
  progress: number;
}

export const TrainingChip = (props: TrainingChipProps) => {
  const { progress } = props;
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();
  if (progress < 100) {
    return (
      <Chip
        label={translate('models.trainingInProgress')}
        size='small'
        className={classes.trainingAlertChip}
      />
    );
  }
  return null;
};
