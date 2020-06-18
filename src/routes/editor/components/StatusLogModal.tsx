import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import {
    Grid,
    TableCell,
    TableBody,
    TableHead,
    Table,
    TableRow,
    Tooltip,
    Typography} from '@material-ui/core';
import clsx from 'clsx';
import { Field, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { postSubGraphResult } from '../../../services/api/types';
import {
    SnackbarError,
    SNACKBAR_VARIANTS } from '../../../types';
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
    }),
);

interface StatusLogModalProps {
    open: boolean;
    hideBackdrop?: boolean;
    onClose: () => void;
    onSuccess: (subGraph: SubGraph, isEdit?: boolean) => void;
}

export function StatusLogModal(props: StatusLogModalProps) {
    const { open, hideBackdrop, onClose, onSuccess } = props;
    const { enqueueSnackbar } = useSnackbar();
    const { translate } = React.useContext(I18nContext);
    const api = React.useContext(ApiContext);
    const [loading, setLoading] = React.useState(false);
    const [isError, setIsError] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);

    const shortCuts = ['command', 'damn'];

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
                                shortCuts.map((shortCut: any, index: number) => {
                                    return (
                                        <TableRow key={`status-change-row-${index}`}>
                                            <TableCell>
                                                <Typography>{'this is where the functionality is (EDITOR_CONTROLS) : '}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography>
                                                    {'This is where the goddamn combination is : ' + shortCut}
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
        </Dialog>
    );
}