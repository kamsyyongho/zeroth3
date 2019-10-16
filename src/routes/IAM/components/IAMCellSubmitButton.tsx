import Button from '@material-ui/core/Button';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { CellProps } from 'react-table';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { deleteRoleResult } from '../../../services/api/types/iam.types';
import { User } from '../../../types';
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
  cellData: CellProps<User>
  selectedRoles: SelectedRoleIdsByIndex
}

export function IAMCellSubmitButton(props: IAMCellSubmitButtonProps) {
  const { cellData, selectedRoles } = props
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext)

  const user: User = cellData.cell.value;
  const userRoles = user.roles;
  const index = cellData.cell.row.index;
  const key = `${index}-submit`;

  const initialSelectedRoleIds: number[] = React.useMemo(
    () => {
      if (!userRoles.length) {
        return []
      }
      return userRoles.map(role => role.id);
    }, []);

  let currentSelectedRoleIds: number[] | undefined;
  if (selectedRoles[index] && selectedRoles[index] instanceof Array) {
    currentSelectedRoleIds = selectedRoles[index];
  }

  // used to check for any changes so we can display the button
  const initialSet = new Set(initialSelectedRoleIds);
  const currentSet = new Set(currentSelectedRoleIds);

  const checkForRoleChange = () => {
    // when the user hasn't made any selections yet
    if (currentSelectedRoleIds === undefined) return false
    const setDifferences = differencesBetweenSets(initialSet, currentSet)
    return !isEqualSet<number>(initialSet, currentSet);
  };

  const classes = useStyles();
  const theme = useTheme();
  const rolesChanged = checkForRoleChange();

  const [isAddLoading, setIsAddLoading] = React.useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = React.useState(false)

  const addRoles = async (rolesToAdd: number[]) => {
    if (api && api.IAM) {
    setIsAddLoading(true);
      const response = await api.IAM.assignRoles(user.id, rolesToAdd);
      if(response.kind !== "ok"){
        //!
        //TODO
        //* DISPLAY SOMETHING HERE
        log({
          file: `IAMCellSubmitButton.tsx`,
          caller: `addRoles`,
          value: response,
          error: true,
          })
      } else {
        //!
        //TODO
        //? UPDATE THE USER?
      }
      setIsAddLoading(false);
    }
  }

  const deleteRoles = async (rolesToAdd: number[]) => {
      setIsDeleteLoading(true);
      const deleteRolePromises: Promise<deleteRoleResult>[] = [] ;
      rolesToAdd.forEach(roleId => {
        if (api && api.IAM){
          deleteRolePromises.push(api.IAM.deleteRole(user.id, roleId))
        } else {
          return;
        }
      })
      const responseArray = await Promise.all(deleteRolePromises);
      responseArray.forEach(response => {
        if(response.kind !== "ok"){
          //!
          //TODO
          //* DISPLAY SOMETHING HERE
          // ORGANIZATIONS MUST HAVE AT LEAST ONE MEMBER WITH A ROOT / ADMIN ROLE
          // DISPLAY ANY CAUGHT EXCEPTIONS AND REVERT THE STATE
          log({
            file: `IAMCellSubmitButton.tsx`,
            caller: `deleteRoles`,
            value: response,
            error: true,
            })
        } else {
          //!
          //TODO
          //? UPDATE THE USER?
        }
      })
      setIsDeleteLoading(false);
  }

  const submitRolesChange = async () => {
    if(!currentSelectedRoleIds) return
    const {extra, missing} = differencesBetweenSets(initialSet, currentSet);
    const rolesToAdd = Array.from(missing);
    const rolesToDelete = Array.from(extra);
    if(rolesToAdd.length) addRoles(rolesToAdd);
    if(rolesToDelete.length) deleteRoles(rolesToDelete);
  }

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
          color={'#ffff'}
          loading={true}
        /> : <CheckIcon />}
    >{translate("common.submit")}</Button>
  );
}