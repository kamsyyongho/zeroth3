import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import React from 'reactn';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { CustomTheme } from '../../../theme';
import * as yup from 'yup';

interface CreateSetFormDialogProps {
    open: boolean;
    buttonMsg: string;
    contentMsg: string;
    isConfirm: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onReject: () => void;
}

const useStyles = makeStyles((theme: CustomTheme) =>
    createStyles({
        formControl: {
            // margin: theme.spacing(1),
            margin: 'auto',
            minWidth: 200,
        },
        dialogContent: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        processedText: {
            color: theme.palette.primary.main,
        },
        tableRow: {
            borderWidth: 1,
            borderColor: theme.table.border,
            border: 'solid',
            borderCollapse: undefined,
        },
        button: {
            marginLeft: '15px',
            width: '90px',
        },
        buttonReject: {
            backgroundColor: '#c33636',
        }
    }));

export function ConfirmationDialog(props: CreateSetFormDialogProps) {
    const { contentMsg , buttonMsg, isConfirm, open, onClose, onConfirm, onReject } = props;
    const { translate } = React.useContext(I18nContext);
    const [loading, setLoading] = React.useState(false);
    const [setType, setSetType] = React.useState("none");
    const classes = useStyles();
    const theme = useTheme();
    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    const handleClose = () => {
        setLoading(false);
        setSetType('none');
        onClose();
    };

    return (
        <Dialog
            fullScreen={fullScreen}
            open={open}
            onClose={handleClose}
            disableBackdropClick={loading}
            disableEscapeKeyDown={loading}
            aria-labelledby="create-set-dialog"
        >
            <DialogTitle id="create-set-dialog">
                {contentMsg}

            </DialogTitle>
              <DialogContent className={classes.dialogContent}>
              </DialogContent>
              <DialogActions>
                  <Button disabled={loading} onClick={onClose} color="primary">
                      {translate("common.cancel")}
                  </Button>
                  {
                      isConfirm ?
                          <Button
                              className={classes.button}
                              variant='contained'
                              color="primary"
                              size='small'
                              onClick={onConfirm}>
                              {buttonMsg}
                          </Button>
                          :
                          <Button
                              onClick={onReject}
                              className={[classes.button, classes.buttonReject].join(' ')}
                              color='secondary'
                              variant='contained'
                              size='small'>
                              {buttonMsg}
                          </Button>
                  }

              </DialogActions>

        </Dialog>
    );
}