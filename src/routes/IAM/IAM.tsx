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
import MoonLoader from 'react-spinners/MoonLoader';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { deleteUserResult } from '../../services/api/types/iam.types';
import { Role, User } from '../../types';
import log from '../../util/log/logger';
import { IAMTable } from './components/IAMTable';
import { InviteFormDialog } from './components/InviteFormDialog';


export interface CheckedUsersByUserId {
  [index: number]: boolean
}

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
  const [deleteLoading, setDeleteLoading] = React.useState(false)
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [checkedUsers, setCheckedUsers] = React.useState<CheckedUsersByUserId>({});

  const handleInviteOpen = () => {
    setInviteOpen(true);
  };
  const handleInviteClose = () => {
    setInviteOpen(false);
  };


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

  const handleUserDelete = async () => {
    //TODO
    //!
    //* DISPLAY A CONFIRMATION DIALOG FIRST
    const usersToDelete: number[] = [];
    Object.keys(checkedUsers).forEach(userId => {
      const checked = checkedUsers[Number(userId)]
      if (checked) {
        usersToDelete.push(Number(userId));
      }
    })
    setDeleteLoading(true);
    const deleteUserPromises: Promise<deleteUserResult>[] = [];
    usersToDelete.forEach(userId => {
      if (api && api.IAM) {
        deleteUserPromises.push(api.IAM.deleteUser(userId))
      } else {
        return;
      }
    })
    const responseArray = await Promise.all(deleteUserPromises);
    responseArray.forEach(response => {
      if (response.kind !== "ok") {
        //!
        //TODO
        //* DISPLAY SOMETHING HERE
        // ORGANIZATIONS MUST HAVE AT LEAST ONE MEMBER WITH A ROOT / ADMIN ROLE
        // DISPLAY ANY CAUGHT EXCEPTIONS AND REVERT THE STATE
        log({
          file: `IAM.tsx`,
          caller: `handleUserDelete`,
          value: response,
          error: true,
        })
      } else {
        //!
        //TODO
        //? UPDATE THE USER?
      }
    })
    setDeleteLoading(false);
  }

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
                onClick={handleUserDelete}
                startIcon={deleteLoading ? <MoonLoader
                  sizeUnit={"px"}
                  size={15}
                  color={"#ffff"}
                  loading={true}
                /> : <DeleteIcon />}
              >{translate("common.delete")}</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleInviteOpen}
                startIcon={<SendIcon />}
              >{translate("IAM.invite")}</Button>
            </>
          }
          title={translate("IAM.header")}
        />
        <CardContent className={classes.cardContent} >
          {usersLoading || rolesLoading ? <BulletList /> : <IAMTable users={users} roles={roles} setCheckedUsers={setCheckedUsers} />}
        </CardContent>
        <InviteFormDialog open={inviteOpen} onClose={handleInviteClose} />
      </Card>
    </Container >
  );
}
