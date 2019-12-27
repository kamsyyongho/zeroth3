import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import SearchIcon from '@material-ui/icons/Search';
import matchSorter from 'match-sorter';
import { ICONS } from '../../theme/icons';
import React from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    margin: {
      margin: theme.spacing(1),
    },
  }),
);


interface SearchBarProps {
  list: unknown[];
  /** the object keys to search */
  keys: string[];
  onSearch: (filteredList: any[], searching: boolean) => void;
}

export const SearchBar = (props: SearchBarProps) => {
  const { list, keys, onSearch } = props;
  const [value, setValue] = React.useState('');

  const classes = useStyles();

  const handleChange = (event: React.ChangeEvent<{ value: unknown; }>) => {
    const value = event.target.value as string;
    setValue(value);
    const results = matchSorter(list, value, { keys });
    onSearch(results, !!value.length);
  };

  const clearSearch = () => {
    setValue('');
    onSearch(list, false);
  };

  return (
    <TextField
      className={classes.margin}
      id="search-bar"
      fullWidth
      onChange={handleChange}
      value={value}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <ICONS.Search color='primary' fontSize='small' />
          </InputAdornment>
        ),
        endAdornment: (value.length ? <InputAdornment position="start">
          <IconButton
            color='secondary'
            aria-label="clear-search"
            onClick={clearSearch}
          >
            <HighlightOffIcon />
          </IconButton>
        </InputAdornment> : null)
      }}
    />
  );
};