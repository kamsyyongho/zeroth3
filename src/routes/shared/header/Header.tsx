import { Button, Toolbar } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { PATHS } from '../../../types';
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
  const classes = useStyles()
  const location = useLocation()
  const { translate } = React.useContext(I18nContext);

  const pathButtons: JSX.Element[] = [];
  Object.keys(PATHS).forEach((key, index) => {
    const path = PATHS[key]
    const { to, title } = path
    if (title && to) {
      let isCurrentPath = false;
      if (location.pathname === PATHS.home.to && to === PATHS.home.to) {
        isCurrentPath = true;
      } else if (to !== PATHS.home.to && location.pathname.includes(to)) {
        isCurrentPath = true;
      }
      pathButtons.push(<Button key={index} component={Link} to={to} color={isCurrentPath ? "secondary" : "inherit"}>{(translate(`path.${title}`))}</Button>)
    }
  })

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
    </AppBar>
  );
};

export default Header;
