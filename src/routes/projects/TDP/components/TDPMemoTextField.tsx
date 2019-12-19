import { TextField } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import { useSnackbar } from 'notistack';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { Row } from 'react-table';
import { PERMISSIONS } from '../../../../constants';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../../hooks/keycloak/KeycloakContext';
import { SnackbarError, VoiceData } from '../../../../types';
import log from '../../../../util/log/logger';

const useStyles = makeStyles((theme) =>
  createStyles({
    hidden: {
      visibility: 'hidden',
    },
  }),
);

interface TDPMemoTextFieldProps {
  row: Row<VoiceData>;
  projectId: string;
  onSuccess: (updatedVoiceData: VoiceData, dataIndex: number) => void;
}

export function TDPMemoTextField(props: TDPMemoTextFieldProps) {
  const { row, projectId, onSuccess } = props;
  const api = React.useContext(ApiContext);
  const { hasPermission } = React.useContext(KeycloakContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();

  const voiceData = row.original;

  const index = row.index;
  const key = `${index}-memo`;


  const rawMemo = voiceData.memo || '';

  const [memo, setMemo] = React.useState<string>(rawMemo);
  const [loading, setLoading] = React.useState(false);

  const classes = useStyles();
  const theme = useTheme();

  const canModify = React.useMemo(() => hasPermission(PERMISSIONS.crud), []);

  const updateMemo = async () => {
    if (api?.voiceData && canModify && !loading) {
      setLoading(true);
      const response = await api.voiceData.updateMemo(projectId, voiceData.id, memo);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        setLoading(false);
        // to build the updated voice data
        const updatedVoiceData = { ...voiceData, memo };
        onSuccess(updatedVoiceData, index);
      } else {
        log({
          file: `TDPMemoTextField.tsx`,
          caller: `updateMemo - failed to update memo`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
        snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
        setLoading(false);
      }
    }
  };

  const handleChange = (event: React.ChangeEvent<{ value: unknown; }>) => {
    const value = event.target.value as string;
    setMemo(value);
  };


  const disabled = !canModify && !memo?.length;


  return (
    <Grid
      key={key}
      container
      wrap='nowrap'
      direction='row'
      alignContent='center'
      alignItems='flex-end'
      justify='flex-start'
    >
      <TextField
        id={key}
        label={translate('TDP.memo')}
        fullWidth
        disabled={disabled}
        InputProps={{
          readOnly: !canModify,
        }}
        value={memo}
        onChange={handleChange}
      />
      <IconButton
        className={memo !== rawMemo ? undefined : classes.hidden}
        disabled={loading}
        color='primary'
        size='small'
        aria-label="submit"
        onClick={updateMemo}
      >
        {loading ? <MoonLoader
          sizeUnit={"px"}
          size={15}
          color={theme.palette.primary.main}
          loading={true}
        /> : <CheckIcon />}
      </IconButton>
    </Grid>
  );
}