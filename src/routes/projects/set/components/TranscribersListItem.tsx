import { TableCell, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import TableRow from '@material-ui/core/TableRow';
import React from 'react';
import { CustomTheme } from '../../../../theme/index';
import { TranscriberStats } from '../../../../types';
import { RatingDisplay } from '../../../shared/RatingDisplay';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    clickableTableBody: {
      cursor: 'pointer',
    },
    default: {
      "&:hover": { // default hover color
        backgroundColor: theme.palette.grey[100],
      }
    },
    selected: {
      backgroundColor: theme.status.selected,
      "&:hover": { // to keep the color consistant when selected
        backgroundColor: theme.status.selected,
      }
    },
  }),
);

interface TranscribersListItemProps {
  transcriber: TranscriberStats;
  selected: boolean;
  onItemClick: (transcriberId: string) => void;
}


export function TranscribersListItem(props: TranscribersListItemProps) {
  const {
    transcriber,
    selected,
    onItemClick,
  } = props;
  const classes = useStyles();

  const onClick = () => onItemClick(transcriber.id);

  return (
    <TableRow
      className={`${classes.clickableTableBody} ${selected ? classes.selected : classes.default}`}
      onClick={onClick}
    >
      <TableCell>
        <Typography>{transcriber.email}</Typography>
      </TableCell>
      <TableCell>
        <Typography align='center'>{transcriber.count}</Typography>
      </TableCell>
      <TableCell>
        <RatingDisplay rating={transcriber.rating} />
      </TableCell>
    </TableRow>
  );
};