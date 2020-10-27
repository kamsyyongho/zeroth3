import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { useTheme, createStyles, makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import SendIcon from '@material-ui/icons/Send';
import GraphicEqIcon from '@material-ui/icons/GraphicEq';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { User } from '../../../../types';

const useStyles = makeStyles((theme) =>
    createStyles({
      headerAction: {
        marginTop: '20px',
        display: 'flex',
        alignItems: 'end',
        justifyContent: 'end',
      }
    }));

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

  const classes = useStyles();
  const theme = useTheme();

  return (
    <Grid container spacing={1} direction="column" alignItems="flex-end">
      <Grid container direction="row" spacing={1} xs={4}>
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
        <Grid item >
          <Button
              variant="contained"
              color="primary"
              onClick={handleInviteOpen}
              startIcon={<GraphicEqIcon />}
          >{translate("IAM.requestVoiceMasking")}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};
