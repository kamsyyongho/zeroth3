import { TableFooter, TablePagination, Typography } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import LaunchIcon from '@material-ui/icons/Launch';
import React from 'react';
import { useHistory } from 'react-router-dom';
import PulseLoader from 'react-spinners/PulseLoader';
import { CellProps, ColumnInstance, HeaderGroup, Row, useFilters, usePagination, useTable } from 'react-table';
import { PERMISSIONS } from '../../../constants';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../hooks/keycloak/KeycloakContext';
import { NavigationPropsContext } from '../../../hooks/navigation-props/NavigationPropsContext';
import { SearchDataRequest } from '../../../services/api/types';
import { CONTENT_STATUS, PATHS, Transcriber, VoiceData, VoiceDataResults } from '../../../types';
import { ModelConfigsById } from '../TDP';
import { TDPCellStatusSelect } from './TDPCellStatusSelect';
import { TDPCellTranscriberSelect } from './TDPCellTranscriberSelect';
import { TDPFilters } from './TDPFilters';
import { TDPTablePaginationActions } from './TDPTablePaginationActions';

interface TDPTableProps {
  projectId: number;
  projectName: string;
  transcribers: Transcriber[];
  voiceDataResults: VoiceDataResults;
  modelConfigsById: ModelConfigsById;
  onlyAssignedData: boolean;
  loading: boolean;
  getVoiceData: (options?: SearchDataRequest) => Promise<void>;
  handleVoiceDataUpdate: (updatedVoiceData: VoiceData, dataIndex: number) => void;
}

const useStyles = makeStyles(theme => ({
  clickableTableBody: {
    cursor: 'pointer',
  },
}));

export function TDPTable(props: TDPTableProps) {
  const {
    projectId,
    projectName,
    transcribers,
    voiceDataResults,
    modelConfigsById,
    onlyAssignedData,
    loading,
    getVoiceData,
    handleVoiceDataUpdate,
  } = props;
  const voiceData = voiceDataResults.content;
  const { translate } = React.useContext(I18nContext);
  const { hasPermission } = React.useContext(KeycloakContext);
  const history = useHistory();
  const { setProps } = React.useContext(NavigationPropsContext);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const [voiceDataOptions, setVoiceDataOptions] = React.useState<SearchDataRequest>({});

  const classes = useStyles();
  const theme = useTheme();

  const canModify = React.useMemo(() => hasPermission(PERMISSIONS.crud), []);

  /**
   * navigates to the the editor
   * @param voiceData 
   */
  const handleRowClick = (voiceData: VoiceData) => {
    // to store props that will be used on the next page
    setProps({ projectName, voiceData });
    PATHS.editor.function && history.push(PATHS.editor.function(projectId, voiceData.id));
  };

  const renderModelName = (cellData: CellProps<VoiceData>) => {
    const id: VoiceData['modelConfigId'] = cellData.cell.value;
    return modelConfigsById[id].name;
  };

  const renderStatus = (cellData: CellProps<VoiceData>) => {
    // to only make editable when showing all
    if (loading || onlyAssignedData) {
      return cellData.cell.value;
    }
    return TDPCellStatusSelect({ cellData, projectId, onSuccess: handleVoiceDataUpdate });
  };

  const renderTranscriber = (cellData: CellProps<VoiceData>) => {
    // to only make editable when showing all and has permissions
    const canAssign = cellData.cell.row.original.status === CONTENT_STATUS.UNCONFIRMED_LC;
    if (canModify && canAssign && !(loading || onlyAssignedData)) {
      return TDPCellTranscriberSelect({ cellData, projectId, transcribers, onSuccess: handleVoiceDataUpdate });
    }
    return cellData.cell.value || '';
  };

  const renderCreatedAt = (cellData: CellProps<VoiceData>) => {
    const createdAt: VoiceData['createdAt'] = cellData.cell.value;
    const date = new Date(createdAt);
    return `${date.toDateString()} ${date.toTimeString()}`;
  };

  // define the logic and what the columns should render
  const columns = React.useMemo(
    () => [
      {
        Header: translate('common.createdAt'),
        accessor: 'createdAt',
        Cell: (cellData: CellProps<VoiceData>) => renderCreatedAt(cellData),
      },
      {
        Header: translate('common.length'),
        accessor: 'length',
      },
      {
        Header: translate('common.score'),
        accessor: 'score',
      },
      {
        Header: translate('modelConfig.header'),
        accessor: 'modelConfigId',
        Cell: (cellData: CellProps<VoiceData>) => renderModelName(cellData),
      },
      {
        Header: translate('forms.status'),
        accessor: 'status',
        Cell: (cellData: CellProps<VoiceData>) => renderStatus(cellData),
      },
      {
        Header: translate('forms.transcriber'),
        // to only display if it has a value
        accessor: (row: VoiceData) => row.transcriber || '',
        Cell: (cellData: CellProps<VoiceData>) => renderTranscriber(cellData),
      },
      {
        Header: translate('forms.transcript'),
        accessor: 'transcript',
      },
    ],
    [voiceData, renderModelName, translate]
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


  /**
   * update the stored options and get fresh data
   * - resetting the page will trigger `getVoiceData` in `useEffect`
   */
  const handleFilterUpdate = (options: SearchDataRequest = {}) => {
    setVoiceDataOptions(options);
    gotoPage(0);
  };


  // Listen for changes in pagination and use the state to fetch our new data
  React.useEffect(() => {
    // to prevent reloading the initial data from the parent
    if (initialLoad) {
      setInitialLoad(false);
    } else {
      getVoiceData({ ...voiceDataOptions, page: pageIndex, size: pageSize });
    }
  }, [getVoiceData, initialLoad, pageIndex, pageSize, voiceDataOptions]);

  // Render the UI for your table
  const renderHeaderCell = (column: ColumnInstance<VoiceData>, idx: number) => (
    <TableCell key={`column-${idx}`} {...column.getHeaderProps()}>
      {column.render('Header')}
    </TableCell>);

  const renderHeaderRow = (headerGroup: HeaderGroup<VoiceData>, index: number) => (
    <TableRow key={`headerGroup-${index}`} {...headerGroup.getHeaderGroupProps()}>
      {canModify && !onlyAssignedData && <TableCell key={`column-view`}>
        {translate('common.view')}
      </TableCell>}
      {headerGroup.headers.map((column, idx) => (
        renderHeaderCell(column, idx)
      ))}
    </TableRow>);

  const renderHeader = () => (
    <TableHead>
      {headerGroups.map((headerGroup: HeaderGroup<VoiceData>, index: number) => (
        renderHeaderRow(headerGroup, index)))}
    </TableHead>);

  const renderRows = () => rows.map(
    (row: Row<VoiceData>, rowIndex: number) => {
      prepareRow(row);
      return (
        <TableRow
          hover={(onlyAssignedData || !canModify)}
          onClick={() => (onlyAssignedData || !canModify) ? handleRowClick(row.original) : {}}
          key={`row-${rowIndex}`}
          {...row.getRowProps()}
        >
          {canModify && !onlyAssignedData && (
            <TableCell key={`cell-view`}>
              <IconButton
                color='primary'
                size='medium'
                aria-label="open"
                onClick={() => handleRowClick(row.original)}
              >
                <LaunchIcon />
              </IconButton>
            </TableCell>)}
          {row.cells.map((cell, cellIndex) => {
            return (
              <TableCell
                key={`cell-${cellIndex}`}
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
    {!onlyAssignedData &&
      <div style={{ marginBottom: 1 }}>
        <TDPFilters
          updateVoiceData={handleFilterUpdate}
          loading={loading}
          modelConfigsById={modelConfigsById}
        />
      </div>
    }
    <Table stickyHeader {...getTableProps()}>
      {renderHeader()}
      <TableBody className={(onlyAssignedData || !canModify) ? classes.clickableTableBody : undefined} >
        {voiceData.length ? renderRows() : (
          <TableRow>
            <TableCell>
              <Typography component='span' >{translate('table.noResults')}</Typography>
            </TableCell>
          </TableRow>
        )}
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
    {!!voiceData.length && <TablePagination
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
      labelDisplayedRows={({ from, to, count }) => translate('table.labelDisplayedRows', { from, count, to: to === -1 ? count : to })}
      ActionsComponent={(paginationProps) => TDPTablePaginationActions({ ...paginationProps, pageCount })}
    />}
  </>
  );
}
