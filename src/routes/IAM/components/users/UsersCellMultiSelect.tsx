import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { CellProps } from 'react-table';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { Role, User } from '../../../../types';
import { ParsedRolesById, SelectedRoleIdsByIndex } from './UsersTable';

const useStyles = makeStyles((theme) =>
  createStyles({
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120,
      maxWidth: 300,
    },
  }),
);


interface UsersCellMultiSelectProps {
  cellData: CellProps<User>;
  availableRoles: Role[];
  parsedRolesById: ParsedRolesById;
  selectedRoles: SelectedRoleIdsByIndex;
  onRoleCheck: (userIndex: number, value: string[]) => void;
}

export function UsersCellMultiSelect(props: UsersCellMultiSelectProps) {
  const { cellData, availableRoles, selectedRoles, parsedRolesById, onRoleCheck } = props;
  const { translate } = React.useContext(I18nContext);

  const userRoles: User["roles"] = cellData.cell.value;
  const index = cellData.cell.row.index;
  const key = `${index}-roles`;

  const initialSelectedRoleIds: string[] = React.useMemo(
    () => {
      if (!userRoles.length) {
        return [];
      }
      return userRoles.map(role => role.id);
    }, []);

  let defaultState: string[] | undefined;
  if (selectedRoles[index] && selectedRoles[index] instanceof Array) {
    defaultState = selectedRoles[index];
  }

  const classes = useStyles();

  const [userselectedRoles, setUserSelectedRoles] = React.useState<string[]>(defaultState || initialSelectedRoleIds);

  const joinSelectedText = (selected: string[]) => {
    const selectedRoleNames: string[] = (selected).map(selectedId => (parsedRolesById[selectedId] && parsedRolesById[selectedId].name) || "");
    return selectedRoleNames.join(', ');
  };

  const handleChange = (event: React.ChangeEvent<{ value: unknown; }>) => {
    const value = event.target.value as string[];
    setUserSelectedRoles(value);
  };

  const handleClose = (event: React.ChangeEvent<{}>) => {
    onRoleCheck(index, userselectedRoles);
  };

  const renderMenuItems = () => {
    return availableRoles.map(role => {
      const { id, name } = role;
      return (
        <MenuItem key={id} value={id}>
          <Checkbox color='primary' checked={userselectedRoles.includes(id)} />
          <ListItemText primary={name} />
        </MenuItem>
      );
    });
  };

  return (
    <FormControl className={classes.formControl} key={key} >
      <InputLabel htmlFor="select-multiple-checkbox">{translate("IAM.roles")}</InputLabel>
      <Select
        multiple
        value={userselectedRoles}
        onChange={handleChange}
        onClose={handleClose}
        renderValue={(selected) => joinSelectedText(selected as string[])}
      >
        {renderMenuItems()}
      </Select>
    </FormControl>
  );
}