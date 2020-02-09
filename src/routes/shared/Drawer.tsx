import { Divider } from '@material-ui/core';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { PERMISSIONS } from '../../constants';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { PATHS } from '../../types';

const useStyles = makeStyles((theme) =>
  createStyles({
    contents: {
      width: 'auto',
      minWidth: 275,
      marginTop: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 75,
    },
    divider: {
      marginLeft: '10%',
      marginRight: '10%'
    },
  }),
);

interface AppDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const AppDrawer = (props: AppDrawerProps) => {
  const { open, setOpen } = props;
  const { hasPermission } = React.useContext(KeycloakContext);
  const { translate } = React.useContext(I18nContext);
  const location = useLocation();
  const history = useHistory();
  const classes = useStyles();
  const theme = useTheme();

  const navigateToPage = (to: string, isCurrentPath: boolean) => {
    if (!isCurrentPath && to) {
      history.push(to);
      setOpen(false);
    }
  };

  const canSeeModels: boolean = React.useMemo(() => hasPermission(PERMISSIONS.models), []);
  const canSeeUsers: boolean = React.useMemo(() => hasPermission(PERMISSIONS.users), []);
  const canSeeTranscribers: boolean = React.useMemo(() => hasPermission(PERMISSIONS.crud), []);

  const drawerItems: JSX.Element[] = [];
  Object.keys(PATHS).forEach((key, index) => {
    // to only display links for pages we are allowed to go to
    let shouldRender = true;
    if ((key === 'models' && !canSeeModels) || (key === 'IAM' && !canSeeTranscribers && !canSeeUsers)) {
      shouldRender = false;
    }

    if (shouldRender) {
      const path = PATHS[key];
      const { to, title, Icon, hasDivider } = path;
      if (title && to) {
        let isCurrentPath = false;
        if (location.pathname === PATHS.home.to && to === PATHS.home.to) {
          isCurrentPath = true;
        } else if (to !== PATHS.home.to && location.pathname.includes(to)) {
          isCurrentPath = true;
        }

        drawerItems.push(<React.Fragment key={index} >
          {hasDivider && <Divider className={classes.divider} />}
          <ListItem button onClick={() => navigateToPage(to, isCurrentPath)} >
            {Icon && <ListItemIcon >
              <Icon color={isCurrentPath ? 'primary' : undefined} />
            </ListItemIcon>}
            <ListItemText primaryTypographyProps={{ color: isCurrentPath ? 'primary' : undefined }} primary={(translate(`path.${title}`))} />
          </ListItem>
        </React.Fragment>);
      }
    }
  });

  const toggleDrawer = (open: boolean) => (
    event: React.KeyboardEvent | React.MouseEvent,
  ) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setOpen(open);
  };

  return (
    <Drawer
      open={open}
      onClose={toggleDrawer(false)}
      // this needs to be an inline style to remain under the navbar
      style={{ zIndex: theme.zIndex.drawer }}
    >
      <div
        className={classes.contents}
        role="presentation"
        onClick={toggleDrawer(false)}
        onKeyDown={toggleDrawer(false)}
      >
        <List>
          {drawerItems}
        </List>
      </div>
    </Drawer>
  );
};
