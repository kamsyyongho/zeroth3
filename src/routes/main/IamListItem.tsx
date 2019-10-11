import Checkbox from '@material-ui/core/Checkbox';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import React from "react";
import MultipleSelect from './ExampleMultiSelect';

interface IamListItemProps {
  value: number
  checked: number[]
  handleToggle: (value: number) => () => void
  labelId: string
}

export function IamListItem({ value, checked, handleToggle, labelId }: IamListItemProps) {
  return (<ListItem key={value} role={undefined} dense button={false}>
    <ListItemIcon>
      <Checkbox edge="start" checked={checked.indexOf(value) !== -1} tabIndex={-1} inputProps={{
        'aria-labelledby': labelId
      }} onChange={handleToggle(value)} />
    </ListItemIcon>
    <MultipleSelect />
    <ListItemSecondaryAction>
      <ListItemText id={labelId} primary={`Line item ${value + 1}`} />
    </ListItemSecondaryAction>
  </ListItem>);
}

