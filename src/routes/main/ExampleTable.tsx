import { FormControlLabel } from '@material-ui/core'
import Checkbox from '@material-ui/core/Checkbox'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import React from 'react'
import { useTable } from 'react-table'


export function ExampleTable() {
  const data = [{ "user": "hall", "role": 17, "lastActivity": 0 }, { "user": "video", "role": 13, "lastActivity": 16 }, { "user": "depression", "role": 1, "lastActivity": 27 }, { "user": "outcome", "role": 17, "lastActivity": 82 }, { "user": "construction", "role": 6, "lastActivity": 23 }, { "user": "outcome", "role": 6, "lastActivity": 95 }, { "user": "sack", "role": 16, "lastActivity": 54 }, { "user": "teeth", "role": 11, "lastActivity": 71 }, { "user": "floor", "role": 10, "lastActivity": 83 }, { "user": "newspaper", "role": 3, "lastActivity": 79 }, { "user": "offer", "role": 29, "lastActivity": 6 }, { "user": "whistle", "role": 1, "lastActivity": 76 }, { "user": "island", "role": 10, "lastActivity": 19 }, { "user": "ring", "role": 24, "lastActivity": 70 }, { "user": "percentage", "role": 29, "lastActivity": 93 }, { "user": "note", "role": 24, "lastActivity": 88 }, { "user": "movie", "role": 16, "lastActivity": 36 }, { "user": "role", "role": 17, "lastActivity": 90 }, { "user": "air", "role": 18, "lastActivity": 78 }, { "user": "grain", "role": 0, "lastActivity": 51 }]

  const columns: any = React.useMemo(
    () => [
      {
        Header: <FormControlLabel
          control={
            <Checkbox
              checked={true}
              value="checkedB"
              color="primary"
            />
          }
          label="User"
        />,
        accessor: 'user'
      },
      {
        Header: 'Role',
        accessor: 'role',
      },
      {
        Header: 'Last activity',
        accessor: 'lastActivity',
      },
    ],
    []
  )
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data,
    loading: false,
  })

  console.log({
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
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
          (row, i) =>
            prepareRow(row) || (
              <TableRow {...row.getRowProps()}>
                {row.cells.map((cell, index) => {
                  console.log(index, cell)
                  console.log(index, cell.getCellProps())
                  console.log(index, cell.column.id)
                  return (
                    <TableCell key={`cell-${index}`} {...cell.getCellProps()}>
                      {cell.render('Cell')}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
        )}
      </TableBody>
    </Table>
  )
}



