import { Container, Grid } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import React from 'react';
import { BulletList } from 'react-content-loader';
import MoonLoader from 'react-spinners/MoonLoader';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { deleteProjectResult } from '../../services/api/types/projects.types';
import { Project } from '../../types';
import log from '../../util/log/logger';
import { CreateProjectDialog } from './components/CreateProjectDialog';
import { ProjectGridList } from './components/ProjectGridList';

export interface CheckedProjectsById {
  [index: number]: boolean
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      padding: 0,
    },
    cardContent: {
      padding: 0,
    },
  }),
);

export function Projects() {
  const api = React.useContext(ApiContext)
  const { translate } = React.useContext(I18nContext);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [checkedProjects, setCheckedProjects] = React.useState<CheckedProjectsById>({});

  const handleCreateOpen = () => {
    setCreateOpen(true);
  };
  const handleCreateClose = () => {
    setCreateOpen(false);
  };

  //!
  //TODO
  //* IMMEDIATELY REDIRECT IF USER DOESN'T HAVE THE CORRECT ROLES


  React.useEffect(() => {
    const getProjects = async () => {
      if (api && api.projects) {
        const response = await api.projects.getProjects();
        if (response.kind === "ok") {
          setProjects(response.projects)
        } else {
          log({
            file: `Projects.tsx`,
            caller: `getProjects - failed to get projects`,
            value: response,
            important: true,
          })
        }
        setProjectsLoading(false);
      }
    }
    getProjects();
  }, []);


  const projectsToDelete: number[] = [];
  Object.keys(checkedProjects).forEach(projectId => {
    const checked = checkedProjects[Number(projectId)]
    if (checked) {
      projectsToDelete.push(Number(projectId));
    }
  })

  const handleProjectDelete = async () => {
    //TODO
    //!
    //* DISPLAY A CONFIRMATION DIALOG FIRST
    setDeleteLoading(true);
    const deleteProjectPromises: Promise<deleteProjectResult>[] = [];
    projectsToDelete.forEach(projectId => {
      if (api && api.projects) {
        deleteProjectPromises.push(api.projects.deleteProject(projectId))
      } else {
        return;
      }
    })
    const responseArray = await Promise.all(deleteProjectPromises);
    responseArray.forEach(response => {
      if (response.kind !== "ok") {
        //!
        //TODO
        //* DISPLAY SOMETHING HERE
        // ORGANIZATIONS MUST HAVE AT LEAST ONE MEMBER WITH A ROOT / ADMIN ROLE
        // DISPLAY ANY CAUGHT EXCEPTIONS AND REVERT THE STATE
        log({
          file: `IAM.tsx`,
          caller: `handleUserDelete`,
          value: response,
          error: true,
        })
      } else {
        //!
        //TODO
        //? UPDATE THE USER?
      }
    })
    setDeleteLoading(false);
  }


  const classes = useStyles();

  const renderCardHeaderAction = () => (<Grid container spacing={1} >
    <Grid item >
      <Button
        disabled={!projectsToDelete.length}
        variant="contained"
        color="secondary"
        onClick={handleProjectDelete}
        startIcon={deleteLoading ? <MoonLoader
          sizeUnit={"px"}
          size={15}
          color={"#ffff"}
          loading={true}
        /> : <DeleteIcon />}
      >
        {translate("common.delete")}
      </Button>
    </Grid>
    <Grid item >
      <Button
        variant="contained"
        color="primary"
        onClick={handleCreateOpen}
        startIcon={<AddIcon />}
      >
        {translate("projects.createProject")}
      </Button>
    </Grid>
  </Grid>)

  return (
    <Container maxWidth={false} className={classes.container} >
      <Card>
        <CardHeader
          action={!projectsLoading && renderCardHeaderAction()}
          title={translate("IAM.header")}
        />
        <CardContent className={classes.cardContent} >
          {projectsLoading ? <BulletList /> : <ProjectGridList projects={projects} checkedProjects={checkedProjects} setCheckedProjects={setCheckedProjects} />}
        </CardContent>
        <CreateProjectDialog open={createOpen} onClose={handleCreateClose} />
      </Card>
    </Container >
  );
}
