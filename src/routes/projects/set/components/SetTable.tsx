import {Button, TableBody, TableCell, Typography} from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../../theme';
import { DataSet } from '../../../../types';
import { SetItem } from './SetItem';
import BorderColorIcon from "@material-ui/icons/BorderColor";

const FULL_ROW_COL_SPAN = 4;

interface SetTableProps {
  dataSets: DataSet[];
  projectId: string;
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
  const { dataSets, projectId, openTranscriberDialog } = props;
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
      projectId={projectId}
      dataSet={dataSet}
      dataSetIndex={index}
      openTranscriberDialog={openTranscriberDialog}
    />
  </React.Fragment>));

  const handleEvaluateClick = () => {};


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
      <TableCell>
          <Button
              color='secondary'
              variant='contained'
              size='small'
              onClick={handleEvaluateClick}
              startIcon={<BorderColorIcon />}
          >
            {translate('SET.requestEvaluation')}
          </Button>
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
