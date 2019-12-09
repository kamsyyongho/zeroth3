import { Grid } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { useTheme } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import Rating from 'material-ui-rating';
import { useSnackbar } from 'notistack';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { PERMISSIONS } from '../../../constants';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../hooks/keycloak/KeycloakContext';
import { NavigationPropsContext } from '../../../hooks/navigation-props/NavigationPropsContext';
import { SnackbarError, VoiceData } from '../../../types';
import log from '../../../util/log/logger';


interface StarRatingProps {
  projectId: string;
  voiceData: VoiceData;
}

export const StarRating = (props: StarRatingProps) => {
  const { projectId, voiceData } = props;
  const { translate } = React.useContext(I18nContext);
  const { setProps } = React.useContext(NavigationPropsContext);
  const { hasPermission } = React.useContext(KeycloakContext);
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();

  const [rating, setRating] = React.useState<number | null | undefined>(voiceData.transcriptionRating);
  const [loading, setLoading] = React.useState(false);

  const ratingChanged = rating !== voiceData.transcriptionRating;

  const theme = useTheme();

  const canRate = React.useMemo(() => hasPermission(PERMISSIONS.crud), []);

  const onSuccess = () => {
    const updatedVoiceData = { ...voiceData, transcriptionRating: rating };
    setProps({ voiceData: updatedVoiceData }, true);
  };

  const clearRating = () => setRating(voiceData.transcriptionRating);


  const updateRating = async () => {
    if (api?.voiceData && ratingChanged && !loading && typeof rating === 'number') {
      setLoading(true);
      const response = await api.voiceData.rateTranscript(projectId, voiceData.id, rating);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
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
        snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
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
    >
      <Rating
        readOnly={!canRate}
        value={rating || undefined}
        max={5}
        onChange={(value: number) => setRating(value)}
      />
      {ratingChanged && <>
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
      </>}
    </Grid>
  );
};