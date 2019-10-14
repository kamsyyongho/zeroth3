import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MenuIcon from '@material-ui/icons/Menu';
import React, { useContext, useState } from 'react';
import { FiLogOut } from 'react-icons/fi';
import { MdTranslate } from 'react-icons/md';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { SvgIconWrapper } from '../../SvgIconWrapper';

function MenuPopup() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const api = useContext(ApiContext)
  const { translate, toggleLanguage } = useContext(I18nContext);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick} color={"inherit"}><MenuIcon /></IconButton>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={toggleLanguage}>
          <ListItemIcon>
            <SvgIconWrapper ><MdTranslate /></SvgIconWrapper>
          </ListItemIcon>
          <ListItemText primary={translate('menu.changeLanguage')} />
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

export default MenuPopup