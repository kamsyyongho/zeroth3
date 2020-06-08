import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import DeleteIcon from '@material-ui/icons/Delete';
import DoneIcon from '@material-ui/icons/Done';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { ModelConfig, GenericById, DataSet } from '../../../../types';
import { SelectFormField, SelectFormFieldOptions } from '../../../shared/form-fields/SelectFormField';
import { Field } from 'formik';
import Select from '@material-ui/core/Select';
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { CustomTheme } from '../../../../theme';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import {Grid, TableCell, TableBody, Tooltip, Typography} from '@material-ui/core';
import { ProgressBar } from '../../../shared/ProgressBar';

interface StatusLogModalProps {
    open: boolean;
    onClose: () => void;
    statusChanges: any[];
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
    const { open, onClose, statusChanges } = props;
    const { translate, formatDate } = React.useContext(I18nContext);
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