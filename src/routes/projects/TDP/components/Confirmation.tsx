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
import TableRow from '@material-ui/core/TableRow';
import {Grid, TableCell, TableBody, Tooltip, Typography} from '@material-ui/core';
import { ProgressBar } from '../../../shared/ProgressBar';

interface CreateSetFormDialogProps {
    open: boolean;
    buttonMsg: string;
    contentMsg: string;
    onClose: () => void;
    onSuccess: () => void;
    setSelectedModelConfigId?: (modelConfigId: string) => void;
    selectedDataSet?: DataSet;
    modelConfigsById?: GenericById<ModelConfig>;
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

export function ConfirmationDialog(props: CreateSetFormDialogProps) {
    const { contentMsg , buttonMsg, open, onClose, onSuccess, modelConfigsById, selectedDataSet, setSelectedModelConfigId } = props;
    const { translate } = React.useContext(I18nContext);
    const [loading, setLoading] = React.useState(false);
    const [setType, setSetType] = React.useState("none");
    const classes = useStyles();
    const theme = useTheme();
    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    const renderButton = React.useMemo(() => {
        if(buttonMsg === translate("common.delete")) {
            return (<DeleteIcon />)
        }else{
            return (<DoneIcon />)
        }
    },[buttonMsg])

    const handleClose = () => {
        setLoading(false);
        setSetType('none');
        onClose();
    };

    const handleSuccess = async () => {
        setLoading(true);
        await onSuccess();
        setSetType('none');
        setLoading(false);
    };

    const handleModelConfigId = (event: any) => {
        const modelConfigId = event.target.value;
        setSetType(modelConfigId);
        if(setSelectedModelConfigId) setSelectedModelConfigId(modelConfigId)
    }

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
                {contentMsg}

            </DialogTitle>
            <DialogContent className={classes.dialogContent}>
                {modelConfigsById && selectedDataSet &&
                    <Table>
                        <TableBody>
                            {
                                selectedDataSet.evaluationProgress && selectedDataSet.evaluationProgress !== 100 &&
                                <TableRow className={classes.tableRow}>
                                    <TableCell>
                                        <Typography>{translate('common.progress')}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography className={classes.processedText} >
                                            {selectedDataSet.evaluationProgress}
                                            <Typography component='span' color='textPrimary' >
                                                {` / 100`}
                                            </Typography>
                                        </Typography>
                                        <ProgressBar value={selectedDataSet?.evaluationProgress || 0} maxWidth={200} />
                                    </TableCell>
                                </TableRow>
                            }
                            <TableRow className={classes.tableRow}>
                                <TableCell>
                                    <Typography>{translate('SET.selectModel')}</Typography>
                                </TableCell>
                                <TableCell>
                                    <FormControl className={classes.formControl}>
                                        <Select
                                            id="demo-simple-select-autowidth"
                                            label="Set Type"
                                            value={setType}
                                            onChange={handleModelConfigId}
                                            autoWidth
                                            MenuProps={{ variant: "menu", getContentAnchorEl: null }}>
                                            <MenuItem value={"none"}>None</MenuItem>
                                            {Object.keys(modelConfigsById).map((id: string, index: number) => {
                                                return <MenuItem key={`modelConfigId-${index}`}
                                                                 value={modelConfigsById[id].id}>{modelConfigsById[id].name}</MenuItem>
                                            })}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                }
                {
                    modelConfigsById && !selectedDataSet &&
                    <FormControl className={classes.formControl}>
                        <Select
                            id="demo-simple-select-autowidth"
                            label="Set Type"
                            value={setType}
                            onChange={handleModelConfigId}
                            autoWidth
                            MenuProps={{ variant: "menu", getContentAnchorEl: null }}>
                            <MenuItem value={"none"}>None</MenuItem>
                            {Object.keys(modelConfigsById).map((id: string, index: number) => {
                                return <MenuItem key={`modelConfigId-${index}`}
                                                 value={modelConfigsById[id].id}>{modelConfigsById[id].name}</MenuItem>
                            })}
                        </Select>
                    </FormControl>

                }
            </DialogContent>
                <DialogActions>
                    <Button disabled={loading} onClick={onClose} color="primary">
                        {translate("common.cancel")}
                    </Button>
                    <Button
                        onClick={handleSuccess}
                        disabled={modelConfigsById && setType === "none"}
                        color="primary"
                        variant="outlined"
                        startIcon={loading ?
                            <MoonLoader
                                sizeUnit={"px"}
                                size={15}
                                color={theme.palette.primary.main}
                                loading={true}
                            /> : renderButton}>
                        {buttonMsg}
                    </Button>
                </DialogActions>
        </Dialog>
    );
}