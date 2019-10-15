import { FormControlLabel } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import React from 'react';
import { CellProps } from 'react-table';
import { User } from '../../../types';


export function IAMCellCheckbox(cellData: CellProps<User>, onEmailCheck: (index: number, value: boolean) => void) {
  const [isChecked, setIsChecked] = React.useState(false)
  const email: User["email"] = cellData.cell.value;
  const index = cellData.cell.row.index;
  const key = `${index}-email:${email}`;
  return <FormControlLabel
    key={key}
    control={
      <Checkbox
        checked={isChecked}
        value="checkedB"
        color="primary"
        onChange={(event) => {
          onEmailCheck(index, event.target.checked)
          setIsChecked(event.target.checked)
        }}
      />
    }
    label={email}
  />
}

