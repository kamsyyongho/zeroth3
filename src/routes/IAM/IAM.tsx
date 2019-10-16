import { Container } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import SendIcon from '@material-ui/icons/Send';
import React from 'react';
import { BulletList } from 'react-content-loader';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { Role, User } from '../../types';
import log from '../../util/log/logger';
import { IAMTable } from './components/IAMTable';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      padding: 0,
    },
    cardContent: {
      padding: 0,
    },
  }),
);

export function IAM() {
  const api = React.useContext(ApiContext)
  const { translate } = React.useContext(I18nContext);
  const [users, setUsers] = React.useState<User[]>([])
  const [roles, setRoles] = React.useState<Role[]>([])
  const [usersLoading, setUsersLoading] = React.useState(true)
  const [rolesLoading, setRolesLoading] = React.useState(true)

  React.useEffect(() => {
    const getUsers = async () => {
      if (api && api.IAM) {
        const response = await api.IAM.getUsers();
        if (response.kind === "ok") {
          setUsers(response.users)
        } else {
          log({
            file: `IAM.tsx`,
            caller: `getUsers - failed to get users`,
            value: response,
            important: true,
          })
        }
        setUsersLoading(false);
      }
    }
    const getRoles = async () => {
      if (api && api.IAM) {
        const response = await api.IAM.getRoles();
        if (response.kind === "ok") {
          setRoles(response.roles)
        } else {
          log({
            file: `IAM.tsx`,
            caller: `getRoles - failed to get roles`,
            value: response,
            important: true,
          })
        }
        setRolesLoading(false);
      }
    }
    getUsers();
    getRoles();
  }, []);

  const classes = useStyles();

  return (
    <Container maxWidth={false} className={classes.container} >
      <Card >
        <CardHeader
          action={!(usersLoading || rolesLoading) &&
            <>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<DeleteIcon />}
              >{translate("common.delete")}</Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
              >{translate("IAM.invite")}</Button>
            </>
          }
          title={translate("IAM.header")}
        />
        <CardContent className={classes.cardContent} >
          {usersLoading || rolesLoading ? <BulletList /> : <IAMTable users={users} roles={roles} />}
        </CardContent>
      </Card>
    </Container >
  );
}
