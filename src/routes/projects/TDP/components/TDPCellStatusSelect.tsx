import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import { useSnackbar } from 'notistack';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { CellProps } from 'react-table';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { CONTENT_STATUS, CONTENT_STATUS_VALUES, SnackbarError, SNACKBAR_VARIANTS, VoiceData } from '../../../../types';
import log from '../../../../util/log/logger';

const useStyles = makeStyles((theme) =>
  createStyles({
    formControl: {
      minWidth: 80,
      maxWidth: 300,
    },
    hidden: {
      visibility: 'hidden',
    },
  }),
);

interface TDPCellStatusSelectProps {
  cellData: CellProps<VoiceData>;
  projectId: string;
  onSuccess: (updatedVoiceData: VoiceData, dataIndex: number) => void;
}

export function TDPCellStatusSelect(props: TDPCellStatusSelectProps) {
  const { cellData, projectId, onSuccess } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();

  const initialStatus: VoiceData['status'] = cellData.cell.value;
  const voiceData = cellData.cell.row.original;

  const index = cellData.cell.row.index;
  const key = `${index}-status`;

  const [status, setStatus] = React.useState<CONTENT_STATUS>(initialStatus);
  const [loading, setLoading] = React.useState(false);

  const classes = useStyles();
  const theme = useTheme();

  // we cannot update the status to `FETCHED`
  const statusChanged = status !== initialStatus && status !== CONTENT_STATUS.FETCHED;

  const updateStatus = async () => {
    if (api?.voiceData && statusChanged && !loading && status !== CONTENT_STATUS.FETCHED) {
      setLoading(true);
      const response = await api.voiceData.updateStatus(projectId, voiceData.id, status);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
        setLoading(false);
        onSuccess(response.data, index);
      } else {
        log({
          file: `TDPCellStatusSelect.tsx`,
          caller: `updateStatus - failed to update status`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
        snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
        setLoading(false);
      }
    }
  };

  const handleChange = (event: React.ChangeEvent<{ value: unknown; }>) => {
    const value = event.target.value as CONTENT_STATUS;
    setStatus(value);
  };

  const renderMenuItems = () => {
    return CONTENT_STATUS_VALUES.map((status, index) => {
      return (
        <MenuItem disabled={status === CONTENT_STATUS.FETCHED} key={index} value={status as CONTENT_STATUS}>
          <ListItemText primary={status} />
        </MenuItem>
      );
    });
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
        <Select
          value={status}
          onChange={handleChange}
        >
          {renderMenuItems()}
        </Select>
      </FormControl>
      <IconButton
        className={!statusChanged ? classes.hidden : undefined}
        disabled={loading}
        color='primary'
        size='small'
        aria-label="submit"
        onClick={updateStatus}
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