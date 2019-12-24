import { Button, Toolbar } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import MenuIcon from '@material-ui/icons/Menu';
import { useSnackbar } from 'notistack';
import React from 'react';
import { FaProjectDiagram } from 'react-icons/fa';
import { MdTranslate } from 'react-icons/md';
import { Link } from "react-router-dom";
import { PERMISSIONS } from '../../../constants';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { GlobalStateContext } from '../../../hooks/global-state/GlobalStateContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../hooks/keycloak/KeycloakContext';
import logo from '../../../static/images/logo@2x.png';
import { PATHS } from '../../../types';
import log from '../../../util/log/logger';
import { ProjectsDialog } from '../../projects/ProjectsDialog';
import { AppDrawer as Drawer } from '../Drawer';
import { RenameOrganizationDialog } from '../RenameOrganizationDialog';
import { SvgIconWrapper } from '../SvgIconWrapper';
import MenuPopup from './components/MenuPopup';


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
  }),
);

export const Header: React.FunctionComponent<{}> = (props) => {
  const { user, hasPermission } = React.useContext(KeycloakContext);
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { translate, toggleLanguage } = React.useContext(I18nContext);
  const { globalState, setGlobalState } = React.useContext(GlobalStateContext);
  const { organization } = globalState;
  const [organizationLoading, setOrganizationLoading] = React.useState(true);
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = React.useState(false);

  const classes = useStyles();

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  const showRenameDialog = () => setIsRenameOpen(true);
  const hideRenameDialog = () => setIsRenameOpen(false);

  const showProjectsDialog = () => {
    closeDrawer();
    setIsProjectsOpen(true);
  }
  const hideProjectsDialog = () => setIsProjectsOpen(false);

  const getOrganization = async () => {
    if (api?.organizations) {
      setOrganizationLoading(true);
      const response = await api.organizations.getOrganization();
      if (response.kind === 'ok') {
        setGlobalState({ organization: response.organization });
      } else {
        log({
          file: `Header.tsx`,
          caller: `getOrganization - failed to get organization`,
          value: response,
          important: true,
        });
      }
    }
    setOrganizationLoading(false);
  };

  const canRename = React.useMemo(() => hasPermission(PERMISSIONS.organization), []);
  const shouldRenameOrganization = !organizationLoading && (organization?.name === user.preferredUsername);

  React.useEffect(() => {
    // no need to get organization to check if we don't have the permission to rename
    if (user.organizationId && !organization) {
      getOrganization();
    } else {
      setOrganizationLoading(false);
    }
  }, []);


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
              <MenuIcon />
            </IconButton>
            <Button onClick={closeDrawer} component={Link} to={PATHS.home.to as string}>
              <img src={logo} alt='Zeroth EE' height={25} />
            </Button>
            <Button
              startIcon={<SvgIconWrapper ><FaProjectDiagram /></SvgIconWrapper>}
              endIcon={<ExpandMoreIcon />}
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
              <SvgIconWrapper ><MdTranslate /></SvgIconWrapper>
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
        onSuccess={getOrganization}
        onClose={hideRenameDialog}
      />
      <ProjectsDialog
        open={isProjectsOpen}
        onClose={hideProjectsDialog}
      />
    </AppBar>
  );
};
