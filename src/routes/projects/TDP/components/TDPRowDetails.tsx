import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import React from 'react';
import { Row } from 'react-table';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../../theme';
import { VoiceData } from '../../../../types';
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
  onSuccess: (updatedVoiceData: VoiceData, dataIndex: number) => void;
}

export function TDPRowDetails(props: TDPRowDetailsProps) {
  const classes = useStyles();
  const { translate, formatDate } = React.useContext(I18nContext);
  const { row, detailsRowColSpan, projectId, onSuccess } = props;
  const {
    startAt,
    endAt,
    sessionId,
    ip,
    webSocketCloseReason,
    webSocketCloseStatus,
    transcriber,
    transferedBytes,
  } = row.original;
  const startDate = new Date(startAt);
  const endDate = new Date(endAt);
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
              {`${translate('common.startAt')}:`}
            </Typography>
            <Typography>{formatDate(startDate)}</Typography>
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
              {`${translate('common.endAt')}:`}
            </Typography>
            <Typography>{formatDate(endDate)}</Typography>
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
              {`${translate('TDP.sessionId')}:`}
            </Typography>
            <Typography>{sessionId}</Typography>
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
              {`${translate('TDP.ip')}:`}
            </Typography>
            <Typography>{ip}</Typography>
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
              {`${translate('TDP.websocketCloseStatus')}:`}
            </Typography>
            <Typography>{webSocketCloseStatus}</Typography>
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
              {`${translate('TDP.websocketCloseReason')}:`}
            </Typography>
            <Typography>{webSocketCloseReason}</Typography>
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
              {`${translate('TDP.transferredBytes')}:`}
            </Typography>
            <Typography>{transferedBytes}</Typography>
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
              {`${translate('forms.transcriber')}:`}
            </Typography>
            <Typography className={!transcriber ? classes.italic : undefined}>{transcriber || translate('forms.none')}</Typography>
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