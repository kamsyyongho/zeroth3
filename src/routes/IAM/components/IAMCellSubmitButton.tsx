import Button from '@material-ui/core/Button';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import { useSnackbar } from 'notistack';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { CellProps } from 'react-table';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { deleteRoleResult } from '../../../services/api/types/iam.types';
import { User } from '../../../types';
import { SnackbarError } from '../../../types/snackbar.types';
import log from '../../../util/log/logger';
import { differencesBetweenSets, isEqualSet } from '../../../util/misc';
import { SelectedRoleIdsByIndex } from './IAMTable';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    hidden: {
      visibility: 'hidden',
    },
  }),
);

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface IAMCellSubmitButtonProps {
  cellData: CellProps<User>;
  selectedRoles: SelectedRoleIdsByIndex;
  onUpdateRoleSuccess: (updatedUser: User, userIndex: number) => void;
}

export function IAMCellSubmitButton(props: IAMCellSubmitButtonProps) {
  const { cellData, selectedRoles, onUpdateRoleSuccess } = props;
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();

  const user: User = cellData.cell.value;
  const userRoles = user.roles;
  const index = cellData.cell.row.index;
  const key = `${index}-submit`;

  const initialSelectedRoleIds: number[] = React.useMemo(
    () => {
      if (!userRoles.length) {
        return [];
      }
      return userRoles.map(role => role.id);
    }, [userRoles]);

  let currentSelectedRoleIds: number[] | undefined;
  if (selectedRoles[index] && selectedRoles[index] instanceof Array) {
    currentSelectedRoleIds = selectedRoles[index];
  }

  // used to check for any changes so we can display the button
  const initialSet = new Set(initialSelectedRoleIds);
  const currentSet = new Set(currentSelectedRoleIds);

  const checkForRoleChange = () => {
    // when the user hasn't made any selections yet
    if (currentSelectedRoleIds === undefined) return false;
    const setDifferences = differencesBetweenSets(initialSet, currentSet);
    return !isEqualSet<number>(initialSet, currentSet);
  };

  const classes = useStyles();
  const theme = useTheme();
  const rolesChanged = checkForRoleChange();

  const [isAddLoading, setIsAddLoading] = React.useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = React.useState(false);

  const addRoles = async (rolesToAdd: number[]) => {
    if (api && api.IAM) {
      setIsAddLoading(true);
      const response = await api.IAM.assignRolesToUser(user.id, rolesToAdd);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === "ok") {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        onUpdateRoleSuccess(response.user, index);
      } else {
        log({
          file: `IAMCellSubmitButton.tsx`,
          caller: `addRoles - failed to add roles`,
          value: response,
          error: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError && snackbarError.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setIsAddLoading(false);
    }
  };

  /**
   * Delete all roles and update the user stored in the parent
   * @param rolesToDelete 
   * @param willAddRoles determines if we will update the parent
   * - addRoles receives a user response, so that will be the most up to date
   * - so there is no need to update the parent from our build data
   */
  const deleteRoles = async (rolesToDelete: number[], willAddRoles: boolean) => {
    setIsDeleteLoading(true);
    const deleteRolePromises: Promise<deleteRoleResult>[] = [];
    rolesToDelete.forEach(roleId => {
      if (api && api.IAM) {
        deleteRolePromises.push(api.IAM.deleteRole(user.id, roleId));
      } else {
        return;
      }
    });
    const successfullyDeletedRoleIds: number[] = [];
    let roleIdIndexCounter = 0;

    const responseArray = await Promise.all(deleteRolePromises);
    const snackbarError: SnackbarError = {} as SnackbarError;
    responseArray.forEach(response => {
      if (response.kind === "ok") {
        // to build the array of deleted user role IDs
        successfullyDeletedRoleIds.push(rolesToDelete[roleIdIndexCounter]);
      } else {
        //!
        //TODO
        //* DISPLAY SOMETHING HERE
        // ORGANIZATIONS MUST HAVE AT LEAST ONE MEMBER WITH A ROOT / ADMIN ROLE
        // DISPLAY ANY CAUGHT EXCEPTIONS AND REVERT THE STATE
        log({
          file: `IAMCellSubmitButton.tsx`,
          caller: `deleteRoles - failed to delete role`,
          value: response,
          error: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
        snackbarError && snackbarError.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      }
      roleIdIndexCounter++;
    });


    // to prevent multiple success messages when removing multiple alerts
    // also only display success if there were no errors
    if (!willAddRoles && !snackbarError.isError) {
      enqueueSnackbar(translate('common.success'), { variant: 'success' });
    }

    // to build the user since it isn't returned from the server
    if (!willAddRoles) {
      const updatedUser = { ...user };
      updatedUser.roles = updatedUser.roles.filter(role => !successfullyDeletedRoleIds.includes(role.id));
      // to update the user in the parent
      onUpdateRoleSuccess(updatedUser, index);
    }

    setIsDeleteLoading(false);
  };

  const submitRolesChange = async () => {
    if (!currentSelectedRoleIds) return;
    const { extra, missing } = differencesBetweenSets(initialSet, currentSet);
    const rolesToAdd = Array.from(missing);
    const rolesToDelete = Array.from(extra);
    if (rolesToDelete.length) await deleteRoles(rolesToDelete, !!rolesToAdd.length);
    // delete roles before we add anthing
    // so we can receive the most up-to-date user as a response from addRoles
    if (rolesToAdd.length) addRoles(rolesToAdd);
  };

  return (
    <Button
      className={!rolesChanged ? classes.hidden : undefined}
      onClick={submitRolesChange}
      key={key}
      variant="contained"
      color="primary"
      startIcon={(isAddLoading || isDeleteLoading) ?
        <MoonLoader
          sizeUnit={"px"}
          size={15}
          color={theme.palette.common.white}
          loading={true}
        /> : <CheckIcon />}
    >{translate("common.submit")}</Button>
  );
}