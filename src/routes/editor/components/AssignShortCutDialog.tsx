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


export function AssignShortCutDialog(props: AssignShortCutDialogProps) {
    const { open, hideBackdrop, onClose, selectedShortCut, selectedFunction, onConfirm } = props;
    const { enqueueSnackbar } = useSnackbar();
    const [shortcuts, setShortcuts] = useGlobal<any>('shortcuts');
    const { translate } = React.useContext(I18nContext);
    const api = React.useContext(ApiContext);
    const [loading, setLoading] = React.useState(false);
    const [inputCombination, setInputCombination] = React.useState('');
    const [localInput, setLocalInput] = React.useState<string[]>([]);
    const [isUnique, setIsUnique] = React.useState<boolean>(true);
    const [isInvalid, setIsInvalid] = React.useState<boolean>(true);
    const [errorMsg, setErrorMsg] = React.useState<string>('');

    const functionArray = React.useMemo(() => Object.keys(shortcuts), [shortcuts]);
    const inputArray = React.useMemo(() => Object.values(shortcuts), [shortcuts])

    const theme = useTheme();
    const classes = useStyles();

    const handleClose = () => {
        init();
        onClose();
    };

    const init = () => {
        setLocalInput([]);
        setInputCombination('');
        setIsInvalid(true);
    };

    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    const isUniqueInputCombination = () => {
        let isUnique = true;
        for(let i = 0; i < inputArray.length; i++) {
            if(renderInputCombination(inputArray[i]) === renderInputCombination(localInput)){
                isUnique = false;
            }
        }
        return isUnique;
    };

    const isFirstKeyMeta = () => {
        const firstKeyOptions = ['Meta', 'Control', 'Shift', 'Opt', 'Alt'];
        if(!firstKeyOptions.includes(localInput[0])) {
            return false;
        } else {
            return true;
        }
    };

    const validateInputCombination = () => {
      const isUnique = isUniqueInputCombination();
      const isValidInitialKey = isFirstKeyMeta();

      if(!isUnique) {
          setIsInvalid(true);
          setErrorMsg(translate("editor.duplicateShortcut"));
      } else if (!isValidInitialKey) {
          setIsInvalid(true);
          setErrorMsg(translate('editor.invalidInitialKey'));
      } else if (localInput.length > 3) {
          setIsInvalid(true);
          setErrorMsg(translate('editor.maxLength'));
      } else {
          setIsInvalid(false);
      }
    };

    const handleSubmit = () => {
        onConfirm(localInput);
        handleClose();
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        const key = event.nativeEvent.code === "Space" ? "Space" : event.key;
        const copyLocalInput = localInput.slice();

        if(key === 'Backspace' && localInput.length) {
            copyLocalInput.pop();
            setLocalInput(copyLocalInput);
        } else if (copyLocalInput.length <= 3) {
            copyLocalInput.push(key);
            setLocalInput(copyLocalInput);
        }
        setInputCombination(renderInputCombination(copyLocalInput));
        event.preventDefault();
        event.stopPropagation();
    };

    const handleKeyUp = (event: React.KeyboardEvent) => {
        validateInputCombination();
    };

    React.useEffect(() => {
        if(selectedShortCut?.length && !localInput?.length) {
            setLocalInput(selectedShortCut);
            setInputCombination(renderInputCombination(selectedShortCut));
        }
    }, [selectedShortCut]);

    React.useEffect(() => {
        return () => {
            init();
        }
    }, [])

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
                                onKeyDown={handleKeyDown}
                                onKeyUp={handleKeyUp}
                                value={inputCombination}
                                helperText={isInvalid && errorMsg}
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
                                disabled={isInvalid}
                                onClick={handleSubmit}
                                color="primary"
                                variant="outlined"
                                startIcon={loading ?
                                    <MoonLoader
                                        sizeUnit={"px"}
                                        size={15}
                                        color={theme.palette.primary.main}
                                        loading={true}
                                    /> : <EditIcon />}
                            >
                                {translate("common.edit")}
                            </Button>
                        </DialogActions>
                    </>
            }
        </Dialog>
    );
}