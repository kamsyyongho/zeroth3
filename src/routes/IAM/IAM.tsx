import { Container, Grid } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import SendIcon from '@material-ui/icons/Send';
import { useSnackbar } from 'notistack';
import React from 'react';
import { BulletList } from 'react-content-loader';
import MoonLoader from 'react-spinners/MoonLoader';
import { PERMISSIONS } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { ProblemKind, ServerError } from '../../services/api/types';
import { deleteUserResult } from '../../services/api/types/iam.types';
import { Role, User } from '../../types';
import log from '../../util/log/logger';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { Forbidden } from '../shared/Forbidden';
import { IAMTable } from './components/IAMTable';
import { InviteFormDialog } from './components/InviteFormDialog';


export interface CheckedUsersByUserId {
  [index: number]: boolean;
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
  const api = React.useContext(ApiContext);
  const { hasPermission } = React.useContext(KeycloakContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = React.useState<User[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [isForbidden, setIsForbidden] = React.useState(false);
  const [usersLoading, setUsersLoading] = React.useState(true);
  const [rolesLoading, setRolesLoading] = React.useState(true);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [checkedUsers, setCheckedUsers] = React.useState<CheckedUsersByUserId>({});

  const classes = useStyles();
  const theme = useTheme();

  React.useEffect(() => {
    const getUsers = async () => {
      if (api && api.IAM) {
        const response = await api.IAM.getUsers();
        if (response.kind === 'ok') {
          setUsers(response.users);
        } else {
          if (response.kind === ProblemKind['forbidden']) {
            setIsForbidden(true);
          }
          log({
            file: `IAM.tsx`,
            caller: `getUsers - failed to get users`,
            value: response,
            important: true,
          });
        }
        setUsersLoading(false);
      }
    };
    const getRoles = async () => {
      if (api && api.IAM) {
        const response = await api.IAM.getRoles();
        if (response.kind === 'ok') {
          setRoles(response.roles);
        } else {
          if (response.kind === ProblemKind['forbidden']) {
            setIsForbidden(true);
          }
          log({
            file: `IAM.tsx`,
            caller: `getRoles - failed to get roles`,
            value: response,
            important: true,
          });
        }
        setRolesLoading(false);
      }
    };
    const hasAccess = hasPermission(PERMISSIONS.IAM);
    if (hasAccess) {
      getUsers();
      getRoles();
    } else {
      setIsForbidden(true);
    }
  }, []);

  if (isForbidden) {
    return <Forbidden />;
  }

  const handleInviteOpen = () => {
    setInviteOpen(true);
  };
  const handleInviteClose = () => {
    setInviteOpen(false);
  };

  /**
   * remove the deleted users from all lists
   */
  const handleUpdateSuccess = (updatedUser: User) => {
    const usersCopy = users.slice();
    for (let i = users.length - 1; i >= 0; i--) {
      const user = users[i];
      if (user.id === updatedUser.id) {
        usersCopy.splice(i, 1, updatedUser);
      }
      setUsers(usersCopy);
    };
  };

  let usersToDelete: number[] = [];
  Object.keys(checkedUsers).forEach(userId => {
    const checked = checkedUsers[Number(userId)];
    if (checked) {
      usersToDelete.push(Number(userId));
    }
  });

  const confirmDelete = () => setConfirmationOpen(true);
  const closeConfirmation = () => setConfirmationOpen(false);

  /**
   * remove the deleted users from all lists
   */
  const handleDeleteSuccess = (idsToDelete: number[]) => {
    const usersCopy = users.slice();
    // count down to account for removing indexes
    for (let i = users.length - 1; i >= 0; i--) {
      const user = users[i];
      if (idsToDelete.includes(user.id)) {
        usersCopy.splice(i, 1);
      }
    }
    usersToDelete = [];
    setCheckedUsers({});
    setUsers(usersCopy);
  };

  const handleUserDelete = async () => {
    setDeleteLoading(true);
    closeConfirmation();
    const deleteUserPromises: Promise<deleteUserResult>[] = [];
    const successIds: number[] = [];
    usersToDelete.forEach(userId => {
      if (api && api.IAM) {
        deleteUserPromises.push(api.IAM.deleteUser(userId));
      } else {
        return;
      }
    });
    let serverError: ServerError | undefined;
    const responseArray = await Promise.all(deleteUserPromises);
    responseArray.forEach((response, responseIndex) => {
      if (response.kind !== "ok") {
        //!
        //TODO
        //* DISPLAY SOMETHING HERE
        // ORGANIZATIONS MUST HAVE AT LEAST ONE MEMBER WITH A ROOT / ADMIN ROLE
        // DISPLAY ANY CAUGHT EXCEPTIONS AND REVERT THE STATE
        log({
          file: `IAM.tsx`,
          caller: `handleUserDelete - Error:`,
          value: response,
          error: true,
        });
        serverError = response.serverError;
        let errorMessageText = translate('common.error');
        if (serverError && serverError.message) {
          errorMessageText = serverError.message;
        }
        enqueueSnackbar(errorMessageText, { variant: 'error' });
      } else {
        successIds.push(usersToDelete[responseIndex]);
        enqueueSnackbar(translate('common.success'), { variant: 'success', preventDuplicate: true });
      }
    });
    // update the user list
    handleDeleteSuccess(successIds);
    setDeleteLoading(false);
  };

  const renderCardHeaderAction = () => (<Grid container spacing={1} >
    <Grid item >
      <Button
        disabled={!usersToDelete.length}
        variant="contained"
        color="secondary"
        onClick={confirmDelete}
        startIcon={deleteLoading ? <MoonLoader
          sizeUnit={"px"}
          size={15}
          color={theme.palette.common.white}
          loading={true}
        /> : <DeleteIcon />}
      >
        {translate('common.delete')}
      </Button>
    </Grid>
    <Grid item >
      <Button
        variant="contained"
        color="primary"
        onClick={handleInviteOpen}
        startIcon={<SendIcon />}
      >{translate("IAM.invite")}
      </Button>
    </Grid>
  </Grid>);

  return (
    <Container maxWidth={false} className={classes.container} >
      <Card >
        <CardHeader
          action={!(usersLoading || rolesLoading) && renderCardHeaderAction()}
          title={translate("IAM.header")}
        />
        <CardContent className={classes.cardContent} >
          {usersLoading || rolesLoading ? <BulletList /> :
            <IAMTable
              users={users}
              roles={roles}
              setCheckedUsers={setCheckedUsers}
              handleUpdateSuccess={handleUpdateSuccess}
            />
          }
        </CardContent>
        <InviteFormDialog open={inviteOpen} onClose={handleInviteClose} />
        <ConfirmationDialog
          destructive
          titleText={`${translate('IAM.deleteUser', { count: usersToDelete.length })}?`}
          submitText={translate('common.delete')}
          open={confirmationOpen}
          onSubmit={handleUserDelete}
          onCancel={closeConfirmation}
        />
      </Card>
    </Container >
  );
};
