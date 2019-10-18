import { Grid } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { Project } from '../../../types';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      overflow: 'hidden',
      backgroundColor: theme.palette.background.paper,
    },
    gridList: {
      width: 500,
      height: 450,
    },
    icon: {
      color: 'rgba(255, 255, 255, 0.54)',
    },
    card: {
      minWidth: 275,
    },
    bullet: {
      display: 'inline-block',
      margin: '0 2px',
      transform: 'scale(0.8)',
    },
    pos: {
      marginBottom: 12,
    },
  }),
);

interface ProjectGridListProps {
  projects: Project[]
}

export function ProjectGridList(props: ProjectGridListProps) {
  const { projects } = props;
  const classes = useStyles();

  return (
    <Grid container spacing={2} >
      {projects.map(project => (
        <Grid item md={3} key={project.id}>
          <Card className={classes.card}>
            <CardActionArea>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {project.name}
                </Typography>
                <Typography gutterBottom color="textPrimary">
                  {project.apiKey}
                </Typography>
                <Typography gutterBottom color="textSecondary">
                  {project.apiSecret}
                </Typography>
                <Typography variant="body1" component="p">
                  {project.thresholdHc}
                </Typography>
                <Typography variant="body1" component="p">
                  {project.thresholdLc}
                </Typography>
                <Typography variant="body2" gutterBottom component="p">
                  {new Date(project.validFrom).toDateString()}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
