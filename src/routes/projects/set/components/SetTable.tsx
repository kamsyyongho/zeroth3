import {Button, TableBody, TableCell, Typography} from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Select from '@material-ui/core/Select';
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../../theme';
import { DataSet, VoiceData, VoiceDataResults } from '../../../../types';
import { SetItem } from './SetItem';

const FULL_ROW_COL_SPAN = 7;

interface SetTableProps {
  dataSets: DataSet[];
  projectId: string;
  openTranscriberDialog: (dataSetIndex: number) => void;
  openRequestEvaluationDialog: (contentMsg: string, index: number) => void;
  displaySubSetInTDP: (setId: string, subSetType: string) => void;
  // openEvaluationDetail: (dataSetIndex: number) => void;
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

export function SetTable(props: SetTableProps) {
  const { dataSets, projectId, openTranscriberDialog, openRequestEvaluationDialog, displaySubSetInTDP } = props;
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
      openRequestEvaluationDialog={openRequestEvaluationDialog}
      displaySubSetInTDP={displaySubSetInTDP}
        // openEvaluationDetail={openEvaluationDetail}
    />
  </React.Fragment>));

  const renderHeader = () => (<TableHead className={classes.tableHeader}>
    <TableRow>
      <TableCell>
        {translate('SET.setName')}
      </TableCell>
      <TableCell>
        {translate('TDP.wordCount')}
      </TableCell>
      <TableCell>
        {translate('SET.highRisk')}
      </TableCell>
      <TableCell>
        {translate('SET.editProgress')}
      </TableCell>
      <TableCell>
        {translate('SET.rejected')}
      </TableCell>
      <TableCell>
        {translate('SET.transcribers')}
      </TableCell>
      <TableCell>
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
