import { Card, CardContent, CardHeader, Container, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import CardActions from '@material-ui/core/CardActions';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import React from "react";
import { BulletList } from 'react-content-loader';
import { RouteComponentProps } from "react-router";
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { ProblemKind } from '../../services/api/types';
import { Project } from '../../types';
import log from '../../util/log/logger';

interface ProjectDetailsProps {
  projectId: string
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

export function ProjectDetails({ match }: RouteComponentProps<ProjectDetailsProps>) {
  const { projectId } = match.params;
  const projectIdNumber = Number(projectId);
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [project, setProject] = React.useState<Project | undefined>(undefined);
  const [projectLoading, setProjectLoading] = React.useState(true);
  const [isValidId, setIsValidId] = React.useState(true);


  //!
  //TODO
  //* IMMEDIATELY REDIRECT IF USER DOESN'T HAVE THE CORRECT ROLES

  const classes = useStyles();

  React.useEffect(() => {
    const getProject = async () => {
      if (api && api.projects) {
        const response = await api.projects.getProject(projectIdNumber);
        if (response.kind === 'ok') {
          setProject(response.project)
        } else if (response.kind === ProblemKind["not-found"]) {
          log({
            file: `ProjectDetails.tsx`,
            caller: `getProject - project does not exist`,
            value: response,
            important: true,
          })
        } else {
          log({
            file: `ProjectDetails.tsx`,
            caller: `getProject - failed to get project`,
            value: response,
            important: true,
          })
        }
        setProjectLoading(false);
      }
    }
    if (isNaN(projectIdNumber)) {
      setIsValidId(true);
      setProjectLoading(false);
      log({
        file: `ProjectDetails.tsx`,
        caller: `project id not valid`,
        value: projectId,
        important: true,
      })
    } else {
      getProject();
    }
  }, []);

  const renderContent = () => {
    if (!isValidId) {
      return <Typography>{'INVALID PROJECT ID'}</Typography>
    }
    if (!project) {
      return <Typography>{'PROJECT NOT FOUND'}</Typography>
    }
    return (<Card>
      <CardHeader
        action={() => { }}
        title={project.name}
      />
      <CardContent className={classes.cardContent} >
        {projectLoading ? <BulletList /> :
          <>
            <div>{projectId}</div>
            {!!project && <div>{JSON.stringify(project)}</div>}
          </>
        }
      </CardContent>
    </Card>)
  }

  return (
    <Container maxWidth={false} className={classes.container} >
      {projectLoading ? <BulletList /> :
        renderContent()
      }
      <Card>
        {!!project &&
          (<CardContent>
          </CardContent>)}
        <CardActions>
          <Button
            variant="contained"
            color="primary"
            onClick={() => { }}
            startIcon={<AddIcon />}
          >
            {translate('models.tabs.acousticModel.create')}
          </Button>
        </CardActions>
      </Card>
    </Container >
  );
}