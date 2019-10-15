import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import React from 'react';
import { CellProps } from 'react-table';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { Role, User } from '../../../types';
import { ParsedRolesById } from './IAMTable';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120,
      maxWidth: 300,
    },
    chips: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    chip: {
      margin: 2,
    },
    noLabel: {
      marginTop: theme.spacing(3),
    },
  }),
);

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};


function getStyles(name: string, selectedRoles: string[], theme: Theme) {
  return {
    fontWeight:
      selectedRoles.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}


export function IAMCellMultiSelect(cellData: CellProps<User>, availableRoles: Role[], parsedRolesById: ParsedRolesById) {
  const { translate } = React.useContext(I18nContext);
  const userRoles: User["roles"] = cellData.cell.value;

  const initialSelectedRoleIds: number[] = React.useMemo(
    () => {
      if (!userRoles.length) {
        return []
      }
      return userRoles.map(role => role.id);
    }, [userRoles])

  const classes = useStyles();
  const theme = useTheme();
  const [selectedRoles, setSelectedRoles] = React.useState<number[]>(initialSelectedRoleIds);

  const joinSelectedText = (selected: number[]) => {
    const selectedRoleNames: string[] = (selected).map(selectedId => (parsedRolesById[selectedId] && parsedRolesById[selectedId].name) || "")
    return selectedRoleNames.join(', ')
  }

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedRoles(event.target.value as number[]);
  };

  return (
    <FormControl className={classes.formControl}>
      <InputLabel htmlFor="select-multiple-checkbox">{translate("IAM.roles")}</InputLabel>
      <Select
        multiple
        value={selectedRoles}
        onChange={handleChange}
        input={<Input id="select-multiple-checkbox" />}
        renderValue={(selected) => joinSelectedText(selected as number[])}
        MenuProps={MenuProps}
      >
        {availableRoles.map(role => {
          const { id, name } = role;
          return (
            <MenuItem key={id} value={id}>
              <Checkbox checked={selectedRoles.includes(id)} />
              <ListItemText primary={name} />
            </MenuItem>
          )
        })}
      </Select>
    </FormControl>
  );
}