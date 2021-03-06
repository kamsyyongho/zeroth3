import { TablePagination, Typography } from '@material-ui/core';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import PulseLoader from 'react-spinners/PulseLoader';
import {
  ColumnInstance,
  HeaderGroup,
  Row,
  useFilters,
  usePagination,
  useTable } from 'react-table';
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { LOCAL_STORAGE_KEYS, PaginatedResults, TranscriberStats } from '../../../../types';
import { Pagination } from '../../../shared/Pagination';
import { RatingDisplay } from '../../../shared/RatingDisplay';

const EMAIL_COLUMN_ID = 'email';

const useStyles = makeStyles((theme) =>
  createStyles({
    table: {
      backgroundColor: theme.palette.background.paper,
    },
  }));

interface TranscribersTableProps {
  transcribersStats: TranscriberStats[];
  pagination: PaginatedResults;
  loading: boolean;
  handleUpdate: (page?: number, size?: number) => Promise<void>;
}

export function TranscribersTable(props: TranscribersTableProps) {
  const {
    transcribersStats,
    pagination,
    loading,
    handleUpdate,
  } = props;
  const { translate } = React.useContext(I18nContext);
  const [initialLoad, setInitialLoad] = React.useState(true);

  const theme = useTheme();
  const classes = useStyles();

  // define the logic and what the columns should render
  const columns = React.useMemo(
    () => [
      {
        Header: translate('forms.email'),
        accessor: EMAIL_COLUMN_ID,
      },
      {
        Header: translate('transcribers.count'),
        accessor: 'count',
      },
      {
        Header: translate('transcribers.rating'),
        accessor: 'rating',
        Cell: ({ value }: { value: number }) => RatingDisplay({ rating: value }),
      },
    ],
    [transcribersStats]
  );

  // Use the state and functions returned from useTable to build your UI
  const instance = useTable(
    {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      //@ts-ignore
      columns,
      data: transcribersStats,
      initialState: { pageIndex: 0, pageSize: pagination.size }, // Pass our hoisted table state
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      //@ts-ignore
      manualPagination: true, // Tell the usePagination
      // hook that we'll handle our own data fetching
      // This means we'll also have to provide our own
      // pageCount.
      pageCount: pagination.totalPages,
    },
    useFilters,
    usePagination,
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    pageCount,
    gotoPage,
    setPageSize,
    rows,
    // Get the state from the instance
    state: { pageIndex, pageSize }
  } = instance;


  // Listen for changes in pagination and use the state to fetch our new data
  React.useEffect(() => {

    // to prevent reloading the initial data from the parent
    if (initialLoad) {
      setInitialLoad(false);
    } else {
      handleUpdate(pageIndex, pageSize);
    }
  }, [pageIndex, pageSize]);

  // Render the UI for your table
  const renderHeaderCell = (column: ColumnInstance<TranscriberStats>, idx: number) => (
    <TableCell align={column.id !== EMAIL_COLUMN_ID ? 'center' : undefined} {...column.getHeaderProps()}>
      {column.render('Header')}
    </TableCell>);

  const renderHeaderRow = (headerGroup: HeaderGroup<TranscriberStats>, index: number) => (
    <TableRow {...headerGroup.getHeaderGroupProps()}>
      {headerGroup.headers.map((column, idx) => (
        renderHeaderCell(column, idx)
      ))}
    </TableRow>);

  const renderHeader = () => (
    <TableHead>
      {headerGroups.map((headerGroup: HeaderGroup<TranscriberStats>, index: number) => (
        renderHeaderRow(headerGroup, index)))}
    </TableHead>);

  const renderRows = () => rows.map(
    (row: Row<TranscriberStats>, rowIndex: number) => {
      prepareRow(row);
      return (
        <TableRow
          key={`row-${rowIndex}`}
          {...row.getRowProps()}
        >
          {row.cells.map((cell, cellIndex) => {
            return (
              <TableCell
                key={`cell-${cellIndex}`}
                align={cell.column.id !== EMAIL_COLUMN_ID ? 'center' : undefined}
                {...cell.getCellProps()}
              >
                {cell.render('Cell')}
              </TableCell>
            );
          })}
        </TableRow>
      );
    });

  return (<>
    <Table stickyHeader {...getTableProps()} className={classes.table} >
      {renderHeader()}
      <TableBody>
        {transcribersStats.length ? renderRows() : (
          <TableRow>
            <TableCell align='center' colSpan={columns.length} >
              <Typography component='span' >{translate('table.noResults')}</Typography>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
    <div>
      {loading && (
        <PulseLoader
          sizeUnit={"px"}
          size={25}
          color={theme.palette.primary.main}
          loading={true}
        />
      )}
    </div>
    {!!transcribersStats.length && <TablePagination
      rowsPerPageOptions={[5, 10, 25, 50, 100]}
      component="div"
      count={pagination.totalElements}
      rowsPerPage={pageSize}
      page={pageIndex}
      backIconButtonProps={{
        'aria-label': 'previous page',
      }}
      nextIconButtonProps={{
        'aria-label': 'next page',
      }}
      onChangePage={(event, newPage) => {
        gotoPage(newPage);
      }}
      onChangeRowsPerPage={e => {
        const numberOfRows: string = e.target.value;
        localStorage.setItem(LOCAL_STORAGE_KEYS.TRANSCRIBER_TABLE_ROWS_PER_PAGE, numberOfRows);
        setPageSize(Number(numberOfRows));
      }}
      labelRowsPerPage={translate('table.labelRowsPerPage')}
      labelDisplayedRows={({ from, to, count }) => translate('table.labelDisplayedRows', { from, count, to: to === -1 ? count : to })}
      ActionsComponent={(paginationProps) => Pagination({ ...paginationProps, pageCount })}
    />}
  </>
  );
}
