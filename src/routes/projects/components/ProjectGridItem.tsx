import { CardHeader, Grid } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import EditIcon from '@material-ui/icons/Edit';
import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS, Project } from '../../../types';
import { CheckedProjectsById } from '../Projects';
import { ProjectDialog } from './ProjectDialog';
import { EditOpenByProjectId } from './ProjectGridList';

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

interface ProjectGridItemProps {
  project: Project;
  checkedProjects: CheckedProjectsById;
  editOpen: EditOpenByProjectId;
  handleEditOpen: (projectId: number) => void;
  handleEditClose: (projectId: number) => void;
  handleEditSuccess: (updatedProject: Project, isEdit?: boolean) => void;
  handleProjectCheck: (projectId: number, value: boolean) => void;
}


export function ProjectGridItem(props: ProjectGridItemProps) {
  const { project, editOpen, handleEditClose, handleEditOpen, checkedProjects, handleEditSuccess, handleProjectCheck } = props;
  const classes = useStyles();
  const isOpen = !!editOpen[project.id];
  let isChecked = false;
  if (checkedProjects && typeof checkedProjects[project.id] === 'boolean') {
    isChecked = checkedProjects[project.id];
  }
  return (<Grid item xs key={project.id}>
    <ProjectDialog
      open={isOpen}
      onClose={() => handleEditClose(project.id)}
      onSuccess={handleEditSuccess}
      projectToEdit={project}
    />
    <Card className={classes.card}>
      <CardHeader title={project.name} action={<>
        <Checkbox checked={isChecked} value="checkedB" color="secondary" onChange={(event) => handleProjectCheck(project.id, event.target.checked)} />
        <IconButton aria-label="edit" onClick={() => handleEditOpen(project.id)}>
          <EditIcon />
        </IconButton>
      </>} />
      <CardActionArea component={Link} to={`${PATHS.project.function && PATHS.project.function(project.id)}`} >
        <CardContent>
          <Typography gutterBottom color="textPrimary" className={classes.text}>
            {project.apiKey}
          </Typography>
          <Typography gutterBottom color="textSecondary" className={classes.text}>
            {project.apiSecret}
          </Typography>
          <Typography variant="body1" component="p" className={classes.text}>
            {project.thresholdHc}
          </Typography>
          <Typography variant="body1" component="p" className={classes.text}>
            {project.thresholdLc}
          </Typography>
          <Typography variant="body2" gutterBottom component="p" className={classes.text}>
            {new Date(project.validFrom).toDateString()}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  </Grid>);
};