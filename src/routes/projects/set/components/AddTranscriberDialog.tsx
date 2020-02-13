import { Grid, Typography } from '@material-ui/core';
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
import SendIcon from '@material-ui/icons/Send';
import clsx from 'clsx';
import { useSnackbar } from 'notistack';
import { BulletList } from 'react-content-loader';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { removeTranscriberFromDataSetResult } from '../../../../services/api/types';
import { DataSet, SnackbarError, SNACKBAR_VARIANTS, Transcriber, TranscriberStats } from '../../../../types';
import log from '../../../../util/log/logger';
import { differencesBetweenSets, isEqualSet } from '../../../../util/misc';
import { InviteFormDialog } from '../../../IAM/components/users/InviteFormDialog';
import { SearchBar } from '../../../shared/SearchBar';
import { TranscribersList } from './TranscribersList';


const useStyles = makeStyles((theme) =>
  createStyles({
    card: {
      minWidth: 550,
    },
    cardContent: {
      padding: 0,
    },
    cardHeader: {
      padding: 0,
      margin: 0,
    },
    hidden: {
      visibility: 'hidden',
    },
  }),
);

interface AddTranscriberDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdateDataSetSuccess: (updatedDataSet: DataSet, dataSetIndex: number) => void;
  transcribers: TranscriberStats[];
  transcribersLoading: boolean;
  projectId: string;
  dataSet?: DataSet;
  dataSetIndex?: number;
}

export function AddTranscriberDialog(props: AddTranscriberDialogProps) {
  const {
    open,
    onClose,
    onUpdateDataSetSuccess,
    transcribers = [],
    transcribersLoading,
    projectId,
    dataSet,
    dataSetIndex,
  } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [filteredTranscribers, setfilteredTranscribers] = React.useState<TranscriberStats[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);

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

  const handleInviteOpen = () => {
    setInviteOpen(true);
  };
  const handleInviteClose = () => {
    setInviteOpen(false);
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


  const [isAddLoading, setIsAddLoading] = React.useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = React.useState(false);

  const addTranscribers = async (transcriberIdsToAdd: string[]) => {
    if (api?.dataSet && !isAddLoading && dataSet && dataSetIndex !== undefined && selectedTranscriberIds.length) {
      setIsAddLoading(true);
      const response = await api.dataSet.assignTranscribersToDataSet(projectId, dataSet.id, transcriberIdsToAdd);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === "ok") {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
        // build the updated data
        const updatedDateSet = { ...dataSet, transcribers: response.transcribers };
        onUpdateDataSetSuccess(updatedDateSet, dataSetIndex);
        handleClose();
      } else {
        log({
          file: `AddTranscriberDialog.tsx`,
          caller: `addTranscribers - failed to add transcribers to SET`,
          value: response,
          error: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setIsAddLoading(false);
    }
  };

  /**
   * Delete all transcribers and update the dataSet stored in the parent
   * @param transcriberIdsToDelete 
   * @param willAddTranscribers determines if we will update the parent
   * - `addTranscribers` receives a dataSet response, so that will be the most up to date
   * - so there is no need to update the parent from our build data
   */
  const deleteTranscribers = async (transcriberIdsToDelete: string[], willAddTranscribers: boolean) => {
    if (api?.dataSet && !isDeleteLoading && dataSet && dataSetIndex !== undefined) {
      setIsDeleteLoading(true);
      const deleteTranscriberPromises: Promise<removeTranscriberFromDataSetResult>[] = [];
      transcriberIdsToDelete.forEach(transcriberId => {
        if (api?.dataSet) {
          deleteTranscriberPromises.push(api.dataSet.removeTranscriberFromDataSet(projectId, dataSet.id, transcriberId));
        } else {
          return;
        }
      });
      const successfullyDeletedTranscriberIds: string[] = [];
      let transcriberIdIndexCounter = 0;

      const responseArray = await Promise.all(deleteTranscriberPromises);
      const snackbarError: SnackbarError = {} as SnackbarError;
      responseArray.forEach(response => {
        if (response.kind === "ok") {
          // to build the array of deleted user role IDs
          successfullyDeletedTranscriberIds.push(transcriberIdsToDelete[transcriberIdIndexCounter]);
        } else {
          log({
            file: `AddTranscriberDialog.tsx`,
            caller: `deleteTranscribers - failed to delete transcriber from SET`,
            value: response,
            error: true,
          });
          snackbarError.isError = true;
          const { serverError } = response;
          if (serverError) {
            snackbarError.errorText = serverError.message || "";
          }
          snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
        }
        transcriberIdIndexCounter++;
      });


      // to prevent multiple success messages when removing multiple alerts
      // also only display success if there were no errors
      if (!willAddTranscribers && !snackbarError.isError) {
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
      }

      // to build the user since it isn't returned from the server
      if (!willAddTranscribers) {
        const updatedDataSet = { ...dataSet };
        updatedDataSet.transcribers = updatedDataSet.transcribers.filter(transcriber => !successfullyDeletedTranscriberIds.includes(transcriber.id));
        // to update the dataSet in the parent
        onUpdateDataSetSuccess(updatedDataSet, dataSetIndex);
        handleClose();
      }

      setIsDeleteLoading(false);
    }
  };

  const submitTranscribersChange = async () => {
    if (!selectedTranscriberIds) return;
    const { extra, missing } = differencesBetweenSets(initialSelectedTranscriberIdsSet, selectedTranscriberIdsSet);
    const transcribersIdsToAdd = Array.from(missing);
    const transcriberIdsToDelete = Array.from(extra);
    if (transcriberIdsToDelete.length) await deleteTranscribers(transcriberIdsToDelete, !!transcribersIdsToAdd.length);
    // delete transcribers before we add anthing
    // so we can receive the most up-to-date user as a response from addTranscribers
    if (transcribersIdsToAdd.length) addTranscribers(transcribersIdsToAdd);
  };


  return (<>
    <Dialog
      fullScreen={fullScreen}
      disableBackdropClick={transcribersLoading}
      disableEscapeKeyDown={transcribersLoading}
      open={open}
      onClose={handleClose}
      aria-labelledby="transcribers-dialog"
      classes={{
        container: clsx(inviteOpen && classes.hidden)
      }}
    >
      <DialogTitle>
        <Grid container direction='row' justify='space-between' wrap='nowrap' >
          <Typography variant='h5' >
            {translate("transcribers.header")}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleInviteOpen}
            startIcon={<SendIcon />}
          >{translate("IAM.invite")}
          </Button>
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Card elevation={0} className={classes.card}>
          <CardHeader
            className={classes.cardHeader}
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
          disabled={isAddLoading || isDeleteLoading}
          onClick={handleClose}
          color="primary"
        >
          {translate('common.cancel')}
        </Button>
        <Button
          disabled={noChangesFromInitial || isAddLoading || isDeleteLoading}
          onClick={submitTranscribersChange}
          color="primary"
          variant='outlined'
          startIcon={(isAddLoading || isDeleteLoading) &&
            <MoonLoader
              sizeUnit={"px"}
              size={15}
              color={theme.palette.common.white}
              loading={true}
            />}
        >
          {translate('forms.assign')}
        </Button>
      </DialogActions>
    </Dialog>
    <InviteFormDialog open={inviteOpen} onClose={handleInviteClose} hideBackdrop />
  </>
  );
}