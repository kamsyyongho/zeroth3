/* eslint-disable react/display-name */
import { Button, Toolbar, Tooltip, Typography } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import { OptionsObject, useSnackbar, VariantType } from 'notistack';
import { Link } from 'react-router-dom';
import React, { useGlobal } from 'reactn';
import { PERMISSIONS } from '../../../constants';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../hooks/keycloak/KeycloakContext';
import { ICONS } from '../../../theme/icons';
import { IMAGES } from '../../../theme/images';
import { LOCAL_STORAGE_KEYS, Organization, PATHS, SnackbarError, SNACKBAR_VARIANTS } from '../../../types';
import {ProblemKind} from '../../../services/api/types';
import log from '../../../util/log/logger';
import { ProjectsDialog } from '../../projects/ProjectsDialog';
import { AppDrawer as Drawer } from '../Drawer';
import { RenameOrganizationDialog } from '../RenameOrganizationDialog';
import MenuPopup from './components/MenuPopup';
import { UploadProgressNotification } from './components/UploadProgressNotification';
import {useDispatch, useSelector} from 'react-redux';
import {
  setOrganizations,
  setCurrentOrganization,
} from '../../../store/modules/common/actions';


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
    },
    dataSetName: {
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
    horizontal: 'left',
  },
  key: QUEUE_NOTIFICATION_KEY,
};

/**
 * Handles initial data fetching and site management
 * @param props
 */
export const Header: React.FunctionComponent<{}> = (props) => {
  const { user, hasPermission, initializeUserRoles, roles } = React.useContext(KeycloakContext);
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { translate, toggleLanguage } = React.useContext(I18nContext);
  // const [organizations, setOrganizations] = useGlobal('organizations');
  // const [currentOrganization, setCurrentOrganization] = useGlobal('currentOrganization');
  const [currentProject, setCurrentProject] = useGlobal('currentProject');
  const [uploadQueueEmpty, setUploadQueueEmpty] = useGlobal('uploadQueueEmpty');
  const [projectInitialized, setProjectInitialized] = useGlobal('projectInitialized');
  const [projectTdpDataShouldRefresh, setProjectTdpDataShouldRefresh] = useGlobal('projectTdpDataShouldRefresh');
  const [organizationLoading, setOrganizationsLoading] = React.useState(true);
  const [noProjectSelected, setNoProjectSelected] = React.useState(false);
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = React.useState(false);
  const [organization, setOrganization] = React.useState<Organization | undefined>();
  const [currentProjectId, setCurrentProjectId] = React.useState<string | undefined>();
  const organizations = useSelector((state: any) => state.common.organizations);
  const currentOrganization = useSelector((state: any) => state.common.currentOrganization);

  const dispatch = useDispatch();


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
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;

      if (response.kind === 'ok') {
        // setOrganizations(response.organizations);
        dispatch(setOrganizations(response.organizations));
      } else if (response.kind !== ProblemKind['bad-data']) {
        log({
          file: `Header.tsx`,
          caller: `getOrganizations - failed to get organizations`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
    }
    setOrganizationsLoading(false);
  };

  const onComplete = () => {
    setUploadQueueEmpty(true);
  };

  const customNotification = (key: string | number | undefined, message: React.ReactNode, callback: () => Promise<number | undefined>, progress: number) => {
    return (
      <UploadProgressNotification key={key} message={message} onComplete={onComplete} callback={callback} progress={progress} />
    );
  };

  const getUploadQueue = async (projectId: string, isGetter = false) => {
    if (api?.rawData) {
      const response = await api.rawData.getRawDataQueue(projectId);
      if (response.kind === 'ok') {
        const { queue } = response;
        const { length } = queue;
        if (length === 0) {
          onComplete();
        } else {
          //!
          //TODO
          //* SIMPLIFY THIS LOGIC BY USING GLOBAL STATE INSTEAD
          const text = `${translate('common.decoding')}: ${length} seconds remaining`;
          enqueueSnackbar(text, {
            ...DEFAULT_NOTIFICATION_OPTIONS,
            content: (key: string, message: string) => customNotification(key, message, () => getUploadQueue(projectId, true), length),
          });
        }
        if (isGetter) {
          return length;
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
  const canRename = React.useMemo(() => hasPermission(roles, PERMISSIONS.profile.renameOrganization), [roles]);
  const shouldRenameOrganization = !organizationLoading && (organization?.name === user.preferredUsername);

  React.useEffect(() => {
    // no need to get organization to check if we don't have the permission to rename
    if (user.currentOrganizationId && !organizations.length) {
      getOrganizations();
    } else {
      setOrganizationsLoading(false);
    }
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
      dispatch(setCurrentOrganization(organization));
      // setCurrentOrganization(organization);
      const roleNames = organization.roles.map(role => role.name);
      initializeUserRoles(roleNames);
    }
  }, [organization]);

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

      dispatch(setCurrentOrganization(currentOrganization));
      setOrganization(currentOrganization);
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

  React.useEffect(() => {
    if (projectInitialized) {
      setNoProjectSelected(!currentProject);
    }
  }, [projectInitialized, currentProject]);

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
            xs={9}
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
            xs={3}
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
        onClose={hideProjectsDialog}/>
    </AppBar>
  );
};
