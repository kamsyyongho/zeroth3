import Chip, { ChipProps } from '@material-ui/core/Chip';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'react';

interface ChipListProps extends ChipProps {
  values: string[];
  /** if we need to use the lighter primary text */
  light?: boolean;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    default: {
      margin: 2,
    },
    light: {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
      margin: 2,
    },
  }),
);

export const ChipList = ({ values, light, ...props }: ChipListProps) => {
  const classes = useStyles();
  return (
    <>
      {values.map(value => (
        <Chip
        key={value}
        label={value}
        className={light ? classes.light : classes.default}
        {...props} />
      ))}
    </>
  );
};
