import { Grid, Grow, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import AddIcon from '@material-ui/icons/Add';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import clsx from 'clsx';
import { useSnackbar } from 'notistack';
import { BulletList } from 'react-content-loader';
import { useHistory } from 'react-router-dom';
import React, { useGlobal } from 'reactn';
import { PERMISSIONS } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { ServerError } from '../../services/api/types';
import { deleteProjectResult } from '../../services/api/types/projects.types';
import { ICONS } from '../../theme/icons';
import { LOCAL_STORAGE_KEYS, PATHS, Project, SNACKBAR_VARIANTS } from '../../types';
import log from '../../util/log/logger';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { SearchBar } from '../shared/SearchBar';
import { ProjectDialog } from './components/ProjectDialog';
import { ProjectList } from './components/ProjectList';

export interface CheckedProjectsById {
  [id: string]: boolean;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    hidden: {
      visibility: 'hidden',
    },
    card: {
      minWidth: 450,
    },
    cardContent: {
      padding: 0,
    },
  }),
);

interface ProjectsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ProjectsDialog(props: ProjectsDialogProps) {
  const { open, onClose } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const { user, hasPermission, roles } = React.useContext(KeycloakContext);
  const { currentProjectId } = user;
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const [currentOrganization, setCurrentOrganization] = useGlobal('currentOrganization');
  const [currentProject, setCurrentProject] = useGlobal('currentProject');
  const [projectInitialized, setProjectInitialized] = useGlobal('projectInitialized');
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [filteredProjects, setfilteredProjects] = React.useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [checkedProjects, setCheckedProjects] = React.useState<CheckedProjectsById>({});
  const [selectedProject, setSelectedProject] = React.useState<Project | undefined>();

  const classes = useStyles();
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const canModify = React.useMemo(() => hasPermission(roles, PERMISSIONS.crud), [roles]);

  const handleClose = () => {
    setfilteredProjects([]);
    setSearching(false);
    setShowEdit(false);
    onClose();
  };

  const handleCreateOpen = () => setCreateOpen(true);
  const handleCreateClose = () => setCreateOpen(false);

  const handleSettingsOpen = () => setShowEdit(true);
  const handleSettingsClose = () => setShowEdit(false);

  const handleProjectClick = (project: Project) => {
    if (project) {
      setSelectedProject(project);
      setCurrentProject(project);
      setTimeout(() => {
        history.push(`${PATHS.project.function && PATHS.project.function(project?.id as string)}`);
        handleClose();
      }, 0);
    }
  };

  const getProjects = async () => {
    if (api?.projects) {
      setProjectsLoading(true);
      const response = await api.projects.getProjects();
      if (response.kind === 'ok') {
        setProjects(response.projects);
      } else {
        log({
          file: `ProjectsDialog.tsx`,
          caller: `getProjects - failed to get projects`,
          value: response,
          important: true,
        });
        setProjectInitialized(true);
      }
      setProjectsLoading(false);
    }
  };

  React.useEffect(() => {
    if (currentOrganization) {
      getProjects();
    } else if (!currentOrganization) {
      setProjects([]);
    }
  }, [currentOrganization]);


  // to get the currently selected project
  React.useEffect(() => {
    if (projects && projects.length && currentProjectId) {
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        if (project.id === currentProjectId) {
          setSelectedProject(project);
          setCurrentProject(project);
          setProjectInitialized(true);
          return;
        }
      }
      // if we didn't find any matching projects
      localStorage.removeItem(LOCAL_STORAGE_KEYS.PROJECT_ID);
      setProjectInitialized(true);
    } else if (!currentProjectId) {
      setProjectInitialized(true);
    }
  }, [projects]);


  let projectsToDelete: string[] = [];
  Object.keys(checkedProjects).forEach(projectId => {
    const checked = checkedProjects[projectId];
    if (checked) {
      projectsToDelete.push(projectId);
    }
  });

  const confirmDelete = () => setConfirmationOpen(true);
  const closeConfirmation = () => setConfirmationOpen(false);

  const handleProjectSearch = (filteredProjects: Project[], searching: boolean) => {
    setSearching(searching);
    setfilteredProjects(filteredProjects);
  };

  /**
   * remove the deleted projects from all lists
   */
  const handleDeleteSuccess = (idsToDelete: string[]) => {
    const projectsCopy = projects.slice();
    // count down to account for removing indexes
    for (let i = projects.length - 1; i >= 0; i--) {
      const project = projects[i];
      if (idsToDelete.includes(project.id)) {
        projectsCopy.splice(i, 1);
      }
      // clear state if we deleted the current project
      if (project.id === currentProject?.id) {
        setCurrentProject(undefined);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.PROJECT_ID);
      }
    }
    projectsToDelete = [];
    setCheckedProjects({});
    setProjects(projectsCopy);
  };

  const handleProjectListUpdate = (project: Project, isEdit = false) => {
    if (isEdit) {
      setProjects(prevProjects => {
        const idToUpdate = project.id;
        for (let i = 0; i < prevProjects.length; i++) {
          if (prevProjects[i].id === idToUpdate) {
            prevProjects[i] = project;
          }
        }
        return prevProjects;
      });
    } else {
      setProjects(prevProjects => {
        prevProjects.push(project);
        return prevProjects;
      });
    }
  };

  const handleProjectDelete = async () => {
    if (!canModify) return;
    setDeleteLoading(true);
    closeConfirmation();
    const deleteProjectPromises: Promise<deleteProjectResult>[] = [];
    const successIds: string[] = [];
    projectsToDelete.forEach(projectId => {
      if (api?.projects) {
        deleteProjectPromises.push(api.projects.deleteProject(projectId));
      } else {
        return;
      }
    });
    let serverError: ServerError | undefined;
    const responseArray = await Promise.all(deleteProjectPromises);
    responseArray.forEach((response, responseIndex) => {
      if (response.kind !== "ok") {
        log({
          file: `Projects.tsx`,
          caller: `handleProjectDelete - Error:`,
          value: response,
          error: true,
        });
        serverError = response.serverError;
        let errorMessageText = translate('common.error');
        if (serverError?.message) {
          errorMessageText = serverError.message;
        }
        enqueueSnackbar(errorMessageText, { variant: SNACKBAR_VARIANTS.error });
      } else {
        successIds.push(projectsToDelete[responseIndex]);
        enqueueSnackbar(translate('common.success'), { variant: 'success', preventDuplicate: true });
      }
    });
    // update the project list
    handleDeleteSuccess(successIds);
    setDeleteLoading(false);
  };

  const handleProjectDeleteCheck = (projectId: string, value: boolean, triggerDelete = false): void => {
    setCheckedProjects((prevCheckedProjects) => {
      return { ...prevCheckedProjects, [projectId]: value };
    });
    if (triggerDelete) {
      confirmDelete();
    }
  };

  const renderCardHeaderAction = () => (<Grid
    container
    spacing={1}
    justify='flex-end'
    alignContent='center'
    alignItems='center'
  >
    <Grow in={!showEdit}>
      <Grid item >
        <IconButton
          aria-label="settings-button"
          size="small"
          color="primary"
          disabled={projectsLoading}
          onClick={handleSettingsOpen}
        >
          <ICONS.Settings />
        </IconButton>
      </Grid>
    </Grow>
    <Grow in={!showEdit}>
      <Grid item >
        <IconButton
          aria-label="create-button"
          size="small"
          color="primary"
          onClick={handleCreateOpen}
        >
          <AddIcon />
        </IconButton>
      </Grid>
    </Grow>
  </Grid>);

  const renderHeaderTitle = () => {
    return (<Grid
      container
      justify='flex-start'
      alignContent='center'
      alignItems='center'
      wrap='nowrap'
    >
      {showEdit && <Grow in={showEdit}>
        <Grid item>
          <IconButton
            aria-label="settings-button"
            size="small"
            color="primary"
            disabled={projectsLoading}
            onClick={handleSettingsClose}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Grid>
      </Grow>
      }
      <Grid item>
        <Typography align='center' variant='h6' >
          {translate("projects.header")}
        </Typography>
      </Grid>
    </Grid>);
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      disableBackdropClick={projectsLoading}
      disableEscapeKeyDown={projectsLoading}
      open={open}
      onClose={handleClose}
      aria-labelledby="projects-dialog"
      classes={{
        container: clsx((createOpen || editDialogOpen) && classes.hidden)
      }}
    >
      <DialogContent>
        <Card elevation={0} className={classes.card}>
          <CardHeader
            action={canModify && !projectsLoading && renderCardHeaderAction()}
            title={renderHeaderTitle()}
          />
          <CardHeader
            style={{ padding: 0, margin: 0 }}
            title={projects.length > 1 && !projectsLoading && <SearchBar
              list={projects}
              keys={['name']}
              onSearch={handleProjectSearch}
            />}
          />
          <CardContent className={classes.cardContent} >
            {projectsLoading ? <BulletList /> :
              <ProjectList
                projects={searching ? filteredProjects : projects}
                searching={searching}
                canModify={canModify}
                showEdit={showEdit}
                checkedProjects={checkedProjects}
                setCheckedProjects={handleProjectDeleteCheck}
                setEditDialogOpen={setEditDialogOpen}
                onUpdate={handleProjectListUpdate}
                selectedProjectId={selectedProject?.id}
                onItemClick={handleProjectClick}
              />
            }
          </CardContent>
          <ProjectDialog
            open={createOpen}
            onClose={handleCreateClose}
            onSuccess={handleProjectListUpdate}
            hideBackdrop
          />
          <ConfirmationDialog
            destructive
            titleText={`${translate('projects.deleteProject', { count: projectsToDelete.length })}?`}
            submitText={translate('common.delete')}
            open={confirmationOpen}
            onSubmit={handleProjectDelete}
            onCancel={closeConfirmation}
          />
        </Card>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="primary"
        >
          {translate('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}