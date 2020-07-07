import {Button, TableBody, TableCell, Typography} from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Select from '@material-ui/core/Select';
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import React from 'reactn';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../theme';
import { DataSet, VoiceData } from '../../../types';
import { PERMISSIONS } from '../../../constants';
import { TranscriptionTableItem } from './TranscriptionTableItem';
import { TranscriptionCellStatusSelect } from './TranscriptionCellStatusSelect';

const FULL_ROW_COL_SPAN = 7;

interface TranscriptionTableProps {
    voiceData: VoiceData[];
    getAllVoiceData: () => void;
    getVoiceDataInReview: () => void;
    handleConfirmationClick: (voiceDataIndex: number) => void;
    handleRejectClick: (voiceDataIndex: number) => void;
    showStatus: boolean;
}

const useStyles = makeStyles((theme: CustomTheme) =>
    createStyles({
        table: {
            backgroundColor: theme.palette.background.paper,
        },
        tableHeader: {
            backgroundColor: theme.palette.background.default,
        },
        tableFiller: {
            padding: 3,
            backgroundColor: theme.palette.background.default,
            borderWidth: 0,
        },
        formControl: {
            margin: theme.spacing(1),
            float: 'right',
            minWidth: 150,
            display: 'flex',
            flexWrap: 'wrap',
            flexDirection: 'row',
        },
        filterBtn: {
            height: 45,
        }
    }));

export function TranscriptionTable(props: TranscriptionTableProps) {
    const { voiceData, getAllVoiceData, getVoiceDataInReview, handleConfirmationClick, handleRejectClick, showStatus } = props;
    const { translate } = React.useContext(I18nContext);
    const classes = useStyles();

    const renderRowFiller = (<TableRow >
        <TableCell colSpan={FULL_ROW_COL_SPAN} className={classes.tableFiller} />
    </TableRow>);

    const renderSets = () => voiceData.map((voiceData, index) => (<React.Fragment
        key={voiceData.id}
    >
        {index > 0 && renderRowFiller}
        <TranscriptionTableItem
            voiceData={voiceData}
            voiceDataIndex={index}
            handleConfirmationClick={handleConfirmationClick}
            handleRejectClick={handleRejectClick}
            // openEvaluationDetail={openEvaluationDetail}
        />
    </React.Fragment>));

    const renderHeader = () => (<TableHead className={classes.tableHeader}>
        <TableRow>
            <TableCell>
                {translate('forms.file')}
            </TableCell>
            <TableCell>
                {translate('forms.transcriber')}
            </TableCell>
            <TableCell>
                {translate('TDP.wordCount')}
            </TableCell>
            <TableCell>
                {translate('common.length')}
            </TableCell>
            <TableCell>
                {translate('common.date')}
            </TableCell>
            <TableCell>
                {translate('admin.diff')}
            </TableCell>
            <TableCell>
                {translate('common.confirm') + ' / ' + translate('common.reject')}
            </TableCell>
        </TableRow>
    </TableHead>);

    const renderNoResults = () => (<TableRow >
        <TableCell colSpan={FULL_ROW_COL_SPAN}>
            <Typography align='center' >{translate('table.noResults')}</Typography>
        </TableCell>
    </TableRow>);

    return (
        <Table className={classes.table}>
            {renderHeader()}
            <TableBody>
                {(!voiceData.length) ? renderNoResults() : renderSets()}
            </TableBody>
        </Table>
    );
}
