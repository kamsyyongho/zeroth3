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
  openTranscriberDialog: (dataSetIndex: number) => void;
  openEvaluationDetail: (dataSetIndex: number) => void;
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
  const { dataSets, projectId, openTranscriberDialog, openEvaluationDetail } = props;
  const { translate } = React.useContext(I18nContext);
  const [setType, setSetType] = React.useState(["none"]);
  const [setTypeString, setSetTypeString] = React.useState('');
  const classes = useStyles();


  const handleTypeChange = (event: any) => {
    const { value } = event.target;
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
    let prepareSetTypeString = '';
    if(setType[0] === "none") {
      prepareSetTypeString = '';
    } else if(setType.length === 1) {
      prepareSetTypeString = setType[0];
    } else {
      prepareSetTypeString = setType[0];
      for(let i = 1; i < setType.length; i++) {
        prepareSetTypeString = prepareSetTypeString.concat(',', setType[i]);
      }
    }
    setSetTypeString(prepareSetTypeString);
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
      openEvaluationDetail={openEvaluationDetail}
      setType={setTypeString}
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
              autoWidth
              MenuProps={{ variant: "menu", getContentAnchorEl: null }}>
            <MenuItem value={"none"}>None</MenuItem>
            <MenuItem value={'TRAINING'}>Training Set</MenuItem>
            <MenuItem value={'VALIDATION'}>Validation Set</MenuItem>
            <MenuItem value={'TEST'}>Test Set</MenuItem>
          </Select>
          <Button className={classes.filterBtn} color="primary" variant="outlined" onClick={handleFilterRequest}>Filter</Button>
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
