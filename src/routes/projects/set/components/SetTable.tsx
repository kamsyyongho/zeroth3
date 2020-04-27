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
import { DataSet } from '../../../../types';
import { SetItem } from './SetItem';

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
    formControl: {
      margin: theme.spacing(1),
      minWidth: 150,
    },
  }));

export function SetTable(props: SetTableProps) {
  const { dataSets, projectId, openTranscriberDialog } = props;
  const { translate } = React.useContext(I18nContext);
  const [setType, setSetType] = React.useState(["none"]);

  const classes = useStyles();

  const handleTypeChange = (event: any) => {
    const { value } = event.target;
    console.log('event in handleTypeChange : ', event.target.value);
    if(value.length === 1 && event.target.value.includes("none")) {
      setSetType(["none"]);
    } else if(value[value.length - 1] === "none") {
      setSetType(["none"]);
    } else {
      setSetType(value.filter((value: string ) => {
        return value !== "none"
      }));
    }
  };

  const handleFilterRequest = () => {

  };

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
        <FormControl className={classes.formControl}>
          <InputLabel id="set-type-label">Filter By Set Type</InputLabel>
          <Select
              labelId="set-type-label"
              id="demo-simple-select-autowidth"
              label="Set Type"
              className={classes.formControl}
              value={setType}
              onChange={handleTypeChange}
              multiple={true}
              autoWidth>
            <MenuItem value={"none"}>None</MenuItem>
            <MenuItem value={'10'}>Training Set</MenuItem>
            <MenuItem value={'20'}>Validation Set</MenuItem>
            <MenuItem value={'30'}>Test Set</MenuItem>
          </Select>
          <Button onClick={handleFilterRequest}>Filter</Button>
        </FormControl>
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
