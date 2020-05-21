import { createStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { CellProps, useTable } from 'react-table';
import { Typography } from '@material-ui/core';
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { Role, ROLES, User } from '../../../../types';
import { CheckedUsersByUserId } from '../../UsersSummary';
import { UsersCellCheckbox } from './UsersCellCheckbox';
import { UsersCellMultiSelect } from './UsersCellMultiSelect';
import { UsersCellResetPasswordButton } from './UsersCellResetPasswordButton';
import { UsersCellSubmitButton } from './UsersCellSubmitButton';
import { UsersHeaderCheckbox } from './UsersHeaderCheckbox';
import UsersTableHeaderActions from './UsersTableHeaderActions';
import { UsersCellPlainText } from './UsersCellPlainText';

const HEADER_ACTIONS = 'actions';

const useStyles = makeStyles((theme) =>
  createStyles({
    table: {
      backgroundColor: theme.palette.background.paper,
    },
  }));

export interface UsersTableProps {
  users: User[];
  roles: Role[];
  setCheckedUsers: React.Dispatch<React.SetStateAction<CheckedUsersByUserId>>;
  handleUpdateSuccess: (updatedUser: User) => void;
  onTranscriberAssign: () => void;
  usersToDelete: string[];
  confirmDelete: () => void;
  handleInviteOpen: () => void;
  deleteLoading: boolean;
}

export interface ParsedRolesById {
  [id: string]: Role;
}

export interface SelectedRoleIdsByIndex {
  [index: number]: string[];
}

export interface PhoneAndNoteLog {
  [index: number]: string;
}
export function UsersTable(props: UsersTableProps) {
  const {
    users,
    roles,
    setCheckedUsers,
    handleUpdateSuccess,
    onTranscriberAssign,
    usersToDelete,
    confirmDelete,
    handleInviteOpen,
    deleteLoading,
  } = props;

  const classes = useStyles();

  // used in the multi-select to quicly access the role by id 
  const parsedRolesById: ParsedRolesById = {};
  roles.forEach(role => parsedRolesById[role.id] = role);

  // used to determine if the transcriber role has
  // changed so we can refetch the transcriber list
  const transcriberRoleId = React.useMemo(() => {
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      if (role.name === ROLES.transcriber) {
        return role.id;
      }
    }
    return '';
  }, []);

  const { translate, language } = React.useContext(I18nContext);
  const [allChecked, setAllChecked] = React.useState(false);
  const [selectedRoles, setSelectedRoles] = React.useState<SelectedRoleIdsByIndex>({});
  const [noteLog, setNoteLog] = React.useState<PhoneAndNoteLog>({});
  const [phoneLog, setPhoneLog] = React.useState<PhoneAndNoteLog>({});

  const handleUserCheck = (userId: string, value: boolean): void => {
    setCheckedUsers((prevCheckedUsers) => {
      return { ...prevCheckedUsers, [userId]: value };
    });
  };

  const handleRoleCheck = (userIndex: number, value: string[]): void => {
    setSelectedRoles((prevSelectedRoles) => {
      return { ...prevSelectedRoles, [userIndex]: value };
    });
  };

  const onUpdateRoleSuccess = (updatedUser: User, userIndex: number): void => {
    handleUpdateSuccess(updatedUser);
    const currentRoles = updatedUser.roles.map(role => role.id);
    setSelectedRoles((prevSelectedRoles) => {
      return { ...prevSelectedRoles, [userIndex]: currentRoles };
    });
  };

  const onUpdatePhoneAndNoteSuccess = (updatedUser: User, userIndex: string): void => {
   handleUpdateSuccess(updatedUser);
    const currentNoteLog = noteLog;
    const currentPhoneLog = phoneLog;
    const note = updatedUser.note;
    const phone = updatedUser.phone;
    if(currentNoteLog) delete currentNoteLog[userIndex];
    if(currentPhoneLog)  delete currentPhoneLog[userIndex];
    setNoteLog({...currentNoteLog, [userIndex]: note })
    setPhoneLog({ ...currentPhoneLog, [userIndex]: phone })
  };

  const onChangeNote = (value: string, index: number) => {
    const currentNoteLog = noteLog;
    const checkValueNull = value.length ? value : null;
    setNoteLog({...currentNoteLog, [index]: checkValueNull});
  };
  
  const onChangePhone = (value: string, index: number) => {
    const currentPhoneLog = phoneLog;
    const checkValueNull = value.length ? value : null;
    setPhoneLog({...currentPhoneLog, [index]: checkValueNull});
  };


  React.useEffect(() => {
    let note = {}
    let phone = {}
    users.forEach((user: User, index: number) => {
      Object.assign(note, {[index]: user.note});
      Object.assign(phone, {[index]: user.phone});
    })
    setNoteLog(note);
    setPhoneLog(phone);
  }, users)
  // define the logic and what the columns should render
  const columns = React.useMemo(
    () => [
      {
        Header: <UsersHeaderCheckbox onCheck={setAllChecked} disabled={users.length < 2} />,
        accessor: 'email',
        Cell: (data: CellProps<User>) => UsersCellCheckbox({ cellData: data, onUserCheck: handleUserCheck, allChecked }),
      },
      {
        Header: `${translate("forms.name")}`,
        accessor: 'firstName',
        Cell: (data: CellProps<User>) => UsersCellPlainText({ cellData: data }),
      },
      {
        Header: `${translate("forms.phone")}`,
        accessor: 'phone',
        Cell: (data: CellProps<User>) => UsersCellPlainText({ cellData: data, onChange: onChangePhone, noteOrPhoneValue: phoneLog } ),
      },
      {
        Header: `${translate("TDP.memo")}`,
        accessor: 'note',
        Cell: (data: CellProps<User>) => UsersCellPlainText({ cellData: data, onChange: onChangeNote, noteOrPhoneValue: noteLog }),
      },
      {
        Header: `${translate("IAM.roles")}`,
        accessor: 'roles',
        Cell: (data: CellProps<User>) => UsersCellMultiSelect({ cellData: data, availableRoles: roles, parsedRolesById, onRoleCheck: handleRoleCheck, selectedRoles }),
      },
      {
        id: 'submit',
        Header: null,
        accessor: (row: User) => row,
        Cell: (data: CellProps<User>) => UsersCellSubmitButton({ 
          cellData: data,
          selectedRoles,
          onUpdateRoleSuccess,
          transcriberRoleId,
          onTranscriberAssign,
          noteLog,
          phoneLog,
          onUpdateNoteAndPhone: onUpdatePhoneAndNoteSuccess,
        }),
      },
      {
        id: HEADER_ACTIONS,
        Header: null,
        accessor: (row: User) => row,
        Cell: (data: CellProps<User>) => UsersCellResetPasswordButton({ cellData: data }),
      },
    ],
    [users, roles, language, allChecked, selectedRoles, noteLog, phoneLog]
  );

  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable<User>({
    columns,
    data: users,
  });

  // Render the UI for your table
  const renderHeader = () => headerGroups.map((headerGroup, index) => (
    <TableRow key={`headerGroup-${index}`} {...headerGroup.getHeaderGroupProps()}>
      {headerGroup.headers.map((column, idx) => {
        if (column.id === HEADER_ACTIONS) {
          return (<TableCell key={`column-${idx}`} {...column.getHeaderProps()}>
            <UsersTableHeaderActions
              users={users}
              usersToDelete={usersToDelete}
              confirmDelete={confirmDelete}
              handleInviteOpen={handleInviteOpen}
              deleteLoading={deleteLoading}
            />
          </TableCell>);
        } else {
          return (<TableCell key={`column-${idx}`} {...column.getHeaderProps()}>
            {column.render('Header')}
          </TableCell>);
        }
      })}
    </TableRow>
  ));

  const renderRows = () => rows.map(
    (row, rowIndex) => {
      prepareRow(row);
      return (
        <TableRow key={`row-${rowIndex}`} {...row.getRowProps()}>
          {row.cells.map((cell, cellIndex) => {
            return (
              <TableCell key={`cell-${cellIndex}`} {...cell.getCellProps()}>
                {cell.render('Cell')}
              </TableCell>
            );
          })}
        </TableRow>
      );
    });

  return (
    <Table stickyHeader {...getTableProps()} className={classes.table} >
      <TableHead>
        {renderHeader()}
      </TableHead>
      <TableBody>
        {renderRows()}
      </TableBody>
    </Table>
  );
}



