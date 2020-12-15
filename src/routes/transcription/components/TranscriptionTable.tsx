import {Button, TableBody, TablePagination, TableCell, Typography} from '@material-ui/core';
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
import { DataSet, VoiceData, VoiceDataResults, LOCAL_STORAGE_KEYS } from '../../../types';
import { PERMISSIONS } from '../../../constants';
import { TranscriptionTableItem } from './TranscriptionTableItem';
import { TranscriptionCellStatusSelect } from './TranscriptionCellStatusSelect';

const FULL_ROW_COL_SPAN = 7;

interface TranscriptionTableProps {
    voiceDataResults: VoiceDataResults;
    getAllVoiceData: () => void;
    handlePagination: (pageIndex: number, size: number) => void;
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
    const { voiceDataResults, getAllVoiceData, getVoiceDataInReview, handlePagination, handleConfirmationClick, handleRejectClick, showStatus } = props;
    const { translate } = React.useContext(I18nContext);
    const [pageSize, setPageSize] = React.useState<number>(10);
    const [pageIndex, setPageIndex] = React.useState<number>(0);
    const [voiceData, setVoiceData] = React.useState<VoiceData[]>([]);
    const classes = useStyles();

    React.useEffect(() => {
        if(voiceDataResults?.content) {
            setVoiceData(voiceDataResults.content);
        }
    }, [voiceDataResults]);

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
                {translate('forms.fileName')}
            </TableCell>
            <TableCell>
                {translate('forms.transcriber')}
            </TableCell>
            <TableCell>
                {translate('TDP.wordCount')}
            </TableCell>
            <TableCell>
                {translate('common.audioLength')}
            </TableCell>
            <TableCell>
                {translate('common.date')}
            </TableCell>
            <TableCell>
                {translate('admin.diff')}
            </TableCell>
            <TableCell>
                {translate('common.confirmationStatus')}
            </TableCell>
        </TableRow>
    </TableHead>);

    const renderNoResults = () => (<TableRow>
        <TableCell colSpan={FULL_ROW_COL_SPAN}>
            <Typography align='center' >{translate('table.noResults')}</Typography>
        </TableCell>
    </TableRow>);

    return (
        <>
            <Table className={classes.table}>
                {renderHeader()}
                <TableBody>
                    {!voiceData.length ? renderNoResults() : renderSets()}
                </TableBody>
            </Table>
            {
                voiceData.length > 0 &&
                <TablePagination
                    className={classes.tableHeader}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={voiceDataResults.totalElements}
                    rowsPerPage={pageSize}
                    page={pageIndex}
                    backIconButtonProps={{
                        'aria-label': 'previous page',
                    }}
                    nextIconButtonProps={{
                        'aria-label': 'next page',
                    }}
                    onChangePage={(event, newPage) => {
                        setPageIndex(newPage);
                        handlePagination(newPage, pageSize);
                    }}
                    onChangeRowsPerPage={e => {
                        const numberOfRows: string = e.target.value;
                        localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY_TABLE_ROWS_PER_PAGE, numberOfRows);
                        setPageSize(Number(numberOfRows));
                        handlePagination(0, Number(numberOfRows));
                    }}
                    labelRowsPerPage={translate('table.labelRowsPerPage')}
                    labelDisplayedRows={({ from, to, count }) => translate('table.labelDisplayedRows', { from, count, to: to === -1 ? count : to })}
                />
            }
        </>

    );
}
