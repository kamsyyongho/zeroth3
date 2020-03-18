import { Backdrop, TablePagination, TableSortLabel, Tooltip, Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LaunchIcon from '@material-ui/icons/Launch';
import { useHistory } from 'react-router-dom';
import PulseLoader from 'react-spinners/PulseLoader';
import { CellProps, ColumnInstance, HeaderGroup, Row, useFilters, usePagination, useTable } from 'react-table';
import TruncateMarkup from 'react-truncate-markup';
import React, { useGlobal } from 'reactn';
import { PERMISSIONS } from '../../../../constants';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../../hooks/keycloak/KeycloakContext';
import { useWindowSize } from '../../../../hooks/window/useWindowSize';
import { SearchDataRequest } from '../../../../services/api/types';
import { CustomTheme } from '../../../../theme';
import { BooleanById, CONTENT_STATUS, DataSet, FilterParams, GenericById, LOCAL_STORAGE_KEYS, ModelConfig, ORDER, PATHS, TDPTableColumns, VoiceData, VoiceDataResults } from '../../../../types';
import { formatSecondsDuration } from '../../../../util/misc';
import { Pagination } from '../../../shared/Pagination';
import { TDPCellStatusSelect } from './TDPCellStatusSelect';
import { TDPFilters } from './TDPFilters';
import { TDPRowDetails } from './TDPRowDetails';

const DOUBLE_HEIGHT_ROW = 2;
const SINGLE_WIDTH_COLUMN = 1;

interface TDPTableProps {
  projectId: string;
  voiceDataResults: VoiceDataResults;
  modelConfigsById: GenericById<ModelConfig>;
  dataSetsById: GenericById<DataSet>;
  loading: boolean;
  getVoiceData: (options?: SearchDataRequest) => Promise<void>;
  handleVoiceDataUpdate: (updatedVoiceData: VoiceData, dataIndex: number) => void;
  deleteUnconfirmedVoiceData: (voiceDataId: string, dataIndex: number, shoudRefresh: boolean) => void;
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
    },
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: theme.shadows[1],
    },
  }));

export function TDPTable(props: TDPTableProps) {
  const {
    projectId,
    voiceDataResults,
    modelConfigsById,
    dataSetsById,
    loading,
    getVoiceData,
    deleteUnconfirmedVoiceData,
    handleVoiceDataUpdate,
    setFilterParams,
  } = props;
  const voiceData = voiceDataResults.content;
  const { translate, formatDate } = React.useContext(I18nContext);
  const { hasPermission, roles } = React.useContext(KeycloakContext);
  const { width } = useWindowSize();
  const history = useHistory();
  const [initialLoad, setInitialLoad] = React.useState(true);
  const [navigationProps, setNavigationProps] = useGlobal('navigationProps');
  const [expandedRowsByIndex, setExpandedRowsByIndex] = React.useState<BooleanById>({});
  const [voiceDataOptions, setVoiceDataOptions] = React.useState<SearchDataRequest>({});
  const [sortBy, setSortBy] = React.useState<string | undefined>();
  const [orderDirection, setOrderDirection] = React.useState<ORDER | undefined>();
  const [orderBy, setOrderBy] = React.useState<TDPTableColumns | undefined>();

  const classes = useStyles();
  const theme: CustomTheme = useTheme();

  const canRate = React.useMemo(() => hasPermission(roles, PERMISSIONS.projects.TDP), [roles]);

  const changeSort = (sortColumn: TDPTableColumns) => {
    let newOrderDirection = orderDirection;
    let newOrderBy = orderBy;
    if (orderBy === sortColumn) {
      newOrderDirection = orderDirection === ORDER.asc ? ORDER.desc : ORDER.asc;
    } else {
      newOrderDirection = ORDER.asc;
      newOrderBy = sortColumn;
    }
    const newSortBy = `${newOrderBy}.${newOrderDirection}`;
    setOrderDirection(newOrderDirection);
    setOrderBy(newOrderBy);
    setSortBy(newSortBy);
    // to close any expanded rows
    setExpandedRowsByIndex({});
  };

  const handleDelete = (voiceDataId: string, dataIndex: number) => {
    const shoudRefresh = voiceDataResults.content.length < 2;
    deleteUnconfirmedVoiceData(voiceDataId, dataIndex, shoudRefresh);
    setExpandedRowsByIndex({});
  };

  /**
   * navigates to the the editor
   * - passes required props to trigger read-only editor state
   * @param voiceData 
   */
  const handleRowClick = (voiceData: VoiceData) => {
    setNavigationProps({ voiceData, projectId });
    PATHS.editor.to && history.push(PATHS.editor.to);
  };

  const renderModelName = (cellData: CellProps<VoiceData>) => {
    const id: VoiceData['modelConfigId'] = cellData.cell.value;
    return (modelConfigsById[id] && modelConfigsById[id].name) || '';
  };

  const renderLaunchIconButton = (cellData: CellProps<VoiceData>) => {
    if (!canRate) return null;
    const voiceData = cellData.cell.row.original;
    // eslint-disable-next-line react/prop-types
    const confirmed = voiceData.status === CONTENT_STATUS.CONFIRMED;
    return (<Tooltip
      placement='top'
      title={<Typography variant='body1' >{confirmed ? translate('TDP.openToRate') : ""}</Typography>}
      arrow={true}
      open={confirmed ? undefined : false} // hide tooltip if not confirmed
    >
      <IconButton
        color='primary'
        size='medium'
        aria-label="open"
        onClick={() => handleRowClick(voiceData)}
      >
        <LaunchIcon />
      </IconButton>
    </Tooltip>);
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
      {renderLaunchIconButton(cellData)}
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
    if (loading) {
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
        accessor: TDPTableColumns['transcript'],
        Cell: (cellData: CellProps<VoiceData>) => renderTranscript(cellData),
      },
      {
        Header: translate('modelConfig.header'),
        accessor: TDPTableColumns['modelConfigId'],
        Cell: (cellData: CellProps<VoiceData>) => renderModelName(cellData),
      },
      {
        Header: translate('common.length'),
        accessor: TDPTableColumns['length'],
        Cell: (cellData: CellProps<VoiceData>) => formatSecondsDuration(cellData.cell.value),
      },
      {
        Header: translate('common.date'),
        accessor: TDPTableColumns['startAt'],
        Cell: (cellData: CellProps<VoiceData>) => renderDateTime(cellData),
      },
      {
        Header: translate('forms.status'),
        accessor: TDPTableColumns['status'],
        Cell: (cellData: CellProps<VoiceData>) => renderStatus(cellData),
      },
      {
        Header: translate('TDP.highRiskSegments'),
        accessor: TDPTableColumns['highRiskSegments'],
        Cell: (cellData: CellProps<VoiceData>) => renderHighRiskSegmentsAndExpandButton(cellData),
      },
    ],
    [voiceData, renderModelName, translate]
  );

  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    headerGroups,
    prepareRow,
    pageCount,
    gotoPage,
    flatColumns,
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
      getVoiceData({ ...voiceDataOptions, page: pageIndex, size: pageSize, 'sort-by': sortBy });
      setExpandedRowsByIndex({});
    }
  }, [getVoiceData, pageIndex, pageSize, voiceDataOptions, sortBy]);

  // Render the UI for your table
  const renderHeaderCell = (column: ColumnInstance<VoiceData>, idx: number) => {
    return (<TableCell key={`column-${idx}`} {...column.getHeaderProps()}>
      <TableSortLabel
        disabled={column.id as TDPTableColumns === TDPTableColumns.transcript}
        active={orderBy === column.id as TDPTableColumns}
        direction={orderDirection}
        onClick={() => changeSort(column.id as TDPTableColumns)}
        IconComponent={ArrowDropDownIcon}
      >
        {column.render('Header')}
      </TableSortLabel>
    </TableCell>);
  };

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
            key={`row-${rowIndex}`}
            {...row.getRowProps()}
            className={classes.tableRow}
          >
            {row.cells.map((cell, cellIndex) => {
              const isTranscript = cell.column.id === TDPTableColumns['transcript'];
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
              onDelete={handleDelete}
              onSuccess={handleVoiceDataUpdate}
            />
          }
        </React.Fragment >
      );
    });


  return (<>
    <div className={classes.filterContainer} >
      <TDPFilters
        updateVoiceData={handleFilterUpdate}
        loading={loading}
        modelConfigsById={modelConfigsById}
        dataSetsById={dataSetsById}
      />
    </div>
    <Table {...getTableProps()} className={classes.table} >
      {renderHeader()}
      <TableBody >
        {voiceData.length ? renderRows() : (
          <TableRow>
            <TableCell align='center' colSpan={fullRowColSpan} >
              <Typography component='span' >{translate('table.noResults')}</Typography>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
    {loading && (
      <Backdrop className={classes.backdrop} open={loading}>
        <PulseLoader
          sizeUnit={"px"}
          size={25}
          color={theme.palette.primary.light}
          loading={true}
        />
      </Backdrop>
    )}
    {!!voiceData.length && <TablePagination
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
        gotoPage(newPage);
      }}
      onChangeRowsPerPage={e => {
        const numberOfRows: string = e.target.value;
        localStorage.setItem(LOCAL_STORAGE_KEYS.TDP_TABLE_ROWS_PER_PAGE, numberOfRows);
        setPageSize(Number(numberOfRows));
      }}
      labelRowsPerPage={translate('table.labelRowsPerPage')}
      labelDisplayedRows={({ from, to, count }) => translate('table.labelDisplayedRows', { from, count, to: to === -1 ? count : to })}
      ActionsComponent={(paginationProps) => Pagination({ ...paginationProps, pageCount })}
    />}
  </>
  );
}
