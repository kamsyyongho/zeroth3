import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { TextField } from '@material-ui/core';
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
import {renderInputCombination} from '../../../constants'

const useStyles = makeStyles((theme) =>
    createStyles({
        hidden: {
            visibility: 'hidden',
        },
        hiddenTextInput: {
            height: 0,
            visibility: 'hidden',
        },
        apiInfo: {
            minWidth: 250,
            backgroundColor: theme.palette.grey[200],
        },
        textField: {
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1),
        },
    }),
);

interface AssignShortCutDialogProps {
    open: boolean;
    hideBackdrop?: boolean;
    selectedShortCut?: any;
    selectedFunction: string;
    onClose: () => void;
    onConfirm: (input: string[]) => void;
}

export function AssignShortCutDialog(props: AssignShortCutDialogProps) {
    const { open, hideBackdrop, onClose, selectedShortCut, selectedFunction, onConfirm } = props;
    const { enqueueSnackbar } = useSnackbar();
    const { translate } = React.useContext(I18nContext);
    const api = React.useContext(ApiContext);
    const [loading, setLoading] = React.useState(false);
    const [isError, setIsError] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [inputCombination, setInputCombination] = React.useState('');
    const [localInput, setLocalInput] = React.useState<string[]>(selectedShortCut);

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

    const handleKeyDown = (event: KeyboardEvent) => {
        event.preventDefault();
        console.log('event : ', localInput);
        if(localInput?.length) {
            const updateLocalInput = [...localInput];
            if(event.key === 'Backspace') {
                updateLocalInput.pop();
            } else {
                updateLocalInput.push(event.key);
            }
            setLocalInput(updateLocalInput);
            setInputCombination(renderInputCombination(updateLocalInput));
        }


    };

    const handleKeyUp = (event: KeyboardEvent) => {

    };

    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        }
    },[]);

    React.useEffect(() => {
        console.log('==============localInput', localInput)
    }, [localInput]);

    React.useEffect(() => {
        if(selectedShortCut?.length) {
            console.log(selectedShortCut);
            setLocalInput(selectedShortCut);
            setInputCombination(renderInputCombination(selectedShortCut));
        }
    }, [selectedShortCut])

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
            {
                selectedShortCut && selectedFunction &&
                    <>
                        <DialogTitle id="sub-graph-dialog">{translate(`editor.${selectedFunction}`)}</DialogTitle>
                        <DialogContent>
                            <TextField
                                id="api-key"
                                value={inputCombination}
                                className={clsx(classes.textField, classes.apiInfo)}
                                margin="normal"
                                variant="outlined"
                            />
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
                    </>
            }
        </Dialog>
    );
}