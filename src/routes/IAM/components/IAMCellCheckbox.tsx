import { FormControlLabel } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import React from 'react';
import { CellProps } from 'react-table';
import { User } from '../../../types';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface IAMCellCheckboxProps {
  cellData: CellProps<User>
  onEmailCheck: (index: number, value: boolean) => void
  allChecked: boolean
}

export function IAMCellCheckbox(props: IAMCellCheckboxProps) {
  const { cellData, onEmailCheck, allChecked } = props;
  const [isChecked, setIsChecked] = React.useState(false);

  const handleCheck = (index: number, value: boolean) => {
    onEmailCheck(index, value);
    setIsChecked(value);
  }
  const email: User["email"] = cellData.cell.value;
  const index = cellData.cell.row.index;
  const key = `${index}-email:${email}`;

  React.useEffect(() => {
    if (allChecked) {
      handleCheck(index, true)
    }
  }, [allChecked])

  return <FormControlLabel
    key={key}
    control={
      <Checkbox
        checked={isChecked}
        value="checkedB"
        color="primary"
        onChange={(event) => handleCheck(index, event.target.checked)}
      />
    }
    label={email}
  />
}

