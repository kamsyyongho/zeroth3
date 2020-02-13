import { Typography } from '@material-ui/core';
import Chip, { ChipProps } from '@material-ui/core/Chip';
import Grid, { GridProps } from '@material-ui/core/Grid';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'reactn';

interface ChipListProps extends Omit<ChipProps, 'label'> {
  labels: string[];
  /** if we need to use the lighter primary text */
  light?: boolean;
  max?: number;
  gridProps?: GridProps;
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
      fontWeight: 'bold',
    },
  }),
);

export const ChipList = ({ labels, light, max, gridProps, ...props }: ChipListProps) => {
  const classes = useStyles();
  let displayedEllipsis = false;
  return (
    <Grid container {...gridProps} >
      {labels.map((label, index) => {
        const key = `${label}-${index}`;
        const item = (<Grid item key={key} >
          <Chip
            label={label}
            size={props.size || 'small'}
            className={light ? classes.light : classes.default}
            {...props} />
        </Grid>);
        if (!max || index < max) {
          return item;
        } else if (index >= max) {
          if (!displayedEllipsis) {
            displayedEllipsis = true;
            return <Grid item key={key} ><Typography >{'...'}</Typography></Grid>;
          } else {
            return null;
          }
        }
      })}
    </Grid>
  );
};
