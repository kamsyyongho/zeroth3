import { CardHeader, Grid } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import SettingsIcon from '@material-ui/icons/Settings';
import React from 'react';
import { Project } from '../../../types';
import { CheckedProjectsById } from '../Projects';
import { ProjectDialog } from './ProjectDialog';

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
  checkedProjects: CheckedProjectsById
  setCheckedProjects: React.Dispatch<React.SetStateAction<CheckedProjectsById>>
  onUpdate: (project: Project, isEdit?: boolean) => void

}

export function ProjectGridList(props: ProjectGridListProps) {
  const { projects, checkedProjects, setCheckedProjects, onUpdate } = props;
  const [editOpen, setEditOpen] = React.useState(false);
  const classes = useStyles();

  const handleEditOpen = () => setEditOpen(true);
  const handleEditClose = () => setEditOpen(false);

  const handleEditSuccess = (updatedProject: Project, isEdit?: boolean) => {
    onUpdate(updatedProject, isEdit);
    handleEditClose();
  }

  const handleProjectCheck = (projectId: number, value: boolean): void => {
    setCheckedProjects((prevCheckedProjects) => {
      return { ...prevCheckedProjects, [projectId]: value }
    })
  }

  const renderProject = (project: Project) => {
    let isChecked = false;
    if (checkedProjects && typeof checkedProjects[project.id] === 'boolean') {
      isChecked = checkedProjects[project.id];
    }
    return (<Grid item md={3} key={project.id}>
      <ProjectDialog open={editOpen} onClose={handleEditClose} onSuccess={handleEditSuccess} projectToEdit={project} />
      <Card className={classes.card}>
        <CardHeader
          title={project.name}
          action={
            <>
              <Checkbox
                checked={isChecked}
                value="checkedB"
                color="secondary"
                onChange={(event) => handleProjectCheck(project.id, event.target.checked)}
              />
              <IconButton aria-label="edit" onClick={handleEditOpen} >
                <SettingsIcon />
              </IconButton>
            </>
          }
        />
        <CardActionArea>
          <CardContent>
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
    </Grid>)
  }

  return (
    <Grid container spacing={2} >
      {projects.map(project => (
        renderProject(project)
      ))}
    </Grid>
  )
}
