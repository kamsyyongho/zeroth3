import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import { useSnackbar } from 'notistack';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { CellProps } from 'react-table';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { CONTENT_STATUS, Transcriber, VoiceData } from '../../../types';
import { SnackbarError } from '../../../types/snackbar.types';
import log from '../../../util/log/logger';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      minWidth: 130,
      maxWidth: 300,
    },
    hidden: {
      visibility: 'hidden',
    },
  }),
);

interface TDPCellTranscriberSelectProps {
  cellData: CellProps<VoiceData>;
  projectId: number;
  transcribers: Transcriber[];
  onSuccess: (updatedVoiceData: VoiceData, dataIndex: number) => void;
}

export function TDPCellTranscriberSelect(props: TDPCellTranscriberSelectProps) {
  const { cellData, projectId, transcribers, onSuccess } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();

  const voiceData = cellData.cell.row.original;

  const index = cellData.cell.row.index;
  const key = `${index}-transcriber`;

  const [transcriberId, setTranscriberId] = React.useState<number | ''>('');
  const [loading, setLoading] = React.useState(false);

  const classes = useStyles();
  const theme = useTheme();

  // we can only assign when the status is `UNCONFIRMED_LC`
  const canAssign = voiceData.status === CONTENT_STATUS.UNCONFIRMED_LC;

  if (!canAssign) {
    return null;
  }

  const assignTranscriber = async () => {
    if (api && api.voiceData && canAssign && !loading && typeof transcriberId === 'number') {
      setLoading(true);
      const response = await api.voiceData.assignUnconfirmedDataToTranscriber(projectId, transcriberId, voiceData.modelConfigId, [voiceData.id]);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        setLoading(false);
        // to build the updated voice data
        let selectedTranscriberEmail = '';
        for (let i = 0; i < transcribers.length; i++) {
          if (transcribers[i].id === transcriberId) {
            selectedTranscriberEmail = transcribers[i].email;
            break;
          }
        }
        // update the transcriber and status
        const updatedVoiceData = { ...voiceData, transcriber: selectedTranscriberEmail, status: CONTENT_STATUS.FETCHED };
        onSuccess(updatedVoiceData, index);
      } else {
        log({
          file: `TDPCellTranscriberSelect.tsx`,
          caller: `assignTranscriber - failed to update transcriber`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
        snackbarError && snackbarError.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
        setLoading(false);
      }
    }
  };

  const handleChange = (event: React.ChangeEvent<{ value: unknown; }>) => {
    const value = event.target.value as number;
    setTranscriberId(value);
  };

  const renderMenuItems = () => {
    const menuItems = transcribers.map((transcriber, index) => {
      return (
        <MenuItem key={index} value={transcriber.id}>
          <ListItemText primary={transcriber.email} />
        </MenuItem>
      );
    });
    // to allow us to unselect transcribers
    menuItems.unshift(<MenuItem key={-1} value=''>
      <em>{translate('forms.none')}</em>
    </MenuItem>);
    return menuItems;
  };


  return (
    <Grid
      key={key}
      container
      wrap='nowrap'
      direction='row'
      alignContent='center'
      alignItems='center'
      justify='flex-start'
    >
      <FormControl className={classes.formControl} >
        <InputLabel id="transcriber-select-label">{translate('forms.assign')}</InputLabel>
        <Select
          value={transcriberId}
          onChange={handleChange}
        >
          {renderMenuItems()}
        </Select>
      </FormControl>
      <IconButton
        className={typeof transcriberId !== 'number' ? classes.hidden : undefined}
        disabled={loading}
        color='primary'
        size='small'
        aria-label="submit"
        onClick={assignTranscriber}
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