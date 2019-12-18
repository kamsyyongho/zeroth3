import { Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useSnackbar } from 'notistack';
import React from 'react';
import { BulletList } from 'react-content-loader';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { DataSet, SnackbarError, Transcriber, TranscriberStats } from '../../../../types';
import log from '../../../../util/log/logger';
import { isEqualSet } from '../../../../util/misc';
import { SearchBar } from '../../../shared/SearchBar';
import { TranscribersList } from './TranscribersList';


const useStyles = makeStyles((theme) =>
  createStyles({
    card: {
      minWidth: 450,
    },
    cardContent: {
      padding: 0,
    },
  }),
);

interface AddTranscriberDialogProps {
  open: boolean;
  onClose: () => void;
  transcribers: TranscriberStats[];
  transcribersLoading: boolean;
  projectId: string;
  dataSet?: DataSet;
}

export function AddTranscriberDialog(props: AddTranscriberDialogProps) {
  const { open, onClose, transcribers = [], transcribersLoading, projectId, dataSet } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [filteredTranscribers, setfilteredTranscribers] = React.useState<TranscriberStats[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searching, setSearching] = React.useState(false);

  /**
   * initial values from the incoming data
   */
  const initialSelectedTranscriberIds = React.useMemo(() => {
    const incomingSelectedTranscribers: Transcriber[] = dataSet?.transcribers || [];
    return incomingSelectedTranscribers.map(transcriber => transcriber.id);
  }, [dataSet]);

  const [selectedTranscriberIds, setSelectedTranscriberIds] = React.useState<string[]>(initialSelectedTranscriberIds || []);

  /**
   * used to re-render the page whenever our we open with different data
   */
  React.useEffect(() => setSelectedTranscriberIds(initialSelectedTranscriberIds), [initialSelectedTranscriberIds]);

  /**
   * used to compare if there have been any changes to the incoming values
   */
  const initialSelectedTranscriberIdsSet = React.useMemo(() => new Set<string>(initialSelectedTranscriberIds), [initialSelectedTranscriberIds]);
  /**
   * used to keep track of selected IDs
   * - we will also update an array so the component gets re-rendered on change
   */
  const selectedTranscriberIdsSet = React.useMemo(() => new Set<string>(initialSelectedTranscriberIdsSet), [initialSelectedTranscriberIdsSet]);

  const noChangesFromInitial = isEqualSet(initialSelectedTranscriberIdsSet, selectedTranscriberIdsSet);


  const classes = useStyles();
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));


  const handleClose = () => {
    selectedTranscriberIdsSet.clear();
    setfilteredTranscribers([]);
    setSearching(false);
    onClose();
  };

  /**
   * - Updates the Set for keeping track of items
   * - Updates the the array to force re-rendering
   * @param transcriberId 
   */
  const handleTranscriberClick = (transcriberId: string) => {
    if (selectedTranscriberIdsSet.has(transcriberId)) {
      selectedTranscriberIdsSet.delete(transcriberId);
    } else {
      selectedTranscriberIdsSet.add(transcriberId);
    }
    setSelectedTranscriberIds(Array.from(selectedTranscriberIdsSet));
  };

  const handleTranscriberSearch = (filteredTranscribers: TranscriberStats[], searching: boolean) => {
    setSearching(searching);
    setfilteredTranscribers(filteredTranscribers);
  };


  const handleSubmit = async () => {
    if (api?.dataSet && !loading && dataSet && selectedTranscriberIds.length) {
      setLoading(true);
      const response = await api.dataSet.assignTranscribersToDataSet(projectId, dataSet.id, selectedTranscriberIds);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        handleClose();
      } else {
        log({
          file: `AddTranscriberDialog.tsx`,
          caller: `handleSubmit - failed to assign transcribers to SET`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setLoading(false);
    }
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      disableBackdropClick={transcribersLoading}
      disableEscapeKeyDown={transcribersLoading}
      open={open}
      onClose={handleClose}
      aria-labelledby="transcribers-dialog"
    >
      <DialogTitle>{translate("transcribers.header")}</DialogTitle>
      <DialogContent>
        <Card elevation={0} className={classes.card}>
          <CardHeader
            style={{ padding: 0, margin: 0 }}
            title={transcribers.length > 1 && !transcribersLoading && <SearchBar
              list={transcribers}
              keys={['email']}
              onSearch={handleTranscriberSearch}
            />}
          />
          <CardContent className={classes.cardContent} >
            {transcribersLoading ? <BulletList /> :
              <TranscribersList
                transcribers={searching ? filteredTranscribers : transcribers}
                searching={searching}
                selectedTranscriberIds={selectedTranscriberIds}
                onItemClick={handleTranscriberClick}
              />
            }
          </CardContent>
        </Card>
      </DialogContent>
      <DialogActions>
        <Typography>{translate('SET.transcribersToAssign', { count: selectedTranscriberIds.length })}</Typography>
        <Button
          disabled={loading}
          onClick={handleClose}
          color="primary"
        >
          {translate('common.cancel')}
        </Button>
        <Button
          disabled={noChangesFromInitial || loading || !selectedTranscriberIds.length}
          onClick={handleSubmit}
          color="primary"
          variant='outlined'
        >
          {translate('forms.assign')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}