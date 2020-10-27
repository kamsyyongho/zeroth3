import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'reactn';
import { I18nContext } from '../../hooks/i18n/I18nContext';

interface ConfirmationDialogProps {
    open: boolean;
    onSubmit: () => void;
    onCancel: () => void;
    /**
     * determines the button's confirmation color
     */
    destructive?: boolean;
    submitText?: string | null;
    cancelText?: string | null;
    titleText?: string | null;
    contentText?: string | null;
}

export function ConfirmationDialog(props: ConfirmationDialogProps) {
    const { open, onSubmit, onCancel, destructive, submitText, cancelText, titleText, contentText } = props;
    const { translate } = React.useContext(I18nContext);

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            {titleText && <DialogTitle id="alert-dialog-title">{titleText}</DialogTitle>}
            <DialogContent>
                {contentText &&
                <DialogContentText id="alert-dialog-description">
                    {contentText}
                </DialogContentText>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="primary">
                    {cancelText || translate('common.cancel')}
                </Button>
                <Button onClick={onSubmit} color={destructive ? 'secondary' : 'primary'} variant={'outlined'} autoFocus>
                    {submitText || translate('common.okay')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
