import { Button, Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import DeleteIcon from '@material-ui/icons/Delete';
import HistoryIcon from '@material-ui/icons/History';
import { Row } from 'react-table';
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../../theme';
import { CONTENT_STATUS, VoiceData } from '../../../../types';
import { TDPMemoTextField } from './TDPMemoTextField';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    row: {
      borderWidth: 0,
      borderRightWidth: 2,
      borderLeftWidth: 5,
      borderColor: theme.table.border,
      border: 'solid',
      borderCollapse: undefined,
      width: '100%',
    },
    cell: {
      backgroundColor: theme.palette.background.default,
      borderColor: theme.table.border,
      borderRightWidth: 2,
    },
    category: {
      marginRight: theme.spacing(1),
    },
    memo: {
      paddingTop: '0 !important',
    },
    italic: {
      fontStyle: 'italic',
    },
  }),
);

interface TDPRowDetailsProps {
  row: Row<VoiceData>;
  detailsRowColSpan: number;
  projectId: string;
  onDelete: (voiceDataId: string, dataIndex: number) => void;
  onSuccess: (updatedVoiceData: VoiceData, dataIndex: number) => void;
  handleStatusChangesModalOpen: (dataIndex: number) => void;
}

export function TDPRowDetails(props: TDPRowDetailsProps) {
  const classes = useStyles();
  const { translate, formatDate } = React.useContext(I18nContext);
  const {
    row,
    detailsRowColSpan,
    projectId,
    onDelete,
    onSuccess,
    handleStatusChangesModalOpen,
  } = props;
  const {
    decodedAt,
    fetchedAt,
    confirmedAt,
    memo,
    originalFilename,
    modelConfigId,
    sessionId,
    ip,
    transcriber,
    wordCount,
    stateChanges,
  } = row.original;

  const startDate = new Date(decodedAt);
  // const endDate = new Date(endAt);
  const fetchedDate = fetchedAt ? new Date(fetchedAt) : null;
  const confirmedDate = confirmedAt ? new Date(confirmedAt) : null;
  const confirmed = row.values.status === CONTENT_STATUS.CONFIRMED;

  const handleDeleteClick = () => {
    const rowIndex = row.index;
    const voiceDataId = row.original.id;
    onDelete(voiceDataId, rowIndex);
  };

  return (<TableRow
    className={classes.row}
  >
    <TableCell
      colSpan={detailsRowColSpan}
      className={classes.cell}
    >
      <Grid container spacing={3}>
        <Grid
          container
          item
          xs={7}
          wrap='nowrap'
          direction='column'
          alignContent='center'
          alignItems='flex-start'
          justify='flex-start'
        >
          <Grid
              container
              item
              wrap='nowrap'
              direction='row'
              alignContent='center'
              alignItems='center'
              justify='flex-start'
          >
            <Typography
                className={classes.category}
                variant='subtitle2'
            >
              {`${translate('TDP.sessionId')}:`}
            </Typography>
            <Typography>{sessionId ? sessionId : '-'}</Typography>
          </Grid>
          <Grid
            container
            item
            wrap='nowrap'
            direction='row'
            alignContent='center'
            alignItems='center'
            justify='flex-start'
          >
            <Typography
              className={classes.category}
              variant='subtitle2'
            >
              {`${translate('common.startAt')}:`}
            </Typography>
            <Typography>{startDate ? formatDate(startDate) : '-'}</Typography>
          </Grid>
          <Grid
            container
            item
            wrap='nowrap'
            direction='row'
            alignContent='center'
            alignItems='center'
            justify='flex-start'
          >
            <Typography
              className={classes.category}
              variant='subtitle2'
            >
              {`${translate('common.fetchedAt')}:`}
            </Typography>
            <Typography>{fetchedDate ? formatDate(fetchedDate) : '-'}</Typography>
          </Grid>
          <Grid
            container
            item
            wrap='nowrap'
            direction='row'
            alignContent='center'
            alignItems='center'
            justify='flex-start'
          >
            <Typography
              className={classes.category}
              variant='subtitle2'
            >
              {`${translate('common.confirmedAt')}:`}
            </Typography>
            <Typography>{confirmedDate ? formatDate(confirmedDate) : '-'}</Typography>
          </Grid>
        </Grid>
        <Grid
          container
          item
          xs={5}
          wrap='nowrap'
          direction='column'
          alignContent='center'
          alignItems='flex-start'
          justify='flex-start'
        >
          <Grid
            container
            item
            wrap='nowrap'
            direction='row'
            alignContent='center'
            alignItems='center'
            justify='flex-start'
          >
            <Typography
              className={classes.category}
              variant='subtitle2'
            >
              {`${translate('TDP.wordCount')}:`}
            </Typography>
            <Typography>{wordCount}</Typography>
          </Grid>
          {/*<Grid*/}
          {/*  container*/}
          {/*  item*/}
          {/*  wrap='nowrap'*/}
          {/*  direction='row'*/}
          {/*  alignContent='center'*/}
          {/*  alignItems='center'*/}
          {/*  justify='flex-start'*/}
          {/*>*/}
          {/*  <Typography*/}
          {/*    className={classes.category}*/}
          {/*    variant='subtitle2'*/}
          {/*  >*/}
          {/*    {`${translate('TDP.websocketCloseReason')}:`}*/}
          {/*  </Typography>*/}
          {/*  <Typography>{webSocketCloseReason}</Typography>*/}
          {/*</Grid>*/}
          {/*<Grid*/}
          {/*  container*/}
          {/*  item*/}
          {/*  wrap='nowrap'*/}
          {/*  direction='row'*/}
          {/*  alignContent='center'*/}
          {/*  alignItems='center'*/}
          {/*  justify='flex-start'*/}
          {/*>*/}
          {/*  <Typography*/}
          {/*    className={classes.category}*/}
          {/*    variant='subtitle2'*/}
          {/*  >*/}
          {/*    {`${translate('TDP.transferredBytes')}:`}*/}
          {/*  </Typography>*/}
          {/*  <Typography>{transferredBytes}</Typography>*/}
          {/*</Grid>*/}

          <Grid
            container
            item
            wrap='nowrap'
            direction='row'
            alignContent='center'
            alignItems='center'
            justify='flex-start'
          >
            <Typography
              className={classes.category}
              variant='subtitle2'
            >
              {`${translate('forms.transcriber')}:`}
            </Typography>
            <Typography className={!transcriber ? classes.italic : undefined}>{transcriber || translate('forms.none')}</Typography>
          </Grid>
          <Grid
              container
              item
              wrap='nowrap'
              direction='row'
              alignContent='center'
              alignItems='center'
              justify='flex-start'
              style={{ paddingTop: '5px' }}
          >
            <Grid item>
              <Button
                  color='secondary'
                  variant='contained'
                  size='small'
                  onClick={() => handleStatusChangesModalOpen(row.index)}
                  startIcon={<HistoryIcon />}
              >
                {translate('TDP.statusChange')}
              </Button>
            </Grid>
            <Grid item style={{ marginLeft: '15px' }}>
              {!confirmed && <Button
                  color='secondary'
                  variant='contained'
                  size='small'
                  onClick={handleDeleteClick}
                  startIcon={<DeleteIcon />}
              >
                {translate('common.delete')}
              </Button>}
            </Grid>
          </Grid>

        </Grid>
        <Grid
          item
          xs={12}
          className={classes.memo}
        >
          <TDPMemoTextField row={row} projectId={projectId} onSuccess={onSuccess} />
        </Grid>
      </Grid>
    </TableCell>
  </TableRow>);
}