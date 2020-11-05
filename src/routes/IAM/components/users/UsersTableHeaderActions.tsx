import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { useTheme, createStyles, makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import SendIcon from '@material-ui/icons/Send';
import GraphicEqIcon from '@material-ui/icons/GraphicEq';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import Switch from '@material-ui/core/Switch';
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
  handleVoiceMaskingRequest: () => void;
  voiceMaskingRequired: boolean;
}

export default function UsersTableHeaderActions(props: UsersTableHeaderActionsProps) {
  const { users, usersToDelete, confirmDelete, handleInviteOpen, deleteLoading, handleVoiceMaskingRequest, voiceMaskingRequired } = props;
  const { translate } = React.useContext(I18nContext);
  const [localVoiceMaskingRequired, setLocalVoiceMaskingRequired] = React.useState(false);

  const classes = useStyles();
  const theme = useTheme();

  const handleVoiceMaskingSwitch = (event: any) => {
    setLocalVoiceMaskingRequired(event.target.checked);
    handleVoiceMaskingRequest();
  };

  React.useEffect(() => {
    if(localVoiceMaskingRequired !== voiceMaskingRequired) {
      setLocalVoiceMaskingRequired(voiceMaskingRequired);
    }
  }, [voiceMaskingRequired, localVoiceMaskingRequired])

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
          {/*<Button*/}
          {/*    variant="contained"*/}
          {/*    color="primary"*/}
          {/*    onClick={handleVoiceMaskingRequest}*/}
          {/*    startIcon={<GraphicEqIcon />}*/}
          {/*>{translate("IAM.requestVoiceMasking")}*/}
          {/*</Button>*/}
          {/*<Switch*/}
          {/*    checked={voiceMaskingRequired}*/}
          {/*    onChange={handleVoiceMaskingRequest}*/}
          {/*    color="primary"*/}
          {/*    name="voiceMaskingSwitch"*/}
          {/*    inputProps={{ 'aria-label': 'primary checkbox' }}*/}
          {/*/>*/}
          <FormControlLabel
              control={<Switch color="primary" value={voiceMaskingRequired} onChange={handleVoiceMaskingSwitch} />}
              label={translate("IAM.requestVoiceMasking")}
              labelPlacement="top" />
        </Grid>
      </Grid>
    </Grid>
  );
};
