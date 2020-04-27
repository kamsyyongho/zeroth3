import {Button, Grid, TableCell, Typography} from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import TableRow from '@material-ui/core/TableRow';
import AddIcon from '@material-ui/icons/Add';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import EditIcon from '@material-ui/icons/Edit';
import { useSnackbar } from 'notistack';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { ServerError } from '../../../../services/api/types/api-problem.types';
import { CustomTheme } from '../../../../theme';
import {DataSet, VoiceData} from '../../../../types';
import { SNACKBAR_VARIANTS } from '../../../../types/snackbar.types';
import log from '../../../../util/log/logger';
import { ProgressBar } from '../../../shared/ProgressBar';
import {SetDetail} from "./SetDetail";
import BorderColorIcon from "@material-ui/icons/BorderColor";

interface SetItemProps {
  projectId: string;
  dataSet: DataSet;
  dataSetIndex: number;
  openTranscriberDialog: (dataSetToEdit: DataSet, dataSetIndex: number) => void;
}

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    processedText: {
      color: theme.palette.primary.main,
    },
    tableRow: {
      borderWidth: 1,
      borderColor: theme.table.border,
      border: 'solid',
      borderCollapse: undefined,
    }
  }));

export function SetItem(props: SetItemProps) {
  const { projectId, dataSet, dataSetIndex, openTranscriberDialog } = props;
  const { transcribers, total, processed, name } = dataSet;
  const numberOfTranscribers = transcribers.length;
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const [downloadLinkPending, setDownloadLinkPending] = React.useState(false);
  const [downloadLink, setDownloadLink] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);
  const [isCreateTrainingSetLoading, setIsCreateTrainingSetLoading] = React.useState(false);
  const [setDetailLoading, setSetDetailLoading] = React.useState(false);
  const [subSets, setSubSets] = React.useState<VoiceData[]>([]);

  const classes = useStyles();
  const theme: CustomTheme = useTheme();

  const onClick = () => openTranscriberDialog(dataSet, dataSetIndex);

  const startDownload = (url: string) => window.open(url);

  const createTrainingSet = async () => {
    setIsCreateTrainingSetLoading(true);
    if(api?.dataSet) {
      let serverError: ServerError | undefined;
      const response = await api.dataSet.createTrainingSet(projectId, dataSet.id);

      if(response.kind === 'ok') {
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
      } else {
        log({
          file: 'SetItem.tsx',
          caller: 'createTrainingSet - failed to send post request',
          value: response,
          important: true,
        });
        serverError = response.serverError;
        let errorMessageText = translate('common.error');
        if(serverError?.message) {
          errorMessageText = serverError.message;
        }
        enqueueSnackbar(errorMessageText, { variant: SNACKBAR_VARIANTS.error })
      }
    }
    setIsCreateTrainingSetLoading(false);

  };

  const handleEvaluateClick = () => {

  };

  const getDownloadLink = async () => {
    if (downloadLink) {
      startDownload(downloadLink);
      return;
    }
    if (api?.dataSet && !downloadLinkPending) {
      setDownloadLinkPending(true);
      setDownloadLink('');
      let serverError: ServerError | undefined;
      const response = await api.dataSet.getDownloadLink(projectId, dataSet.id);
      if (response.kind === 'ok') {
        startDownload(response.url);
      } else {
        log({
          file: `SetItem.tsx`,
          caller: `getDownloadLink - failed to get download link`,
          value: response,
          important: true,
        });
        serverError = response.serverError;
        let errorMessageText = translate('common.error');
        if (serverError?.message) {
          errorMessageText = serverError.message;
        }
        enqueueSnackbar(errorMessageText, { variant: SNACKBAR_VARIANTS.error });
      }
      setDownloadLinkPending(false);
    }
  };

  const openSetDetail = async () => {
    if(subSets.length) {
      setExpanded(!expanded);
      return;
    }

    if(api?.dataSet) {
      const response = await api.dataSet?.getTrainingSet(projectId, dataSet.id);
      if(response.kind === "ok") {
        const subSets = response.subSets.content;
        setExpanded(!expanded);
        setSubSets(subSets);
      }
    }


  };

  // must be a number from 0 to 100
  const progress = processed / total * 100;

  let processedText = (
    <Typography className={classes.processedText} >
      {processed}
      <Typography component='span' color='textPrimary' >
        {` / ${total}`}
      </Typography>
    </Typography>
  );

  if (!total || isNaN(progress)) {
    processedText = (<Typography color='textSecondary' >
      {translate('common.noData')}
    </Typography>);
  }

  const renderTranscriberEdit = () => {
    const transcriberText = numberOfTranscribers ?
      (translate('SET.numberTranscribers', { count: numberOfTranscribers })) :
      (translate('SET.addTranscriber'));
    return (
      <Grid
        container
        wrap='nowrap'
        direction='row'
        alignContent='center'
        alignItems='center'
        justify='flex-start'
        spacing={1}
      >
        <Typography color={numberOfTranscribers ? 'textPrimary' : 'textSecondary'}>
          {transcriberText}
        </Typography>
        <IconButton
          color='primary'
          size='small'
          edge='end'
          aria-label="submit"
          onClick={onClick}
        >
          {numberOfTranscribers ? <EditIcon /> : <AddIcon />}
        </IconButton>
      </Grid>
    );
  };

  return (
      <React.Fragment>
        <TableRow
            className={classes.tableRow}
        >
          <TableCell>
            <Typography>{name}</Typography>
          </TableCell>
          <TableCell>
            {processedText}
            <ProgressBar value={progress} maxWidth={200} />
          </TableCell>
          <TableCell>
            {renderTranscriberEdit()}
          </TableCell>
          <TableCell>
            <IconButton
                color='primary'
                onClick={getDownloadLink}
            >
              {downloadLinkPending ? <MoonLoader
                  sizeUnit={"px"}
                  size={15}
                  color={theme.palette.primary.main}
                  loading={true}
              /> : <CloudDownloadIcon />}
            </IconButton>
            <IconButton
                color='primary'
                onClick={createTrainingSet}
            >
              {isCreateTrainingSetLoading ? <MoonLoader
                  sizeUnit={"px"}
                  size={15}
                  color={theme.palette.primary.main}
                  loading={true}
              /> : <AddCircleIcon />}
            </IconButton>
            <IconButton
                color='primary'
                size='medium'
                aria-label="open"
                onClick={openSetDetail}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Button
                color='secondary'
                variant='contained'
                size='small'
                onClick={handleEvaluateClick}
                startIcon={<BorderColorIcon />}
            >
              {translate('SET.requestEvaluation')}
            </Button>
          </TableCell>
        </TableRow>
        {expanded &&
        subSets.map((voiceData: VoiceData) =>
            <SetDetail key={`setDetail-${voiceData.id}`}
                       row={voiceData}
                       setDetailLoading={setDetailLoading}
                       projectId={projectId} />
          )
        }
      </React.Fragment>
  );
}
