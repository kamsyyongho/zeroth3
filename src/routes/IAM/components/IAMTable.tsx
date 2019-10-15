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
import { IAMHeaderCheckbox } from './IAMHeaderCheckbox'

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IAMTableProps {
  users: User[]
  roles: Role[]
}

export interface CheckedEmails {
  [index: number]: boolean
}

export interface ParsedRolesById {
  [index: number]: Role
}

export function IAMTable(props: IAMTableProps) {
  const { users, roles } = props;

  // used in the multi-select to quicly access the role by id 
  const parsedRolesById: ParsedRolesById = {}
  roles.forEach(role => parsedRolesById[role.id] = role)

  // const users = [
  //   { id: 5, email: "asdasd", roles: [{ id: 1, name: "root" }] },
  //   { id: 5, email: "asdasd", roles: [{ id: 1, name: "root" }] },
  //   { id: 5, email: "asdasd", roles: [{ id: 1, name: "root" }] },
  // ]

  const { translate, language } = React.useContext(I18nContext);
  const [allChecked, setAllChecked] = React.useState(false)
  const [checkedEmails, setCheckedEmails] = React.useState<CheckedEmails>({});

  const handleEmailCheck = (emailIndex: number, value: boolean): void => {
    setCheckedEmails((prevCheckedEmails) => {
      return { [emailIndex]: value, ...prevCheckedEmails }
    })
  }

  const columns = React.useMemo(
    () => [
      {
        Header: <IAMHeaderCheckbox onCheck={setAllChecked} />,
        accessor: 'email',
        Cell: (data: CellProps<User>) => IAMCellCheckbox(data, handleEmailCheck),
      },
      {
        Header: `${translate("IAM.roles")}`,
        accessor: "roles",
        Cell: (data: CellProps<User>) => IAMCellMultiSelect(data, roles, parsedRolesById),
      },
      {
        Header: 'Last activity',
        accessor: 'lastActivity',
      },
    ],
    [users, roles, language]

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



