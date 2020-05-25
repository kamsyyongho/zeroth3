import { Container } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'reactn';
import { PERMISSIONS } from '../../constants';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { CustomTheme } from '../../theme';
import { setPageTitle } from '../../util/misc';
import { Forbidden } from '../shared/Forbidden';
import { IAMTabs } from './IAMTabs';


export interface CheckedProjectsById {
  [index: number]: boolean;
}

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    card: {
      backgroundColor: theme.palette.background.default,
    },
    cardContent: {
      padding: 0,
    },
    font: {
      fontFamily: 'Muli',
      fontWeight: 'bold',
      color: theme.header.lightBlue,
    }
  }),
);

export function IAM() {
  const { translate } = React.useContext(I18nContext);
  const { hasPermission, roles } = React.useContext(KeycloakContext);

  const classes = useStyles();


  const usersAccess = React.useMemo(() => hasPermission(roles, PERMISSIONS.IAM.users), [roles]);
  const transcribersAccess = React.useMemo(() => hasPermission(roles, PERMISSIONS.IAM.transcribers), [roles]);

  React.useEffect(() => {
      console.log('============= roles :',roles)
    setPageTitle(translate('path.IAM'));
  }, []);

  if (!transcribersAccess && !usersAccess) {
    return <Forbidden />;
  }

  return (
    <Container >
      <Card elevation={0} className={classes.card} >
        <CardHeader
          title={translate("IAM.header")}
          titleTypographyProps={{
            className: classes.font,
          }}
        />
        <CardContent className={classes.cardContent} >
          <IAMTabs transcribersAccess={transcribersAccess} usersAccess={usersAccess} />
        </CardContent>
      </Card>
    </Container >
  );
}
