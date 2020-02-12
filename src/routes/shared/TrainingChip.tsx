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

export const TrainingChip = () => {
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();
  return (
    <Chip
      label={translate('models.trainingInProgress')}
      size='small'
      className={classes.trainingAlertChip}
    />
  );
};
