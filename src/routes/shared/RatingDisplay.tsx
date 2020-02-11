import orange from '@material-ui/core/colors/orange';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import StarHalfIcon from '@material-ui/icons/StarHalf';
import React from "reactn";
import { roundHalf } from '../../util/misc';


const useStyles = makeStyles(theme =>
  createStyles({
    icon: {
      color: orange[500],
    }
  }));

interface RatingDisplayProps {
  rating: number;
  small?: boolean;
}

export function RatingDisplay(props: RatingDisplayProps) {
  const { rating, small } = props;
  const classes = useStyles();

  const roundedRating = roundHalf(rating);

  // to split our float into usable values
  const [fullStarsString, halfStarString] = String(roundedRating).split('.');

  const fullStarsNumber = parseInt(fullStarsString);
  const halfStarNumber = parseInt(halfStarString);

  const stars: JSX.Element[] = [];

  // add the full stars
  for (let i = 0; i < fullStarsNumber; i++) {
    stars.push(<StarIcon fontSize={small ? 'small' : undefined} key={`full-${i}`} className={classes.icon} />);
  }

  // add a half star if needed
  if (halfStarNumber) {
    stars.push(<StarHalfIcon fontSize={small ? 'small' : undefined} key={`half`} className={classes.icon} />);
  }

  // fill the rest of the space
  for (let i = stars.length; i < 5; i++) {
    stars.push(<StarBorderIcon fontSize={small ? 'small' : undefined} key={`empty-${i}`} className={classes.icon} />);
  }

  return (
    <Grid container wrap='nowrap' justify='center' >{stars}</Grid>
  );
}
