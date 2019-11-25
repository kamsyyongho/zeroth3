import { Button, Toolbar } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import { useSnackbar } from 'notistack';
import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { PERMISSIONS } from '../../../constants';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../../hooks/keycloak/KeycloakContext';
import { Organization, PATHS } from '../../../types';
import log from '../../../util/log/logger';
import { RenameOrganizationDialog } from '../RenameOrganizationDialog';
import MenuPopup from './components/MenuPopup';


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    title: {
      flexGrow: 1,
    },
  }),
);

const Header: React.FunctionComponent<{}> = (props) => {
  const { user, hasPermission } = React.useContext(KeycloakContext);
  const api = React.useContext(ApiContext);
  const location = useLocation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const [organization, setOrganization] = React.useState<Organization>({} as Organization);
  const [organizationLoading, setOrganizationLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);

  const classes = useStyles();

  const showDialog = () => setIsOpen(true);
  const hideDialog = () => setIsOpen(false);

  const getOrganization = async () => {
    if (api && api.organizations) {
      setOrganizationLoading(true);
      const response = await api.organizations.getOrganization();
      if (response.kind === 'ok') {
        setOrganization(response.organization);
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
  const shouldRenameOrganization = !organizationLoading && (organization.name === user.preferredUsername);

  React.useEffect(() => {
    // no need to get organization to check if we don't have the permission to rename
    if (user.organizationId && canRename) {
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
          <Button color='secondary' onClick={() => {
            showDialog();
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


  const canSeeModels: boolean = React.useMemo(() => hasPermission(PERMISSIONS.models), []);
  const canSeeTranscribers: boolean = React.useMemo(() => hasPermission(PERMISSIONS.crud), []);

  const pathButtons: JSX.Element[] = [];
  Object.keys(PATHS).forEach((key, index) => {
    // to only display links for pages we are allowed to go to
    let shouldRender = true;
    if ((key === 'models' && !canSeeModels) || (key === 'transcribers' && !canSeeTranscribers)) {
      shouldRender = false;
    }

    if (shouldRender) {
      const path = PATHS[key];
      const { to, title } = path;
      if (title && to) {
        let isCurrentPath = false;
        if (location.pathname === PATHS.home.to && to === PATHS.home.to) {
          isCurrentPath = true;
        } else if (to !== PATHS.home.to && location.pathname.includes(to)) {
          isCurrentPath = true;
        }
        pathButtons.push(<Button key={index} component={Link} to={to} color={isCurrentPath ? "secondary" : "inherit"}>{(translate(`path.${title}`))}</Button>);
      }
    }
  });

  return (
    <AppBar
      position="static"
    >
      <Toolbar>
        <Typography variant="h6" noWrap className={classes.title}>
          Zeroth EE
        </Typography>
        {pathButtons}
        <MenuPopup />
      </Toolbar>
      <RenameOrganizationDialog name={organization.name} open={isOpen} onSuccess={getOrganization} onClose={hideDialog} />
    </AppBar>
  );
};

export default Header;
