import { Divider } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import PersonIcon from '@material-ui/icons/Person';
import React from 'react';
import { FiLogOut } from 'react-icons/fi';
import { useHistory, useLocation } from 'react-router-dom';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { KeycloakUser } from '../../../../hooks/keycloak/useKeycloak';
import { Organization, PATHS } from '../../../../types';
import { SvgIconWrapper } from '../../SvgIconWrapper';

const useStyles = makeStyles((theme) =>
  createStyles({
    menuButton: {
      marginRight: theme.spacing(2),
    },
  }),
);

interface MenuPopupProps {
  user?: KeycloakUser;
  organization?: Organization;
}

function MenuPopup(props: MenuPopupProps) {
  const { user, organization } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const history = useHistory();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const classes = useStyles();

  const isCurrentPath = location.pathname === PATHS.profile.to;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
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
      <IconButton onClick={handleClick} color={"inherit"} edge='start' className={classes.menuButton} ><AccountCircleIcon /></IconButton>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {(user?.email || organization?.name) && (<div>
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
            <PersonIcon color={isCurrentPath ? 'primary' : undefined} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: isCurrentPath ? 'primary' : undefined }} primary={translate('menu.profile')} />
        </MenuItem>
        <MenuItem onClick={api.logout}>
          <ListItemIcon>
            <SvgIconWrapper ><FiLogOut /></SvgIconWrapper>
          </ListItemIcon>
          <ListItemText primary={translate('menu.logout')} />
        </MenuItem>
      </Menu>
    </>
  );
}

export default MenuPopup;