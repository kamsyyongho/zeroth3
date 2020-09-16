import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { GenericById, SnackbarError, SNACKBAR_VARIANTS } from '../../../../types';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { CustomTheme } from '../../../../theme';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import {TableCell, TableBody, Tooltip, Typography} from '@material-ui/core';
import { useSnackbar } from 'notistack';
import log from '../../../../util/log/logger';

interface StatusLogModalProps {
    open: boolean;
    onClose: () => void;
    projectId: string;
    dataId: string;
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
        }
    }));

export function StatusLogModal(props: StatusLogModalProps) {
    const { open, onClose, projectId, dataId } = props;
    const { translate, formatDate } = React.useContext(I18nContext);
    const { enqueueSnackbar } = useSnackbar();
    const api = React.useContext(ApiContext);
    const [loading, setLoading] = React.useState(false);
    const [setType, setSetType] = React.useState("none");
    const [statusChanges, setStatusChanges] = React.useState<any[]>([]);
    const classes = useStyles();
    const theme = useTheme();
    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    const initStatusChanges = async () => {
        if (api?.voiceData && !loading) {
            setLoading(true);
            const response = await api.voiceData.getStatusChange(projectId, dataId);
            let snackbarError: SnackbarError | undefined = {} as SnackbarError;
            if (response.kind === 'ok') {
                setStatusChanges(response.statusChanges);
            } else {
                log({
                    file: `CreateSetFormDialog.tsx`,
                    caller: `handleSubmit - failed to create set`,
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
            setLoading(false);
        }
    };

    const handleClose = () => {
        setLoading(false);
        setSetType('none');
        onClose();
    };

    React.useEffect(() => {
        if(!statusChanges.length) {
            initStatusChanges();
        }
    }, []);

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
                {translate('TDP.statusChange')}
            </DialogTitle>
            <DialogContent className={classes.dialogContent}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                {translate('forms.status')}
                            </TableCell>
                            <TableCell>
                                {translate('common.date')}
                            </TableCell>
                            <TableCell>
                                {translate('IAM.user')}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            statusChanges.map((change: any, index: number) => {
                                return (
                                    <TableRow key={`status-change-row-${index}`}>
                                        <TableCell>
                                            <Typography>{change.state}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography>
                                                {formatDate(new Date(change.changedAt))}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography>{change.user || '-'}</Typography>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        }
                    </TableBody>
                </Table>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    color="primary"
                    variant="outlined">
                    {translate('common.close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}