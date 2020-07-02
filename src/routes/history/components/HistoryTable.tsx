import {Button,TablePagination, TableSortLabel, TableBody, TableCell, Typography} from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { CellProps, ColumnInstance, HeaderGroup, Row, useFilters, usePagination, useTable } from 'react-table';
import Select from '@material-ui/core/Select';
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import React from 'reactn';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../theme';
import { DataSet, VoiceData, VoiceDataResults, CONTENT_STATUS } from '../../../types';
import { HistoryTableItem } from './HistoryTableItem';
import { HistoryCellStatusSelect } from './HistoryCellStatusSelect'

const FULL_ROW_COL_SPAN = 5;

interface TranscriptionTableProps {
    voiceData: VoiceData[];
    voiceDataResults?: VoiceDataResults;
    handleStatusChange: (status: any) => void;
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

export function HistoryTable(props: TranscriptionTableProps) {
    const { voiceData, voiceDataResults, handleStatusChange } = props;
    const { translate } = React.useContext(I18nContext);
    const classes = useStyles();

    const renderRowFiller = (<TableRow >
        <TableCell colSpan={FULL_ROW_COL_SPAN} className={classes.tableFiller} />
    </TableRow>);

    const renderSets = () => voiceData.map((voiceData, index) => (<React.Fragment
        key={voiceData.id}
    >
        {index > 0 && renderRowFiller}
        <HistoryTableItem
            voiceData={voiceData}
            voiceDataIndex={index}
            // openEvaluationDetail={openEvaluationDetail}
        />
    </React.Fragment>));

    const renderHeader = () => (<TableHead className={classes.tableHeader}>
        <TableRow>
            <TableCell>
                {translate('forms.file')}
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
            <TableCell style={{ minWidth: '250px', display: 'flex', flexDirection: 'row', }}>
                <HistoryCellStatusSelect handleStatusChange={handleStatusChange}/>
            </TableCell>
            {/*<TableCell>*/}
            {/*    <HistoryCellStatusSelect handleStatusChange={handleStatusChange}/>*/}
            {/*</TableCell>*/}
        </TableRow>
    </TableHead>);

    const renderNoResults = () => (<TableRow >
        <TableCell colSpan={FULL_ROW_COL_SPAN}>
            <Typography align='center' >{translate('table.noResults')}</Typography>
        </TableCell>
    </TableRow>);

    return (
        <>
            <Table className={classes.table}>
                {renderHeader()}
                <TableBody>
                    {(!voiceData.length) ? renderNoResults() : renderSets()}
                </TableBody>
            </Table>
            {/*{*/}
            {/*    voiceData.length &&*/}
            {/*    <TablePagination*/}
            {/*        className={classes.tableHeader}*/}
            {/*        rowsPerPageOptions={[5, 10, 25, 50]}*/}
            {/*        component="div"*/}
            {/*        count={voiceDataResults.totalElements}*/}
            {/*        rowsPerPage={pageSize}*/}
            {/*        page={pageIndex}*/}
            {/*        backIconButtonProps={{*/}
            {/*            'aria-label': 'previous page',*/}
            {/*        }}*/}
            {/*        nextIconButtonProps={{*/}
            {/*            'aria-label': 'next page',*/}
            {/*        }}*/}
            {/*        onChangePage={(event, newPage) => {*/}
            {/*            gotoPage(newPage);*/}
            {/*        }}*/}
            {/*        onChangeRowsPerPage={e => {*/}
            {/*            const numberOfRows: string = e.target.value;*/}
            {/*            localStorage.setItem(LOCAL_STORAGE_KEYS.TDP_TABLE_ROWS_PER_PAGE, numberOfRows);*/}
            {/*            setPageSize(Number(numberOfRows));*/}
            {/*        }}*/}
            {/*        labelRowsPerPage={translate('table.labelRowsPerPage')}*/}
            {/*        labelDisplayedRows={({ from, to, count }) => translate('table.labelDisplayedRows', { from, count, to: to === -1 ? count : to })}*/}
            {/*        ActionsComponent={(paginationProps) => Pagination({ ...paginationProps, pageCount })}*/}
            {/*    />*/}
            {/*}*/}
        </>
    );
}
