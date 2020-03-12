import { Grid, TableCell, Typography } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import TableRow from '@material-ui/core/TableRow';
import AddIcon from '@material-ui/icons/Add';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import EditIcon from '@material-ui/icons/Edit';
import React from 'reactn';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../../theme';
import { DataSet } from '../../../../types';
import { ProgressBar } from '../../../shared/ProgressBar';

interface SetItemProps {
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
  const { dataSet, dataSetIndex, openTranscriberDialog } = props;
  const { transcribers, total, processed, name } = dataSet;
  const numberOfTranscribers = transcribers.length;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);

  const classes = useStyles();
  const theme: CustomTheme = useTheme();

  const onClick = () => openTranscriberDialog(dataSet, dataSetIndex);


  const getDownloadLink = async () => {
    if (api?.dataSet) {
      setSubGraphsLoading(true);
      setSubGraphs([]);
      const response = await api.models.getDownloadLink();
      if (response.kind === 'ok') {
        setSubGraphs(response.subGraphs);
      } else {
        log({
          file: `SetItem.tsx`,
          caller: `getDownloadLink - failed to get download link`,
          value: response,
          important: true,
        });
      }
      setSubGraphsLoading(false);
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
        <IconButton color='primary' >
          <CloudDownloadIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
