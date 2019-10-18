import { Container } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import React from 'react';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { Project } from '../../types';
import log from '../../util/log/logger';
import { CreateProjectDialog } from './components/CreateProjectDialog';
import { ProjectGridList } from './components/ProjectGridList';


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
  const [projects, setProjects] = React.useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = React.useState(true)
  const [createLoading, setCreateLoading] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false);

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

  const createProject = async () => {
    if (api && api.projects) {
      setCreateLoading(true);
      //!
      //!
      //* DUMMY DATA
      const response = await api.projects.postProject('test', 100, 1);
      //!
      //!
      if (response.kind === "ok") {
        //!
        //TODO
        //* UPDATE THE PROJECT LIST
      } else {
        log({
          file: `Projects.tsx`,
          caller: `createProject - failed to post project`,
          value: response,
          important: true,
        })
      }
      setCreateLoading(false);
    }
  }


  const classes = useStyles();

  return (
    <Container maxWidth={false} className={classes.container} >
      <ProjectGridList projects={projects} />
      <Button
        variant="contained"
        color="primary"
        onClick={handleCreateOpen}
        startIcon={<AddIcon />}
      >{translate("projects.createProject")}
      </Button>
      <CreateProjectDialog open={createOpen} onClose={handleCreateClose} />
    </Container >
  );
}
