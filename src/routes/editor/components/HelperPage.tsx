import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import clsx from 'clsx';
import { Field, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import * as yup from 'yup';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { postSubGraphResult } from '../../../services/api/types';
import { SnackbarError,
    SNACKBAR_VARIANTS,
    SubGraph,
    TopGraph,
    TRAINING_DATA_TYPE_SUB_GRAPH,
    TRAINING_DATA_TYPE_SUB_GRAPH_VALUES } from '../../../types';
import log from '../../../util/log/logger';
import { CheckboxFormField } from '../../shared/form-fields/CheckboxFormField';
import { DropZoneFormField } from '../../shared/form-fields/DropZoneFormField';
import { SelectFormField, SelectFormFieldOptions } from '../../shared/form-fields/SelectFormField';
import { SwitchFormField } from '../../shared/form-fields/SwitchFormField';
import { TextFormField } from '../../shared/form-fields/TextFormField';

const useStyles = makeStyles((theme) =>
    createStyles({
        hidden: {
            visibility: 'hidden',
        },
        hiddenTextInput: {
            height: 0,
            visibility: 'hidden',
        },
    }),
);

interface HelperPageProps {
    open: boolean;
    hideBackdrop?: boolean;
    onClose: () => void;
    onSuccess: (subGraph: SubGraph, isEdit?: boolean) => void;
}

export function HelperPage(props: HelperPageProps) {
    const { open, hideBackdrop, onClose, onSuccess } = props;
    const { enqueueSnackbar } = useSnackbar();
    const { translate } = React.useContext(I18nContext);
    const api = React.useContext(ApiContext);
    const [loading, setLoading] = React.useState(false);
    const [isError, setIsError] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);

    const theme = useTheme();
    const classes = useStyles();

    const handleClose = () => {
        setIsError(false);
        onClose();
    };

    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    const handleSubmit = () => {

    };

    return (
        <Dialog
            fullScreen={fullScreen}
            disableBackdropClick={loading}
            disableEscapeKeyDown={loading}
            open={open}
            onClose={handleClose}
            aria-labelledby="sub-graph-dialog"
            BackdropProps={{
                className: clsx(hideBackdrop && classes.hidden),
            }}
        >
            <DialogTitle id="sub-graph-dialog">{translate(`models.${isEdit ? 'editSubGraph' : 'createSubGraph'}`)}</DialogTitle>
            <DialogContent>

            </DialogContent>
            <DialogActions>
                <Button disabled={loading} onClick={handleClose} color="primary">
                    {translate("common.cancel")}
                </Button>
                <Button
                    disabled={loading}
                    onClick={handleSubmit}
                    color="primary"
                    variant="outlined"
                    startIcon={loading ?
                        <MoonLoader
                            sizeUnit={"px"}
                            size={15}
                            color={theme.palette.primary.main}
                            loading={true}
                        /> : (isEdit ? <EditIcon /> : <AddIcon />)}
                >
                    {translate(isEdit ? "common.edit" : "common.create")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}