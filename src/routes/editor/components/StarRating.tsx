import { Grid } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import Rating from '@material-ui/lab/Rating';
import clsx from 'clsx';
import { useSnackbar } from 'notistack';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import { PERMISSIONS } from '../../../constants';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../hooks/keycloak/KeycloakContext';
import { CONTENT_STATUS, SnackbarError, SNACKBAR_VARIANTS, VoiceData } from '../../../types';
import log from '../../../util/log/logger';

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      marginTop: theme.spacing(3),
    },
    hidden: {
      visibility: 'hidden',
    },
  }),
);
interface StarRatingProps {
  projectId: string;
  voiceData: VoiceData;
}

export const StarRating = (props: StarRatingProps) => {
  const { projectId, voiceData } = props;
  const { translate } = React.useContext(I18nContext);
  const { hasPermission, roles } = React.useContext(KeycloakContext);
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();

  const [rating, setRating] = React.useState<number | null>(voiceData.transcriptionRating || null);
  const [loading, setLoading] = React.useState(false);
  const [currentVoiceData, setCurrentVoiceData] = React.useState(voiceData);

  const ratingChanged = rating !== currentVoiceData.transcriptionRating && typeof rating === 'number';

  // prevent clearing out rating if it had an original value
  React.useEffect(() => {
    if (currentVoiceData.transcriptionRating && typeof rating !== 'number') {
      setRating(currentVoiceData.transcriptionRating);
    }
  }, [rating]);

  const theme = useTheme();
  const classes = useStyles();

  const canRate = React.useMemo(() => hasPermission(roles, PERMISSIONS.crud), [roles]);
  const confirmedVoiceData = React.useMemo(() => voiceData.status === CONTENT_STATUS.CONFIRMED, [voiceData.id]);

  const onSuccess = () => {
    const updatedVoiceData = { ...voiceData, transcriptionRating: rating };
    setCurrentVoiceData(updatedVoiceData);
  };

  const clearRating = () => setRating(currentVoiceData.transcriptionRating);

  const handleChange = (event: React.ChangeEvent<{}>, value: number | null) => setRating(value);

  const updateRating = async () => {
    if (api?.voiceData && ratingChanged && !loading && typeof rating === 'number' && confirmedVoiceData) {
      setLoading(true);
      const response = await api.voiceData.rateTranscript(projectId, voiceData.id, rating);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
        setLoading(false);
        onSuccess();
      } else {
        log({
          file: `StarRating.tsx`,
          caller: `updateRating - failed to update rating`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
          if (typeof serverError === 'string') {
            snackbarError.errorText = serverError;
          }
        }
        snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
        setLoading(false);
      }
    }
  };


  return (
    <Grid
      container
      wrap='nowrap'
      direction='row'
      alignContent='center'
      alignItems='center'
      justify='flex-start'
      className={clsx(classes.container, !confirmedVoiceData && classes.hidden)}
    >
      <Rating
        readOnly={!canRate}
        value={rating}
        max={5}
        onChange={handleChange}
      />
      <div className={!ratingChanged ? classes.hidden : undefined}>
        <IconButton
          disabled={loading}
          color='primary'
          size='small'
          aria-label="submit"
          onClick={updateRating}
        >
          {loading ? <MoonLoader
            sizeUnit={"px"}
            size={15}
            color={theme.palette.primary.main}
            loading={true}
          /> : <CheckIcon />}
        </IconButton>
        <IconButton
          disabled={loading}
          color='secondary'
          size='small'
          aria-label="clear"
          onClick={clearRating}
        >
          <ClearIcon />
        </IconButton>
      </div>
    </Grid>
  );
};