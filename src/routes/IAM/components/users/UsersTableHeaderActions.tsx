import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { useTheme } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import SendIcon from '@material-ui/icons/Send';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { User } from '../../../../types';

interface UsersTableHeaderActionsProps {
  users: User[];
  usersToDelete: string[];
  confirmDelete: () => void;
  handleInviteOpen: () => void;
  deleteLoading: boolean;
}

export default function UsersTableHeaderActions(props: UsersTableHeaderActionsProps) {
  const { users, usersToDelete, confirmDelete, handleInviteOpen, deleteLoading } = props;
  const { translate } = React.useContext(I18nContext);

  const theme = useTheme();

  return (
    <Grid container spacing={1} >
      {users.length > 1 && <Grid item >
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
      </Grid>}
      <Grid item >
        <Button
          variant="contained"
          color="primary"
          onClick={handleInviteOpen}
          startIcon={<SendIcon />}
        >{translate("IAM.invite")}
        </Button>
      </Grid>
    </Grid>
  );
};