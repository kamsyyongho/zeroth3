import { Chip } from '@material-ui/core';
import React from 'react';

interface ChipListProps {
  values: string[]
}

export const ChipList = ({ values }: ChipListProps) => {
  return (
    <>
      {values.map(value => (
        <Chip key={value} label={value} style={{ margin: 2 }} />
      ))}
    </>
  )
}
