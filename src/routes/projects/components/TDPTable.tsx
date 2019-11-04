import { TableFooter, TablePagination } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import React from 'react';
import PulseLoader from 'react-spinners/PulseLoader';
import { CellProps, useFilters, usePagination, useTable } from 'react-table';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { VoiceDataResults } from '../../../services/api/types';
import { ModelConfig, VoiceData } from '../../../types';
import { TDPTablePaginationActions } from './TDPTablePaginationActions';

interface TDPTableProps {
  voiceDataResults: VoiceDataResults;
  modelConfigs: ModelConfig[];
  loading: boolean;
  getVoiceData: (page?: number, size?: number) => Promise<void>;
}


export function TDPTable(props: TDPTableProps) {
  const { voiceDataResults, modelConfigs, loading, getVoiceData } = props;
  const voiceData = voiceDataResults.content;
  const { translate } = React.useContext(I18nContext);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const theme = useTheme();

  const modelConfigsById = React.useMemo(
    () => {
      const modelConfigsByIdTemp: { [x: number]: ModelConfig; } = {};
      modelConfigs.forEach(modelConfig => modelConfigsByIdTemp[modelConfig.id] = modelConfig);
      return modelConfigsByIdTemp;
    },
    [modelConfigs]
  );

  const renderModelName = (cellData: CellProps<VoiceData>) => {
    const id: VoiceData['modelConfigId'] = cellData.cell.value;
    return modelConfigsById[id].name;
  };

  const renderCreatedAt = (cellData: CellProps<VoiceData>) => {
    const createdAt: VoiceData['createdAt'] = cellData.cell.value;
    const date = new Date(createdAt);
    return `${date.toDateString()} ${date.toTimeString()}`
  };


  // define the logic and what the columns should render
  const columns = React.useMemo(
    () => [
      {
        Header: 'Created',
        accessor: 'createdAt',
        Cell: (cellData: CellProps<VoiceData>) => renderCreatedAt(cellData),
      },
      {
        Header: 'Length',
        accessor: 'length',
      },
      {
        Header: 'Score',
        accessor: 'score',
      },
      {
        Header: 'Model Config Id',
        accessor: 'modelConfigId',
        Cell: (cellData: CellProps<VoiceData>) => renderModelName(cellData),
      },
      {
        Header: 'Status',
        accessor: 'status',
      },
      {
        Header: 'Transcript',
        accessor: 'transcript',
      },
    ],
    [voiceDataResults]
  );

  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    rows,
    // Get the state from the instance
    state: { pageIndex, pageSize }
  } = useTable<VoiceData>(
    {
      columns,
      data: voiceData,
      initialState: { pageIndex: 0, pageSize: voiceDataResults.size }, // Pass our hoisted table state
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      //@ts-ignore
      manualPagination: true, // Tell the usePagination
      // hook that we'll handle our own data fetching
      // This means we'll also have to provide our own
      // pageCount.
      pageCount: voiceDataResults.totalPages,
    },
    useFilters,
    usePagination,
  );

  // Listen for changes in pagination and use the state to fetch our new data
  React.useEffect(() => {
    // to prevent reloading the initial data from the parent
    if(initialLoad) {
      setInitialLoad(false);
    } else {
      getVoiceData(pageIndex, pageSize);
    }
  }, [pageIndex, pageSize]);

  // Render the UI for your table
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  //@ts-ignore
  const renderHeader = () => headerGroups.map((headerGroup, index) => (
    <TableRow key={`headerGroup-${index}`} {...headerGroup.getHeaderGroupProps()}>
      {/** //eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      //@ts-ignore */}
      {headerGroup.headers.map((column, idx) => (
        <TableCell key={`column-${idx}`} {...column.getHeaderProps()}>
          {column.render('Header')}
        </TableCell>
      ))}
    </TableRow>
  ));

  const renderRows = () => rows.map(
    //eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    //@ts-ignore
    (row, rowIndex) => {
      prepareRow(row);
      return (
        <TableRow key={`row-${rowIndex}`} {...row.getRowProps()}>
          {/** //eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        //@ts-ignore */}
          {row.cells.map((cell, cellIndex) => {
            return (
              <TableCell key={`cell-${cellIndex}`} {...cell.getCellProps()}>
                {cell.render('Cell')}
              </TableCell>
            );
          })}
        </TableRow>
      );
    });

  return (<>
    <Table stickyHeader {...getTableProps()}>
      <TableHead>
        {renderHeader()}
      </TableHead>
      <TableHead>
        {renderHeader()}
      </TableHead>
      <TableBody>
        {renderRows()}
      </TableBody>
    </Table>
      <TableFooter component="div">
        {loading && (
            <PulseLoader
              sizeUnit={"px"}
              size={25}
              color={theme.palette.primary.main}
              loading={true}
            />
            )}
      </TableFooter>
    <TablePagination
      rowsPerPageOptions={[5, 10, 25, 50, 100]}
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
        gotoPage(newPage);
      }}
      onChangeRowsPerPage={e => {
        setPageSize(Number(e.target.value));
      }}
      labelRowsPerPage={translate('table.labelRowsPerPage')}
      labelDisplayedRows={({ from, to, count }) => translate('table.labelDisplayedRows', {from, count, to: to === -1 ? count : to})}
      ActionsComponent={(paginationProps) => TDPTablePaginationActions({...paginationProps, pageCount})}
    /></>
  );
}
