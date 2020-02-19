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
import { Forbidden } from '../shared/Forbidden';
import { ModelTabs } from './components/ModelTabs';


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

export function Models() {
  const { translate } = React.useContext(I18nContext);
  const { hasPermission, roles } = React.useContext(KeycloakContext);

  const classes = useStyles();

  const canSeeModels = React.useMemo(() => hasPermission(roles, PERMISSIONS.models), [roles]);

  React.useEffect(() => {
    document.title = translate('path.models');
  }, []);

  if (!canSeeModels) {
    return <Forbidden />;
  }

  return (
    <Container >
      <Card elevation={0} className={classes.card} >
        <CardHeader
          title={translate("models.header")}
          titleTypographyProps={{
            className: classes.font,
          }}
        />
        <CardContent className={classes.cardContent} >
          <ModelTabs />
        </CardContent>
      </Card>
    </Container >
  );
}
