import { FormControlLabel, FormGroup, TableCell, Typography } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import TableRow from '@material-ui/core/TableRow';
import React from 'reactn';
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
        backgroundColor: theme.table.highlight,
      }
    },
    selected: {
      "&:hover": { // to keep the color consistant when selected
        backgroundColor: theme.table.highlight,
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
      <TableCell
        onClick={onClick}
      >
        <FormGroup
          row
          onClick={onClick}
        >
          <FormControlLabel
            onClick={onClick}
            control={
              <Checkbox
                checked={selected}
                onClick={onClick}
                value={transcriber.id}
                color="primary"
              />
            }
            label={transcriber.email}
          />
        </FormGroup>
      </TableCell>
      <TableCell>
        <Typography align='center'>{transcriber.count}</Typography>
      </TableCell>
      <TableCell align='center'>
        <RatingDisplay rating={transcriber.rating} />
      </TableCell>
    </TableRow>
  );
};