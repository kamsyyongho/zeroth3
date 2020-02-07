/* eslint-disable react/display-name */
import { Button, Toolbar } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import { OptionsObject, useSnackbar } from 'notistack';
import React from 'react';
import { Link } from "react-router-dom";
import { PERMISSIONS } from '../../../constants';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { GlobalStateContext } from '../../../hooks/global-state/GlobalStateContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../hooks/keycloak/KeycloakContext';
import { ICONS } from '../../../theme/icons';
import { IMAGES } from '../../../theme/images';
import { Organization, PATHS } from '../../../types';
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
      color: theme.palette.primary.contrastText,
    }
  }),
);

/** in ms */
const DEFAULT_POLLING_TIMEOUT = 5000;
// const DEFAULT_POLLING_TIMEOUT = 10000;
let uploadQueueCheckTimeoutId: NodeJS.Timeout | undefined;
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

export const Header: React.FunctionComponent<{}> = (props) => {
  const { user, hasPermission } = React.useContext(KeycloakContext);
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { translate, toggleLanguage } = React.useContext(I18nContext);
  const { globalState, setGlobalState } = React.useContext(GlobalStateContext);
  const { organizations, uploadQueueEmpty } = globalState;
  const [organizationLoading, setOrganizationsLoading] = React.useState(true);
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [isWaitingForQueue, setIsWaitingForQueue] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = React.useState(false);
  const [organization, setOrganization] = React.useState<Organization | undefined>();

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
        setGlobalState({ organizations: response.organizations });
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

  const clearNotificationTimeout = () => {
    setIsWaitingForQueue(false);
    if (uploadQueueCheckTimeoutId) {
      clearTimeout(uploadQueueCheckTimeoutId);
      uploadQueueCheckTimeoutId = undefined;
    }
  };

  const customNotification = (key: string | number | undefined, message: React.ReactNode) => {
    return (
      <UploadProgressNotification key={key} message={message} onClose={clearNotificationTimeout} />
    );
  };

  const getUploadQueue = async () => {
    if (api?.rawData) {
      //!
      //TODO
      //* DON'T HARDCODE THIS!!!
      const response = await api.rawData.getRawDataQueue('39410dab-a39b-4284-99cb-8292d02f6c18');
      if (response.kind === 'ok') {
        const { queue } = response;
        const { projectUnprocessed } = queue;
        if (projectUnprocessed < 1) {
          setGlobalState({ uploadQueueEmpty: true });
          clearNotificationTimeout();
          if (isWaitingForQueue) {
            enqueueSnackbar(translate('common.uploaded'), {
              ...DEFAULT_NOTIFICATION_OPTIONS,
              content: customNotification,
            });
          }
        } else {
          setIsWaitingForQueue(true);
          enqueueSnackbar(`${translate('common.uploading')}: ${projectUnprocessed}`, {
            ...DEFAULT_NOTIFICATION_OPTIONS,
            content: customNotification,
          });
          // check again after a few seconds
          uploadQueueCheckTimeoutId = setTimeout(() => {
            getUploadQueue();
          }, DEFAULT_POLLING_TIMEOUT);
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

  React.useEffect(() => {
    // no need to get organization to check if we don't have the permission to rename
    if (user.currentOrganizationId && !organizations) {
      getOrganizations();
    } else {
      setOrganizationsLoading(false);
    }
    return () => {
      clearNotificationTimeout();
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

  // to check for current upload progress
  React.useEffect(() => {
    if (!uploadQueueEmpty) {
      getUploadQueue();
    }
  }, [uploadQueueEmpty]);


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
            <Button
              startIcon={<ICONS.Projects />}
              color={"inherit"}
              className={classes.projectButton}
              onClick={showProjectsDialog}
            >
              {translate('path.projects')}
            </Button>
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
