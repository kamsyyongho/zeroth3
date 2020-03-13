import { Button, Grid } from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'reactn';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { DataSet } from '../../../types';

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      minHeight: '100vh',
    },
    select: {
      minWidth: 150,
    },
  }),
);
interface EditorFetchButtonProps {
  onClick: (dataSetId?: string) => void;
  dataSets?: DataSet[];
}

export function EditorFetchButton(props: EditorFetchButtonProps) {
  const { onClick, dataSets } = props;
  const { translate } = React.useContext(I18nContext);
  const [selectedDataSetId, setSelectedDataSetId] = React.useState('');
  const classes = useStyles();

  const handleFetch = () => {
    onClick(selectedDataSetId || undefined);
  };

  const handleChange = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown; }>) => {
    setSelectedDataSetId(event.target.value as string);
  };

  const selectInput = React.useMemo(() => {
    if (!dataSets?.length) return null;
    const menuItems = dataSets.map((dataSet) => <MenuItem key={dataSet.id} value={dataSet.id}>{dataSet.name}</MenuItem>);

    return (
      <FormControl >
        <InputLabel htmlFor="fetch-select">{translate('SET.dataSet')}</InputLabel>
        <Select
          value={selectedDataSetId}
          onChange={handleChange}
          className={classes.select}
        >
          <MenuItem value="">
            <em>{translate('forms.all')}</em>
          </MenuItem>
          {menuItems}
        </Select>
      </FormControl>
    );
  }, [dataSets, selectedDataSetId]);

  return (<Grid
    container
    spacing={2}
    direction="column"
    alignItems="center"
    justify="center"
    alignContent='center'
    className={classes.root}
  >
    <Grid item xs={6}>
      {selectInput}
    </Grid>
    <Grid item xs={6}>
      <Button
        variant='contained'
        color='primary'
        onClick={handleFetch}
      >
        {translate('editor.fetch')}
      </Button>
    </Grid>
  </Grid>);
}
