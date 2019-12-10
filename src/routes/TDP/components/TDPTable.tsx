import { TableFooter, TablePagination, Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LaunchIcon from '@material-ui/icons/Launch';
import React from 'react';
import { useHistory } from 'react-router-dom';
import PulseLoader from 'react-spinners/PulseLoader';
import { CellProps, ColumnInstance, HeaderGroup, Row, useFilters, usePagination, useTable } from 'react-table';
import TruncateMarkup from 'react-truncate-markup';
import { PERMISSIONS } from '../../../constants';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../hooks/keycloak/KeycloakContext';
import { NavigationPropsContext } from '../../../hooks/navigation-props/NavigationPropsContext';
import { SearchDataRequest } from '../../../services/api/types';
import { PATHS, VoiceData, VoiceDataResults } from '../../../types';
import { BooleanById } from '../../../types/misc.types';
import { formatSecondsDuration } from '../../../util/misc';
import { Pagination } from '../../shared/Pagination';
import { ModelConfigsById } from '../TDP';
import { TDPCellStatusSelect } from './TDPCellStatusSelect';
import { TDPFilters } from './TDPFilters';
import { TDPRowDetails } from './TDPRowDetails';

const TRANSCRIPT_ACCESSOR = 'transcript';
const DOUBLE_HEIGHT_ROW = 2;

interface TDPTableProps {
  projectId: string;
  projectName: string;
  voiceDataResults: VoiceDataResults;
  modelConfigsById: ModelConfigsById;
  onlyAssignedData: boolean;
  loading: boolean;
  getVoiceData: (options?: SearchDataRequest) => Promise<void>;
  handleVoiceDataUpdate: (updatedVoiceData: VoiceData, dataIndex: number) => void;
}

const useStyles = makeStyles(theme =>
  createStyles({
    clickableTableBody: {
      cursor: 'pointer',
    },
  }));

export function TDPTable(props: TDPTableProps) {
  const {
    projectId,
    projectName,
    voiceDataResults,
    modelConfigsById,
    onlyAssignedData,
    loading,
    getVoiceData,
    handleVoiceDataUpdate,
  } = props;
  const voiceData = voiceDataResults.content;
  const { translate, formatDate } = React.useContext(I18nContext);
  const { hasPermission } = React.useContext(KeycloakContext);
  const history = useHistory();
  const { setProps } = React.useContext(NavigationPropsContext);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const [expandedRowsByIndex, setExpandedRowsByIndex] = React.useState<BooleanById>({});
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

  const renderTranscript = (cellData: CellProps<VoiceData>) => {
    const transcript: VoiceData['transcript'] = cellData.cell.value;
    const expanded = !!expandedRowsByIndex[cellData.cell.row.index];
    const lines = expanded ? 6 : 1;
    return <Grid
      container
      wrap='nowrap'
      direction='row'
      alignContent='center'
      alignItems='center'
      justify='flex-start'>
      {canModify && !onlyAssignedData && <IconButton
        color='primary'
        size='medium'
        aria-label="open"
        onClick={() => handleRowClick(cellData.cell.row.original)}
      >
        <LaunchIcon />
      </IconButton>}
      <TruncateMarkup lines={lines}>
        <Typography style={{ minWidth: 250, maxWidth: 350 }}>{transcript}</Typography>
      </TruncateMarkup>
    </Grid>;
  };

  /**
   * The expand button should be rendered on the last item in the row
   * @param cellData 
   */
  const renderHighRiskSegmentsAndExpandButton = (cellData: CellProps<VoiceData>) => {
    const highRiskSegments: VoiceData['highRiskSegments'] = cellData.cell.value || 0;
    const rowIndex = cellData.row.index;
    const expanded = !!expandedRowsByIndex[rowIndex];
    return (<Grid
      container
      wrap='nowrap'
      direction='row'
      alignContent='center'
      alignItems='center'
      justify='flex-start'>
      <Typography>{highRiskSegments}</Typography>
      <IconButton
        color='primary'
        size='medium'
        aria-label="open"
        onClick={() => {
          setExpandedRowsByIndex(prevState => {
            const updatedState = { ...prevState };
            updatedState[rowIndex] = !expanded;
            return updatedState;
          });
        }}
      >
        <ExpandMoreIcon />
      </IconButton>
    </Grid>);
  };

  const renderStatus = (cellData: CellProps<VoiceData>) => {
    // to only make editable when showing all
    if (loading || onlyAssignedData) {
      return cellData.cell.value;
    }
    return TDPCellStatusSelect({ cellData, projectId, onSuccess: handleVoiceDataUpdate });
  };

  const renderDateTime = (cellData: CellProps<VoiceData>) => {
    const dateString: VoiceData['startAt'] | VoiceData['endAt'] = cellData.cell.value;
    const date = new Date(dateString);
    return formatDate(date);
  };

  // define the logic and what the columns should render
  const columns = React.useMemo(
    () => [
      {
        Header: translate('forms.transcript'),
        accessor: TRANSCRIPT_ACCESSOR,
        Cell: (cellData: CellProps<VoiceData>) => renderTranscript(cellData),
      },
      {
        Header: translate('common.date'),
        accessor: 'startAt',
        Cell: (cellData: CellProps<VoiceData>) => renderDateTime(cellData),
      },
      {
        Header: translate('common.length'),
        accessor: 'length',
        Cell: (cellData: CellProps<VoiceData>) => formatSecondsDuration(cellData.cell.value),
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
      // {
      //   Header: translate('forms.transcriber'),
      //   // to only display if it has a value
      //   accessor: (row: VoiceData) => row.transcriber || '',
      //   Cell: (cellData: CellProps<VoiceData>) => renderTranscriber(cellData),
      // },
      {
        Header: translate('TDP.highRiskSegments'),
        accessor: 'highRiskSegments',
        Cell: (cellData: CellProps<VoiceData>) => renderHighRiskSegmentsAndExpandButton(cellData),
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
    flatColumns,
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
  }, [getVoiceData, pageIndex, pageSize, voiceDataOptions]);

  // Render the UI for your table
  const renderHeaderCell = (column: ColumnInstance<VoiceData>, idx: number) => (
    <TableCell key={`column-${idx}`} {...column.getHeaderProps()}>
      {column.render('Header')}
    </TableCell>);

  const renderHeaderRow = (headerGroup: HeaderGroup<VoiceData>, index: number) => (
    <TableRow key={`headerGroup-${index}`} {...headerGroup.getHeaderGroupProps()}>
      {headerGroup.headers.map((column, idx) => (
        renderHeaderCell(column, idx)
      ))}
    </TableRow>);

  const renderHeader = () => (
    <TableHead>
      {headerGroups.map((headerGroup: HeaderGroup<VoiceData>, index: number) => (
        renderHeaderRow(headerGroup, index)))}
    </TableHead>);

  // adding one for the expand button column
  const fullRowColSpan = flatColumns.length + 1;
  const detailsRowColSpan = fullRowColSpan - DOUBLE_HEIGHT_ROW;

  const renderRows = () => rows.map(
    (row: Row<VoiceData>, rowIndex: number) => {
      const expanded = !!expandedRowsByIndex[rowIndex];
      prepareRow(row);
      return (
        <React.Fragment key={`row-${rowIndex}`}>
          <TableRow
            hover={(onlyAssignedData || !canModify)}
            onClick={() => (onlyAssignedData || !canModify) ? handleRowClick(row.original) : {}}
            key={`row-${rowIndex}`}
            {...row.getRowProps()}
          >
            {row.cells.map((cell, cellIndex) => {
              const isExpandedTranscript = expanded && cell.column.id === TRANSCRIPT_ACCESSOR;
              return (
                <TableCell
                  key={`cell-${cellIndex}`}
                  {...cell.getCellProps()}
                  rowSpan={isExpandedTranscript ? DOUBLE_HEIGHT_ROW : undefined}
                >
                  {cell.render('Cell')}
                </TableCell>
              );
            })}
          </TableRow>
          {expanded &&
            <TDPRowDetails
              row={row}
              detailsRowColSpan={detailsRowColSpan}
              projectId={projectId}
              onSuccess={handleVoiceDataUpdate}
            />
          }
        </React.Fragment >
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
            <TableCell colSpan={fullRowColSpan}>
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
      ActionsComponent={(paginationProps) => Pagination({ ...paginationProps, pageCount })}
    />}
  </>
  );
}
