import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
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
    const [loading, setLoading] = React.useState(false);
    const [isError, setIsError] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [isAssignShortCutOpen, setIsAssignShortCutOpen] = React.useState(false);
    const [selectedShortcut, setSelectedShortCut] = React.useState<any>();
    const [selectedFunction, setDialogTitle] = React.useState<string>('');
    const functionArray = Object.keys(shortcuts);
    const inputArray = Object.values(shortcuts);


    const theme = useTheme();
    const classes = useStyles();

    const handleClose = () => {
        setIsError(false);
        onClose();
    };

    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    const handleSubmit = async () => {
        if(api?.user) {
            const response = await api.user.updateShortcuts(shortcuts);
            console.log(response);
        }

    };

    const handleRowClick = (index: number) => {
        setDialogTitle(functionArray[index]);
        setSelectedShortCut(shortcuts[functionArray[index]]);
        setIsAssignShortCutOpen(true);
    }

    const handleShortcutChanges = (input: string[]) => {

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
                                inputArray.map((input: any, index: number) => {
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
            <AssignShortCutDialog
                open={isAssignShortCutOpen}
                onClose={() => setIsAssignShortCutOpen(false)}
                selectedShortCut={selectedShortcut}
                selectedFunction={selectedFunction}
                onConfirm={handleShortcutChanges} />
        </Dialog>
    );
}