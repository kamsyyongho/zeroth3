import { Container } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { PERMISSIONS } from '../../constants';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { Forbidden } from '../shared/Forbidden';
import { IAMTabs } from './IAMTabs';


export interface CheckedProjectsById {
  [index: number]: boolean;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    card: {
      backgroundColor: theme.palette.background.default,
    },
    cardContent: {
      padding: 0,
    },
  }),
);

export function IAM() {
  const { translate } = React.useContext(I18nContext);
  const { hasPermission } = React.useContext(KeycloakContext);

  const classes = useStyles();


  const usersAccess = React.useMemo(() => hasPermission(PERMISSIONS.users), []);
  const transcribersAccess = React.useMemo(() => hasPermission(PERMISSIONS.crud), []);

  if (!transcribersAccess && !usersAccess) {
    return <Forbidden />;
  }

  return (
    <Container >
      <Card elevation={0} className={classes.card} >
        <CardHeader
          title={translate("IAM.header")}
        />
        <CardContent className={classes.cardContent} >
          <IAMTabs transcribersAccess={transcribersAccess} usersAccess={usersAccess} />
        </CardContent>
      </Card>
    </Container >
  );
}
