import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import SaveIcon from '@material-ui/icons/Save';
import {Table, TableBody, TableCell, TableHead, TableRow, Typography} from '@material-ui/core';
import clsx from 'clsx';
import {useSnackbar} from 'notistack';
import MoonLoader from 'react-spinners/MoonLoader';
import React, {useGlobal} from 'reactn';
import {ApiContext} from '../../../hooks/api/ApiContext';
import {I18nContext} from '../../../hooks/i18n/I18nContext';
import {AssignShortCutDialog} from './AssignShortCutDialog';
import {EDITOR_CONTROLS} from './EditorControls';
import {renderInputCombination} from '../../../constants'
import {SnackbarError, Shortcuts, SNACKBAR_VARIANTS} from '../../../types';
import log from '../../../util/log/logger';

const useStyles = makeStyles((theme) =>
    createStyles({
        hidden: {
            visibility: 'hidden',
        },
        hiddenTextInput: {
            height: 0,
            visibility: 'hidden',
        },
        dialogContent: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        shortCutInput: {

        },
    }),
);

interface HelperPageProps {
    open: boolean;
    hideBackdrop?: boolean;
    onCommandClick: (newMode: EDITOR_CONTROLS) => void;
    onClose: () => void;
}
let shortcutStack: string[] = [];

export function HelperPage(props: HelperPageProps) {
    const { open, hideBackdrop, onClose, onCommandClick } = props;
    const { enqueueSnackbar } = useSnackbar();
    const { translate } = React.useContext(I18nContext);
    const api = React.useContext(ApiContext);
    const [shortcuts, setShortcuts] = useGlobal<any>('shortcuts');
    const [localShortcuts, setLocalShortcuts] = React.useState<Shortcuts>({} as Shortcuts);
    const [loading, setLoading] = React.useState(false);
    const [isError, setIsError] = React.useState(false);
    const [isChange, setIsChange] = React.useState(false);
    const [isAssignShortCutOpen, setIsAssignShortCutOpen] = React.useState(false);
    const [selectedShortcut, setSelectedShortCut] = React.useState<any>();
    const [selectedFunction, setDialogTitle] = React.useState<string>('');
    // const [functionArray, setFunctionArray] = React.useState(Object.keys(localShortcuts));
    // const [inputArray, setInputArray] = React.useState(Object.values(localShortcuts));

    const functionArray = React.useMemo(() => Object.keys(localShortcuts), [localShortcuts]);
    const inputArray = React.useMemo(() => Object.values(localShortcuts), [localShortcuts]);

    const theme = useTheme();
    const classes = useStyles();

    const handleClose = () => {
        setIsError(false);
        onClose();
    };

    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    const handleRowClick = (index: number) => {
        setDialogTitle(functionArray[index]);
        setSelectedShortCut(shortcuts[functionArray[index]]);
        setIsAssignShortCutOpen(true);
    }

    const updateShortcuts = async () => {
        if (api?.user) {
            setLoading(true);
            const response = await api.user.updateShortcuts(localShortcuts);
            let snackbarError: SnackbarError | undefined = {} as SnackbarError;
            if (response.kind === 'ok') {
                setShortcuts(localShortcuts);
                enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
                // to trigger the `useEffect` to fetch more
                // setVoiceData(undefined);
            } else {
                log({
                    file: `EditorPage.tsx`,
                    caller: `confirmData - failed to confirm segments`,
                    value: response,
                    important: true,
                });
                snackbarError.isError = true;
                const { serverError } = response;
                if (serverError) {
                    snackbarError.errorText = serverError.message || "";
                }
            }
            snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
            setIsAssignShortCutOpen(false);
            setIsChange(false);
            setLoading(false);
        }
    }

    const handleShortcutChanges = (input: string[]) => {
        const updatedShortcuts = JSON.parse(JSON.stringify(localShortcuts));
        Object.assign(updatedShortcuts, {[selectedFunction]: input});
        setLocalShortcuts(updatedShortcuts);
        setIsChange(true);
    };

    React.useEffect(() => {
        setLocalShortcuts(shortcuts)
    }, [shortcuts]);


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
            <DialogTitle id="sub-graph-dialog">{translate('editor.keyboardShortCuts')}</DialogTitle>
            <DialogContent>
                <DialogContent className={classes.dialogContent}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    {translate('editor.function')}
                                </TableCell>
                                <TableCell>
                                    {translate('editor.input')}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                inputArray && inputArray.map((input: any, index: number) => {
                                    return (
                                        <TableRow key={`status-change-row-${index}`} hover onClick={() => handleRowClick(index)}>
                                            <TableCell>
                                                <Typography>{translate(`editor.${functionArray[index]}`)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography>
                                                    {renderInputCombination(input)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            }
                        </TableBody>
                    </Table>
                </DialogContent>
            </DialogContent>
            <DialogActions>
                <Button disabled={loading} onClick={handleClose} color="primary">
                    {translate("common.close")}
                </Button>
                <Button
                    disabled={!isChange}
                    onClick={updateShortcuts}
                    color="primary"
                    variant="outlined"
                    startIcon={loading ?
                        <MoonLoader
                            sizeUnit={"px"}
                            size={15}
                            color={theme.palette.primary.main}
                            loading={true}
                        /> : <SaveIcon />}
                >
                    {translate("common.save")}
                </Button>
            </DialogActions>
            <AssignShortCutDialog
                open={isAssignShortCutOpen}
                onClose={() => setIsAssignShortCutOpen(false)}
                selectedShortCut={selectedShortcut}
                selectedFunction={selectedFunction}
                onConfirm={handleShortcutChanges} />
        </Dialog>
    );
}