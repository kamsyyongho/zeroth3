import { Button } from '@material-ui/core';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Paper from '@material-ui/core/Paper';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import React from 'react';
import { Link } from 'react-router-dom';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../theme';
import { Path } from '../../types';


const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    paper: {
      backgroundColor: theme.palette.background.default,
      padding: theme.spacing(1, 2),
    },
    button: {
      textTransform: 'none',
      fontSize: '1.25rem',
      fontFamily: 'Muli',
      fontWeight: 'bold',
    },
    font: {
      fontFamily: 'Muli',
      fontWeight: 'bold',
      color: theme.header.lightBlue,
    }
  }),
);

export interface Breadcrumb extends Path {
  /**
   * text to use as-is
   * - will not be translated
   */
  rawTitle?: string;
}

interface HeaderBreadcrumbsProps {
  breadcrumbs: Breadcrumb[];
}

export const HeaderBreadcrumbs = (props: HeaderBreadcrumbsProps) => {
  const { breadcrumbs } = props;
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();

  const renderBreadcrumbs = () => breadcrumbs.map((breadcrumb, index) => {
    const { to, title, rawTitle } = breadcrumb;
    const text = rawTitle || translate(`path.${title}`);
    if (!to) {
      return <Typography key={index} variant='h6' className={classes.font} >{text}</Typography>;
    }
    return (
      <Button
        key={index}
        component={Link}
        to={to}
        color='inherit'
        className={classes.button}
      >
        {text}
      </Button>
    );
  });

  return (
    <Paper elevation={0} className={classes.paper}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        {renderBreadcrumbs()}
      </Breadcrumbs>
    </Paper>
  );
};