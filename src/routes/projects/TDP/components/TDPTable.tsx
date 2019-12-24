import { TableFooter, TablePagination, Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LaunchIcon from '@material-ui/icons/Launch';
import React from 'react';
import { useHistory } from 'react-router-dom';
import PulseLoader from 'react-spinners/PulseLoader';
import { CellProps, ColumnInstance, HeaderGroup, Row, useFilters, usePagination, useTable } from 'react-table';
import TruncateMarkup from 'react-truncate-markup';
import { PERMISSIONS } from '../../../../constants';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../../hooks/keycloak/KeycloakContext';
import { NavigationPropsContext } from '../../../../hooks/navigation-props/NavigationPropsContext';
import { useWindowSize } from '../../../../hooks/window/useWindowSize';
import { SearchDataRequest } from '../../../../services/api/types';
import { CustomTheme } from '../../../../theme';
import { FilterParams, PATHS, VoiceData, VoiceDataResults } from '../../../../types';
import { BooleanById } from '../../../../types/misc.types';
import { formatSecondsDuration } from '../../../../util/misc';
import { Pagination } from '../../../shared/Pagination';
import { ModelConfigsById } from '../TDP';
import { TDPCellStatusSelect } from './TDPCellStatusSelect';
import { TDPFilters } from './TDPFilters';
import { TDPRowDetails } from './TDPRowDetails';

const TRANSCRIPT_ACCESSOR = 'transcript';
const DOUBLE_HEIGHT_ROW = 2;
const SINGLE_WIDTH_COLUMN = 1;

interface TDPTableProps {
  projectId: string;
  projectName: string;
  voiceDataResults: VoiceDataResults;
  modelConfigsById: ModelConfigsById;
  onlyAssignedData: boolean;
  loading: boolean;
  getVoiceData: (options?: SearchDataRequest) => Promise<void>;
  handleVoiceDataUpdate: (updatedVoiceData: VoiceData, dataIndex: number) => void;
  setFilterParams: (filterParams?: FilterParams) => void;
}

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    clickableTableBody: {
      cursor: 'pointer',
    },
    filterContainer: {
      marginBottom: 1,
    },
    table: {
      backgroundColor: theme.palette.background.paper,
    },
    tableHeader: {
      backgroundColor: theme.palette.background.default,
    },
    tableBorder: {
      borderColor: theme.table.border,
    },
    tableNoBorder: {
      borderWidth: 0,
    },
    tableFiller: {
      padding: 3,
      backgroundColor: theme.palette.background.default,
      borderWidth: 0,
    },
    tableRow: {
      borderLeftWidth: 5,
      borderRightWidth: 2,
      borderTopWidth: 1,
      borderBottomWidth: 0,
      borderColor: theme.table.border,
      border: 'solid',
      borderCollapse: undefined,
    }
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
    setFilterParams,
  } = props;
  const voiceData = voiceDataResults.content;
  const { translate, formatDate } = React.useContext(I18nContext);
  const { hasPermission } = React.useContext(KeycloakContext);
  const { width } = useWindowSize();
  const history = useHistory();
  const { setProps } = React.useContext(NavigationPropsContext);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const [expandedRowsByIndex, setExpandedRowsByIndex] = React.useState<BooleanById>({});
  const [voiceDataOptions, setVoiceDataOptions] = React.useState<SearchDataRequest>({});

  const classes = useStyles();
  const theme: CustomTheme = useTheme();

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
    return (modelConfigsById[id] && modelConfigsById[id].name) || '';
  };

  const renderTranscript = (cellData: CellProps<VoiceData>) => {
    const transcript: VoiceData['transcript'] = cellData.cell.value;
    const expanded = !!expandedRowsByIndex[cellData.cell.row.index];
    const numberOfLines = expanded ? 8 : 1;
    const TWENTY_FIVE_PERCENT = 0.25;
    // to keep a dynamic width of 25% based on the window
    const dynamicWidth = width && width * TWENTY_FIVE_PERCENT;
    // to prevent the width from expanding greater than 25% of the container
    const containerWidth = theme.breakpoints.width('lg');
    const maxWidth = containerWidth * TWENTY_FIVE_PERCENT;
    const transcriptStyle = dynamicWidth ? { width: dynamicWidth, maxWidth } : { minWidth: 250, maxWidth: 350 };
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
      <TruncateMarkup lines={numberOfLines}>
        <Typography style={transcriptStyle}>{transcript}</Typography>
      </TruncateMarkup>
    </Grid>;
  };

  /**
   * The expand button should be rendered on the last item in the row
   * - `highRiskSegments` is the last item in the row
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
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
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
        Header: translate('modelConfig.header'),
        accessor: 'modelConfigId',
        Cell: (cellData: CellProps<VoiceData>) => renderModelName(cellData),
      },
      {
        Header: translate('common.length'),
        accessor: 'length',
        Cell: (cellData: CellProps<VoiceData>) => formatSecondsDuration(cellData.cell.value),
      },
      {
        Header: translate('common.date'),
        accessor: 'startAt',
        Cell: (cellData: CellProps<VoiceData>) => renderDateTime(cellData),
      },
      {
        Header: translate('forms.status'),
        accessor: 'status',
        Cell: (cellData: CellProps<VoiceData>) => renderStatus(cellData),
      },
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


  const setCreateSetFilterParams = (options: SearchDataRequest) => {
    const { till, from, status, transcript } = options;
    const filterParams: FilterParams = {
      till,
      from,
      status,
      transcript,
      lengthMax: options['length-max'],
      lengthMin: options['length-min'],
      modelConfig: options['model-config'],
    };
    const isFilteringStringKeyType: { [x: string]: unknown; } = { ...filterParams };
    const isFiltering = Object.keys(filterParams).some((key) => isFilteringStringKeyType[key]);
    setFilterParams(isFiltering ? filterParams : undefined);
  };

  /**
   * update the stored options and get fresh data
   * - resetting the page will trigger `getVoiceData` in `useEffect`
   */
  const handleFilterUpdate = (options: SearchDataRequest = {}) => {
    setVoiceDataOptions(options);
    setCreateSetFilterParams(options);
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
    <TableHead className={classes.tableHeader} >
      {headerGroups.map((headerGroup: HeaderGroup<VoiceData>, index: number) => (
        renderHeaderRow(headerGroup, index)))}
    </TableHead>);

  const fullRowColSpan = flatColumns.length;
  // subtracting the transcript column
  const detailsRowColSpan = fullRowColSpan - SINGLE_WIDTH_COLUMN;

  const renderRows = () => rows.map(
    (row: Row<VoiceData>, rowIndex: number) => {
      const expanded = !!expandedRowsByIndex[rowIndex];
      prepareRow(row);
      const rowFiller = (<TableRow >
        <TableCell colSpan={fullRowColSpan} className={classes.tableFiller} />
      </TableRow>);
      return (
        <React.Fragment key={`row-${rowIndex}`}>
          {rowIndex > 0 && rowFiller}
          <TableRow
            hover={(onlyAssignedData || !canModify)}
            onClick={() => (onlyAssignedData || !canModify) ? handleRowClick(row.original) : {}}
            key={`row-${rowIndex}`}
            {...row.getRowProps()}
            className={classes.tableRow}
          >
            {row.cells.map((cell, cellIndex) => {
              const isTranscript = cell.column.id === TRANSCRIPT_ACCESSOR;
              const isExpandedTranscript = expanded && isTranscript;
              let className = classes.tableBorder;
              let style: React.CSSProperties = {};
              if (isTranscript) {
                style = { borderRightWidth: 2, borderRightColor: theme.table.highlight };
              }
              if (!isTranscript && expanded) {
                className = classes.tableNoBorder;
              }
              return (
                <TableCell
                  key={`cell-${cellIndex}`}
                  {...cell.getCellProps()}
                  rowSpan={isExpandedTranscript ? DOUBLE_HEIGHT_ROW : undefined}
                  className={className}
                  style={style}
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
      <div className={classes.filterContainer} >
        <TDPFilters
          updateVoiceData={handleFilterUpdate}
          loading={loading}
          modelConfigsById={modelConfigsById}
        />
      </div>
    }
    <Table {...getTableProps()} className={classes.table} >
      {renderHeader()}
      <TableBody className={(onlyAssignedData || !canModify) ? classes.clickableTableBody : undefined} >
        {voiceData.length ? renderRows() : (
          <TableRow>
            <TableCell align='center' colSpan={fullRowColSpan} >
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
      className={classes.tableHeader}
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
