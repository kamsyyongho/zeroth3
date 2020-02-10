/* eslint-disable react/display-name */
import { Button, Toolbar, Tooltip, Typography } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import { OptionsObject, useSnackbar } from 'notistack';
import { Link } from 'react-router-dom';
import React, { useGlobal } from 'reactn';
import { PERMISSIONS } from '../../../constants';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../hooks/keycloak/KeycloakContext';
import { ICONS } from '../../../theme/icons';
import { IMAGES } from '../../../theme/images';
import { LOCAL_STORAGE_KEYS, Organization, PATHS } from '../../../types';
import log from '../../../util/log/logger';
import { ProjectsDialog } from '../../projects/ProjectsDialog';
import { AppDrawer as Drawer } from '../Drawer';
import { RenameOrganizationDialog } from '../RenameOrganizationDialog';
import MenuPopup from './components/MenuPopup';
import { UploadProgressNotification } from './components/UploadProgressNotification';

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      position: 'relative',
      zIndex: theme.zIndex.drawer + 100,
    },
    title: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    projectButton: {
      margin: theme.spacing(2),
    },
    toolbar: theme.mixins.toolbar,
    logoButton: {
      height: 24,
    },
    logo: {
      fontSize: 120,
      height: 24,
      color: theme.palette.primary.contrastText,
    }
  }),
);

const QUEUE_NOTIFICATION_KEY = 0;
const DEFAULT_NOTIFICATION_OPTIONS: OptionsObject = {
  persist: true,
  preventDuplicate: true,
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'center',
  },
  key: QUEUE_NOTIFICATION_KEY,
};
let noProjectSelectedTimeout: NodeJS.Timeout | undefined;

export const Header: React.FunctionComponent<{}> = (props) => {
  const { user, hasPermission } = React.useContext(KeycloakContext);
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { translate, toggleLanguage } = React.useContext(I18nContext);
  const [organizations, setOrganizations] = useGlobal('organizations');
  const [currentOrganization, setCurrentOrganization] = useGlobal('currentOrganization');
  const [currentProject, setCurrentProject] = useGlobal('currentProject');
  const [uploadQueueEmpty, setUploadQueueEmpty] = useGlobal('uploadQueueEmpty');
  const [organizationLoading, setOrganizationsLoading] = React.useState(true);
  const [noProjectSelected, setNoProjectSelected] = React.useState(false);
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = React.useState(false);
  const [organization, setOrganization] = React.useState<Organization | undefined>();
  const [currentProjectId, setCurrentProjectId] = React.useState<string | undefined>();

  const classes = useStyles();

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  const showRenameDialog = () => setIsRenameOpen(true);
  const hideRenameDialog = () => setIsRenameOpen(false);

  const showProjectsDialog = () => {
    closeDrawer();
    setIsProjectsOpen(true);
  };
  const hideProjectsDialog = () => setIsProjectsOpen(false);

  const getOrganizations = async () => {
    if (api?.organizations) {
      setOrganizationsLoading(true);
      const response = await api.organizations.getOrganizations();
      if (response.kind === 'ok') {
        setOrganizations(response.organizations);
      } else {
        log({
          file: `Header.tsx`,
          caller: `getOrganizations - failed to get organizations`,
          value: response,
          important: true,
        });
      }
    }
    setOrganizationsLoading(false);
  };

  const onComplete = () => {
    setUploadQueueEmpty(true);
  };

  const customNotification = (key: string | number | undefined, message: React.ReactNode, callback: () => Promise<number | undefined>) => {
    return (
      <UploadProgressNotification key={key} message={message} onComplete={onComplete} callback={callback} />
    );
  };

  const getUploadQueue = async (projectId: string, isGetter = false) => {
    if (api?.rawData) {
      const response = await api.rawData.getRawDataQueue(projectId);
      if (response.kind === 'ok') {
        const { queue } = response;
        const { projectUnprocessed } = queue;
        if (projectUnprocessed < 1) {
          onComplete();
        } else {
          const text = `${translate('common.uploading')}: ${projectUnprocessed}`;
          enqueueSnackbar(text, {
            ...DEFAULT_NOTIFICATION_OPTIONS,
            content: (key: string, message: string) => customNotification(key, message, () => getUploadQueue(projectId, true)),
          });
        }
        if (isGetter) {
          return projectUnprocessed;
        }
      } else {
        log({
          file: `Header.tsx`,
          caller: `getUploadQueue - failed to get raw data queue`,
          value: response,
          important: true,
        });
      }
    }
  };

  const canRename = React.useMemo(() => hasPermission(PERMISSIONS.organization), []);
  const shouldRenameOrganization = !organizationLoading && (organization?.name === user.preferredUsername);

  const clearProjectTimeout = () => {
    if (noProjectSelectedTimeout) {
      clearTimeout(noProjectSelectedTimeout);
      noProjectSelectedTimeout = undefined;
    }
  };

  React.useEffect(() => {
    // no need to get organization to check if we don't have the permission to rename
    if (user.currentOrganizationId && !organizations) {
      getOrganizations();
    } else {
      setOrganizationsLoading(false);
    }
    noProjectSelectedTimeout = setTimeout(() => {
      setNoProjectSelected(true);
      clearProjectTimeout();
    }, 5000);
    return () => {
      clearProjectTimeout();
    };
  }, []);

  // to get the currently selected organization's info
  React.useEffect(() => {
    if (organizations && organizations.length && user.currentOrganizationId) {
      for (let i = 0; i < organizations.length; i++) {
        const organization = organizations[i];
        if (organization.id === user.currentOrganizationId) {
          setOrganization(organization);
          break;
        }
      }
    }
  }, [organizations]);

  React.useEffect(() => {
    if (organization) {
      setCurrentOrganization(organization);
    }
  }, [organization]);

  React.useEffect(() => {
    if (currentProjectId) {
      clearProjectTimeout();
      setNoProjectSelected(false);
    }
  }, [currentProjectId]);

  // to check for current upload progress
  React.useEffect(() => {
    if (currentProject && !uploadQueueEmpty) {
      if (currentProjectId !== currentProject.id) {
        setCurrentProjectId(currentProject.id);
      }
      getUploadQueue(currentProject.id);
    }
  }, [currentProject, uploadQueueEmpty]);

  // to close any showing notifications
  React.useEffect(() => {
    closeSnackbar(QUEUE_NOTIFICATION_KEY);
  }, [currentProject]);

  // to reset projects and project list
  React.useEffect(() => {
    setCurrentProject(undefined);
    if (currentOrganization && organization && currentOrganization.id !== organization.id) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.PROJECT_ID);
    }
  }, [currentOrganization]);

  // to show a notification when the organization name should be changed
  React.useEffect(() => {
    if (canRename && shouldRenameOrganization) {
      const action = (key: number) => (
        <>
          <Button color='primary' onClick={() => {
            showRenameDialog();
            closeSnackbar(key);
          }} >
            {translate('organization.rename')}
          </Button>
          <IconButton color='inherit' onClick={() => closeSnackbar(key)}>
            <CloseIcon />
          </IconButton>
        </>
      );
      enqueueSnackbar(translate('organization.renameOrg'), {
        persist: true,
        action,
      });
    }
  }, [canRename, shouldRenameOrganization]);


  return (
    <AppBar
      position="static"
      color='secondary'
      className={classes.root}
    >
      <Toolbar>
        <Grid
          justify='space-between'
          container
        >
          <Grid
            item
            container
            wrap='nowrap'
            justify='flex-start'
            alignContent='center'
            alignItems='center'
            sm={6}
          >
            <IconButton
              onClick={toggleDrawer}
              color={"inherit"}
              edge='start'
              className={classes.menuButton}
            >
              <ICONS.Menu fontSize='large' />
            </IconButton>
            <Button onClick={closeDrawer} component={Link} to={PATHS.home.to as string} className={classes.logoButton} >
              {IMAGES.Logo.svg && IMAGES.Logo.svg({ className: classes.logo })}
            </Button>
            <Tooltip
              placement='bottom'
              title={noProjectSelected ? <Typography variant='h6' >{translate('projects.noProjectSelected')}</Typography> : ''}
              arrow={true}
              open={noProjectSelected}
            >
              <Button
                startIcon={<ICONS.Projects />}
                endIcon={<ICONS.ArrowDown />}
                color={"inherit"}
                className={classes.projectButton}
                onClick={showProjectsDialog}
              >
                {currentProject?.name ? currentProject?.name : translate('path.projects')}
              </Button>
            </Tooltip>
          </Grid>
          <Grid
            item
            container
            wrap='nowrap'
            justify='flex-end'
            alignContent='center'
            alignItems='center'
            sm={3}
          >
            <IconButton
              onClick={toggleLanguage}
              color={"inherit"}
              edge='start'
              className={classes.menuButton}
            >
              <ICONS.Translate />
            </IconButton>
            <MenuPopup
              onClick={closeDrawer}
              user={user}
              organization={organization}
            />
          </Grid>
        </Grid>
      </Toolbar>
      <Drawer
        open={isDrawerOpen}
        setOpen={setIsDrawerOpen}
      />
      <RenameOrganizationDialog
        name={organization?.name ?? ''}
        open={isRenameOpen}
        onSuccess={getOrganizations}
        onClose={hideRenameDialog}
      />
      <ProjectsDialog
        open={isProjectsOpen}
        onClose={hideProjectsDialog}
      />
    </AppBar>
  );
};
