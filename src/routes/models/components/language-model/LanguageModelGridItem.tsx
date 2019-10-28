import { CardHeader, Grid } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { LanguageModel } from '../../../../types';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    card: {
      minWidth: 275,
    },
    text: {
      overflowWrap: 'break-word'
    }
  }),
);

interface LanguageModelGridItemProps {
  model: LanguageModel
}

export function LanguageModelGridItem(props: LanguageModelGridItemProps) {
  const { model } = props;
  const classes = useStyles();
  return (<Grid item xs key={model.id}>
    <Card className={classes.card}>
      <CardHeader title={model.name} className={classes.text} />
      <CardActionArea>
        <CardContent>
          <Typography gutterBottom color="textSecondary" className={classes.text}>
            {model.version}
          </Typography>
          <Typography component="p">
            {model.sampleRate}{' kHz'}
          </Typography>
          <Typography gutterBottom variant="body1" color="textPrimary" className={classes.text} >
            {model.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  </Grid>);
};