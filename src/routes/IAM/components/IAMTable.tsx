import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import React from 'react'
import { CellProps, useTable } from 'react-table'
import { I18nContext } from '../../../hooks/i18n/I18nContext'
import { Role, User } from "../../../types"
import { IAMCellCheckbox } from './IAMCellCheckbox'
import { IAMCellMultiSelect } from './IAMCellMultiSelect'
import { IAMCellSubmitButton } from './IAMCellSubmitButton'
import { IAMHeaderCheckbox } from './IAMHeaderCheckbox'

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IAMTableProps {
  users: User[]
  roles: Role[]
}

export interface CheckedEmailsByIndex {
  [index: number]: boolean
}

export interface ParsedRolesById {
  [id: number]: Role
}

export interface SelectedRoleIdsByIndex {
  [index: number]: number[]
}

export function IAMTable(props: IAMTableProps) {
  const { users, roles } = props;

  // used in the multi-select to quicly access the role by id 
  const parsedRolesById: ParsedRolesById = {}
  roles.forEach(role => parsedRolesById[role.id] = role)

  const { translate, language } = React.useContext(I18nContext);
  const [allChecked, setAllChecked] = React.useState(false)
  const [checkedEmails, setCheckedEmails] = React.useState<CheckedEmailsByIndex>({});
  const [selectedRoles, setSelectedRoles] = React.useState<SelectedRoleIdsByIndex>({});

  const handleEmailCheck = (userIndex: number, value: boolean): void => {
    setCheckedEmails((prevCheckedEmails) => {
      return { ...prevCheckedEmails, [userIndex]: value }
    })
  }

  const handleRoleCheck = (userIndex: number, value: number[]): void => {
    setSelectedRoles((prevSelectedRoles) => {
      return { ...prevSelectedRoles, [userIndex]: value }
    })
  }

  // define the logic and what the columns should render
  const columns = React.useMemo(
    () => [
      {
        Header: <IAMHeaderCheckbox onCheck={setAllChecked} />,
        accessor: 'email',
        Cell: (data: CellProps<User>) => IAMCellCheckbox({ cellData: data, onEmailCheck: handleEmailCheck, allChecked }),
      },
      {
        Header: `${translate("IAM.roles")}`,
        accessor: 'roles',
        Cell: (data: CellProps<User>) => IAMCellMultiSelect({ cellData: data, availableRoles: roles, parsedRolesById, onRoleCheck: handleRoleCheck, selectedRoles }),
      },
      {
        Header: ' ',
        accessor: (row: User) => row,
        Cell: (data: CellProps<User>) => IAMCellSubmitButton({ cellData: data, selectedRoles }),
      },
    ],
    [users, roles, language, allChecked, selectedRoles]
  )

  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable<User>({
    columns,
    data: users,
  })


  // Render the UI for your table
  return (
    <Table stickyHeader {...getTableProps()}>
      <TableHead>
        {headerGroups.map((headerGroup, index) => (
          <TableRow key={`headerGroup-${index}`} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column, idx) => (
              <TableCell key={`column-${idx}`} {...column.getHeaderProps()}>
                {column.render('Header')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody>
        {rows.map(
          (row, rowIndex) => {
            prepareRow(row);
            return (
              <TableRow key={`row-${rowIndex}`} {...row.getRowProps()}>
                {row.cells.map((cell, cellIndex) => {
                  return (
                    <TableCell key={`cell-${cellIndex}`} {...cell.getCellProps()}>
                      {cell.render('Cell')}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
      </TableBody>
    </Table>
  )
}



