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
import React, { useRef, useGlobal } from 'reactn';
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
import {renderInputCombination} from '../../../constants';

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
            borderColor: '#077db5'
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

let updateLocalInput: string[] = [];
let allowKeyDown: boolean = false;

export function AssignShortCutDialog(props: AssignShortCutDialogProps) {
    const { open, hideBackdrop, onClose, selectedShortCut, selectedFunction, onConfirm } = props;
    const { enqueueSnackbar } = useSnackbar();
    const [shortcuts, setShortcuts] = useGlobal<any>('shortcuts');
    const { translate } = React.useContext(I18nContext);
    const api = React.useContext(ApiContext);
    const [loading, setLoading] = React.useState(false);
    const [isError, setIsError] = React.useState(false);
    const [isReset, setIsReset] = React.useState(false);
    const [inputCombination, setInputCombination] = React.useState('');
    const [localInput, setLocalInput] = React.useState<string[]>([]);
    const [isUnique, setIsUnique] = React.useState<boolean>(true);

    const functionArray = React.useMemo(() => Object.keys(shortcuts), [shortcuts]);
    const inputArray = React.useMemo(() => Object.values(shortcuts), [shortcuts])

    const theme = useTheme();
    const classes = useStyles();

    const handleClose = () => {
        init();
        onClose();
    };

    const init = () => {
        allowKeyDown = false;
        updateLocalInput = [];
        setLocalInput([]);
        setInputCombination('');
        setIsError(false);
        setIsReset(false);
    };

    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    const isUniqueInputCombination = () => {
        let isUnique = true;

        for(let i = 0; i < inputArray.length; i++) {
            if(renderInputCombination(inputArray[i]) === renderInputCombination(updateLocalInput)){
                isUnique = false;
            }
        }
        return isUnique;
    };

    const handleSubmit = () => {
        if(!isReset) {
            allowKeyDown = true;
            setIsReset(true);
            updateLocalInput = [];
            setLocalInput([]);
            setInputCombination('');
        } else {
            onConfirm(localInput);
            handleClose();
        }
    };

    const handleKeyDown = (event: any) => {
        const key = event.code === "Space" ? "Space" : event.key;
        if(allowKeyDown) {
            event.preventDefault();
            setIsUnique(true);
            if(key === 'Backspace' && updateLocalInput.length) {
                updateLocalInput.pop();
            } else {
                updateLocalInput.push(key);
            }
        }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        const isUnique = isUniqueInputCombination();
        if(isUnique) {
            setLocalInput(updateLocalInput);
            setInputCombination(renderInputCombination(updateLocalInput));
        } else {
            updateLocalInput = [];
            setIsUnique(false);
        }
    };

    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);


        }
    },[]);

    React.useEffect(() => {
        if(selectedShortCut?.length && !localInput?.length) {
            setLocalInput(selectedShortCut);
            updateLocalInput = selectedShortCut;
            setInputCombination(renderInputCombination(selectedShortCut));
        }
    }, [selectedShortCut]);

    React.useEffect(() => {
        if(!open) {
            init()
        }
    }, [open]);

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
                        <DialogTitle id="assign-shortcut-dialog">{translate(`editor.${selectedFunction}`)}</DialogTitle>
                        <DialogContent>
                            <TextField
                                id="shortcut-input"
                                label={translate('editor.input')}
                                value={inputCombination}
                                helperText={!isUnique && translate("editor.duplicateShortcut")}
                                error={!isUnique}
                                // onKeyPress={handleKeyDown}
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
                                disabled={!localInput.length}
                                onClick={handleSubmit}
                                color="primary"
                                variant="outlined"
                                startIcon={loading ?
                                    <MoonLoader
                                        sizeUnit={"px"}
                                        size={15}
                                        color={theme.palette.primary.main}
                                        loading={true}
                                    /> : (isReset ? <AddIcon /> : <EditIcon />)}
                            >
                                {translate(isReset ? "common.edit" : "common.reset")}
                            </Button>
                        </DialogActions>
                    </>
            }
        </Dialog>
    );
}