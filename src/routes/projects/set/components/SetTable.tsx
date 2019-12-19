import { TableBody, TableCell, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import React from 'react';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../../theme';
import { DataSet } from '../../../../types';
import { SetItem } from './SetItem';

const FULL_ROW_COL_SPAN = 3;

interface SetTableProps {
  dataSets: DataSet[];
  openTranscriberDialog: (dataSetToEdit: DataSet, dataSetIndex: number) => void;
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
  }));

export function SetTable(props: SetTableProps) {
  const { dataSets, openTranscriberDialog } = props;
  const { translate } = React.useContext(I18nContext);

  const classes = useStyles();

  const renderRowFiller = (<TableRow >
    <TableCell colSpan={FULL_ROW_COL_SPAN} className={classes.tableFiller} />
  </TableRow>);

  const renderSets = () => dataSets.map((dataSet, index) => (<React.Fragment
    key={dataSet.id}
  >
    {index > 0 && renderRowFiller}
    <SetItem
      dataSet={dataSet}
      dataSetIndex={index}
      openTranscriberDialog={openTranscriberDialog}
    />
  </React.Fragment>));

  const renderHeader = () => (<TableHead className={classes.tableHeader}>
    <TableRow>
      <TableCell>
        {translate('forms.name')}
      </TableCell>
      <TableCell>
        {translate('common.progress')}
      </TableCell>
      <TableCell>
        {translate('IAM.transcribers')}
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
        {(!dataSets.length) ? renderNoResults() : renderSets()}
      </TableBody>
    </Table>
  );
}
