import { CardHeader, Grid } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { AcousticModel } from '../../../../types/models.types';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    card: {
      minWidth: 275,
    },
  }),
);

interface AcousticModelGridItemProps {
  model: AcousticModel
}

export function AcousticModelGridItem(props: AcousticModelGridItemProps) {
  const { model } = props;
  const classes = useStyles();
  return (<Grid item md={3} key={model.id}>
    <Card className={classes.card}>
      <CardHeader title={model.name} />
      <CardActionArea>
        <CardContent>
          <Typography gutterBottom color="textPrimary">
            {model.description}
          </Typography>
          <Typography gutterBottom color="textSecondary">
            {model.version}
          </Typography>
          <Typography variant="body1" component="p">
            {model.sampleRate}{' kHz'}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  </Grid>);
};