import List from '@material-ui/core/List';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import React from 'react';
import { IamListItem } from './IamListItem';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      // maxWidth: 600,
      backgroundColor: theme.palette.background.paper,
    },
  }),
);

export default function CheckboxList() {
  const classes = useStyles();
  const [checked, setChecked] = React.useState([0]);

  const handleToggle = (value: number) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  return (
    <List className={classes.root}>
      {[0, 1, 2, 3].map(value => {
        const labelId = `checkbox-list-label-${value}`;
        return (
          <IamListItem key={labelId} checked={checked} value={value} handleToggle={handleToggle} labelId={labelId} />
        );
      })}
    </List>
  );
}