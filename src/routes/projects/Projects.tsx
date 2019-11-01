import { Container, Grid } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { useSnackbar } from 'notistack';
import React from 'react';
import { BulletList } from 'react-content-loader';
import MoonLoader from 'react-spinners/MoonLoader';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { ServerError } from '../../services/api/types';
import { deleteProjectResult } from '../../services/api/types/projects.types';
import { Project } from '../../types';
import log from '../../util/log/logger';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { ProjectDialog } from './components/ProjectDialog';
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
  const { enqueueSnackbar } = useSnackbar();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [checkedProjects, setCheckedProjects] = React.useState<CheckedProjectsById>({});

  const handleCreateOpen = () => setCreateOpen(true);
  const handleCreateClose = () => setCreateOpen(false);

  //!
  //TODO
  //* IMMEDIATELY REDIRECT IF USER DOESN'T HAVE THE CORRECT ROLES


  React.useEffect(() => {
    const getProjects = async () => {
      if (api && api.projects) {
        const response = await api.projects.getProjects();
        if (response.kind === 'ok') {
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


  let projectsToDelete: number[] = [];
  Object.keys(checkedProjects).forEach(projectId => {
    const checked = checkedProjects[Number(projectId)]
    if (checked) {
      projectsToDelete.push(Number(projectId));
    }
  })

  const confirmDelete = () => setConfirmationOpen(true);
  const closeConfirmation = () => setConfirmationOpen(false);

  /**
   * remove the deleted projects from all lists
   */
  const handleDeleteSuccess = () => {
    const projectsCopy = projects.slice();
    // count down to account for removing indexes
    for (let i = projects.length - 1; i >= 0; i--) {
      const project = projects[i];
      if (projectsToDelete.includes(project.id)) {
        projectsCopy.splice(i, 1);
      }
    }
    projectsToDelete = [];
    setCheckedProjects({});
    setProjects(projectsCopy);
  }

  const handleProjectListUpdate = (project: Project, isEdit = false) => {
    if (isEdit) {
      setProjects(prevProjects => {
        const idToUpdate = project.id;
        for (let i = 0; i < prevProjects.length; i++) {
          if (prevProjects[i].id === idToUpdate) {
            prevProjects[i] = project;
          }
        }
        return prevProjects
      })
    } else {
      setProjects(prevProjects => {
        prevProjects.push(project);
        return prevProjects
      })
    }
  }

  const handleProjectDelete = async () => {
    setDeleteLoading(true);
    closeConfirmation();
    const deleteProjectPromises: Promise<deleteProjectResult>[] = [];
    projectsToDelete.forEach(projectId => {
      if (api && api.projects) {
        deleteProjectPromises.push(api.projects.deleteProject(projectId))
      } else {
        return;
      }
    })
    let serverError: ServerError | undefined;
    const responseArray = await Promise.all(deleteProjectPromises);
    responseArray.forEach(response => {
      if (response.kind !== "ok") {
        log({
          file: `Projects.tsx`,
          caller: `handleProjectDelete - Error:`,
          value: response,
          error: true,
        })
        serverError = response.serverError;
        let errorMessageText = translate('common.error')
        if (serverError && serverError.message) {
          errorMessageText = serverError.message;
        }
        enqueueSnackbar(errorMessageText, { variant: 'error' });
      } else {
        enqueueSnackbar(translate('common.success'), { variant: 'success', preventDuplicate: true });
      }
    })
    // update the project list
    if (!serverError) {
      handleDeleteSuccess();
    }
    setDeleteLoading(false);
  }


  const classes = useStyles();

  const renderCardHeaderAction = () => (<Grid container spacing={1} >
    <Grid item >
      <Button
        disabled={!projectsToDelete.length}
        variant="contained"
        color="secondary"
        onClick={confirmDelete}
        startIcon={deleteLoading ? <MoonLoader
          sizeUnit={"px"}
          size={15}
          color={"#ffff"}
          loading={true}
        /> : <DeleteIcon />}
      >
        {translate('common.delete')}
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
          title={translate("projects.header")}
        />
        <CardContent className={classes.cardContent} >
          {projectsLoading ? <BulletList /> :
            <ProjectGridList
              projects={projects}
              checkedProjects={checkedProjects}
              setCheckedProjects={setCheckedProjects}
              onUpdate={handleProjectListUpdate}
            />
          }
        </CardContent>
        <ProjectDialog open={createOpen} onClose={handleCreateClose} onSuccess={handleProjectListUpdate} />
        <ConfirmationDialog
          destructive
          titleText={`${translate('projects.deleteProject', { count: projectsToDelete.length })}?`}
          submitText={translate('common.delete')}
          open={confirmationOpen}
          onSubmit={handleProjectDelete}
          onCancel={closeConfirmation}
        />
      </Card>
    </Container >
  );
}
