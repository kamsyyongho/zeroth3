import { Divider } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { KeycloakUser } from '../../../../hooks/keycloak/useKeycloak';
import { ICONS } from '../../../../theme/icons';
import { Organization, PATHS } from '../../../../types';

const useStyles = makeStyles((theme) =>
  createStyles({
    userInfo: {
      outline: 'none', // removes the focus outline,
    },
  }),
);

interface MenuPopupProps {
  user?: KeycloakUser;
  organization?: Organization;
  onClick?: () => void;
}

function MenuPopup(props: MenuPopupProps) {
  const { user, organization, onClick } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const history = useHistory();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const classes = useStyles();
  const theme = useTheme();

  const isCurrentPath = location.pathname === PATHS.profile.to;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick && typeof onClick === 'function') {
      onClick();
    }
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const navigateToProfile = () => {
    if (!isCurrentPath && PATHS.profile.to) {
      history.push(PATHS.profile.to);
    }
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick} color={"inherit"} edge='start' >
        <ICONS.Profile style={{ color: theme.palette.secondary.contrastText }} />
      </IconButton>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {(user?.email || organization?.name) && (<div
          className={classes.userInfo}>
          <ListItem >
            <ListItemText
              primary={user?.email ? user.email : undefined}
              secondary={organization?.name ? organization.name : undefined}
            />
          </ListItem>
          <Divider />
        </div>)}
        <MenuItem onClick={navigateToProfile} >
          <ListItemIcon >
            <ICONS.Account color={isCurrentPath ? 'primary' : undefined} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: isCurrentPath ? 'primary' : undefined }} primary={translate('menu.profile')} />
        </MenuItem>
        <MenuItem onClick={api.logout}>
          <ListItemIcon>
            <ICONS.Logout />
          </ListItemIcon>
          <ListItemText primary={translate('menu.logout')} />
        </MenuItem>
      </Menu>
    </>
  );
}

export default MenuPopup;