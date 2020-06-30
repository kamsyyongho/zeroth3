import {TableCell, Typography} from '@material-ui/core';
import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
import TableRow from '@material-ui/core/TableRow';
import {useSnackbar} from 'notistack';
import React from 'reactn';
import {useHistory} from 'react-router-dom';
import {ApiContext} from '../../../hooks/api/ApiContext';
import {I18nContext} from '../../../hooks/i18n/I18nContext';
import {CustomTheme} from '../../../theme';
import {CONTENT_STATUS, VoiceData} from '../../../types';
import Chip from '@material-ui/core/Chip';

interface HistoryTableItemProps {
    voiceData: VoiceData;
    voiceDataIndex: number;
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
        },
        inlineBlockProgressBar: {
            display: 'inline-block',
            borderTop: '5px',
        },
        button: {
            marginLeft: '15px',
            width: '90px',
        },
        buttonReject: {
            backgroundColor: '#c33636',
        },
        rejected: {
            backgroundColor: theme.error,
            color: theme.palette.primary.contrastText,
            fontWeight: 'bold',
        },
        progress: {
            backgroundColor: theme.editor.changes,
            color: theme.palette.primary.contrastText,
            fontWeight: 'bold',
        },
        confirmed: {
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
            fontWeight: 'bold',
        },
    }));

export function HistoryTableItem(props: HistoryTableItemProps) {
    const { voiceData, voiceDataIndex } = props;
    // const { transcribers, total, processed, name } = voiceData;
    // const numberOfTranscribers = transcribers.length;
    const history = useHistory();
    const api = React.useContext(ApiContext);
    const { enqueueSnackbar } = useSnackbar();
    const { translate, formatDate } = React.useContext(I18nContext);

    const classes = useStyles();
    const theme: CustomTheme = useTheme();

    const statusChipClass = () => {
        return voiceData.status === CONTENT_STATUS.REJECTED ?
            classes.rejected
            : voiceData.status === CONTENT_STATUS.CONFIRMED ?
                classes.confirmed
                : classes.progress;
    };

    return (
        <TableRow
            className={classes.tableRow}
        >
            <TableCell>
                <Typography>{voiceData.originalFilename}</Typography>
            </TableCell>
            <TableCell>
                <Typography>{voiceData.wordCount}</Typography>
            </TableCell>
            <TableCell>
                {voiceData.length}
            </TableCell>
            <TableCell>
                <Typography>{formatDate(new Date(voiceData.decodedAt))}</Typography>
            </TableCell>
            <TableCell>
                <Chip className={statusChipClass()} size='small' label={voiceData.status} />
            </TableCell>
        </TableRow>
    );
}
