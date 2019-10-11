import { Button, Toolbar } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { Link, useLocation } from "react-router-dom";
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

interface Path {
  to: string
  title: string
}

const PATHS: { [x: string]: Path } = {
  home: {
    to: "/",
    title: "Home"
  },
  about: {
    to: "/about",
    title: "About"
  },
  topics: {
    to: "/topics",
    title: "Topics"
  },
  drawer: {
    to: "/drawer",
    title: "Drawer"
  },
  simple: {
    to: "/simple",
    title: "Simple"
  },
  multi: {
    to: "/multi",
    title: "Multi"
  },
  list: {
    to: "/list",
    title: "List"
  },
  table: {
    to: "/table",
    title: "Table"
  },
}

const Header: React.FunctionComponent<{}> = (props) => {
  const classes = useStyles()
  const location = useLocation()

  const pathButtons: JSX.Element[] = Object.keys(PATHS).map((key, index) => {
    const path = PATHS[key]
    const { to, title } = path
    const isCurrentPath = location.pathname === to
    return (<Button key={index} component={Link} to={to} color={isCurrentPath ? "secondary" : "inherit"}>{title}</Button>)
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
