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
import { Field, Formik, ErrorMessage } from 'formik';
import * as yup from 'yup';
import { ModelConfig, GenericById, DataSet } from '../../../../types';
import { SelectFormField, SelectFormFieldOptions } from '../../../shared/form-fields/SelectFormField';
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
import { TextFormField } from '../../../shared/form-fields/TextFormField';

interface RequestEvaluationDialogrops {
    open: boolean;
    buttonMsg: string;
    contentMsg: string;
    onClose: () => void;
    setSelectedModelConfigId?: (modelConfigId: string) => void;
    selectedDataSet?: DataSet;
    modelConfigsById: GenericById<ModelConfig>;
}

const useStyles = makeStyles((theme: CustomTheme) =>
    createStyles({
        formControl: {
            // margin: theme.spacing(1),
            margin: 'auto',
            maxWidth: 400,
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
            border: 'none',
            borderCollapse: undefined,
        }
    }));

export function RequestEvaluationDialog(props: RequestEvaluationDialogrops) {
    const { contentMsg , buttonMsg, open, onClose, modelConfigsById, selectedDataSet, setSelectedModelConfigId } = props;
    const { translate } = React.useContext(I18nContext);
    const [loading, setLoading] = React.useState(false);
    const [setType, setSetType] = React.useState("none");
    const classes = useStyles();
    const theme = useTheme();
    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    const numberText = translate("forms.validation.number");
    const integerText = translate("forms.validation.integer");

    const modelConfigFormSelectOptions = React.useMemo(() => {
        const tempFormSelectOptions: SelectFormFieldOptions = Object.keys(modelConfigsById).map((id) => ({
            label: modelConfigsById[id].name,
            value: modelConfigsById[id].id,
            disabled: !modelConfigsById[id].progress,
        }));
        // add the placeholder
        tempFormSelectOptions.unshift({ label: translate('forms.none'), value: '' });
        return tempFormSelectOptions;
    }, [modelConfigsById, translate]);

    const formSchema = yup.object({
        ratioTraining: yup.number().typeError(numberText).integer(integerText).required(),
        ratioValidation: yup.number().typeError(numberText).integer(integerText).required(),
        ratioTest: yup.number().typeError(numberText).integer(integerText).required(),
        modelConfigId: yup.mixed<string | ''>().required(),
    });
    type FormValues = yup.InferType<typeof formSchema>;
    const initialValues: FormValues = {
        modelConfigId: '',
        ratioTraining: 0,
        ratioValidation: 0,
        ratioTest: 0,
    };


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

    const handleSubmit = (values: FormValues) => {

    };

    const handleSuccess = async () => {
        setLoading(true);
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
                <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
                    {
                        (formikProps) => (
                            <Grid direction='column' className={classes.formControl}>
                                <Field
                                    label={translate("modelConfig.header")}
                                    name='modelConfigId'
                                    component={SelectFormField}
                                    options={modelConfigFormSelectOptions}
                                />
                                <Field
                                    label={translate('SET.ratioTraining')}
                                    name='ratioTraining'
                                    component={TextFormField}
                                    type='number'
                                    variant='outlined' />
                                <Field
                                    label={translate('SET.ratioValidation')}
                                    name='ratioValidation'
                                    component={TextFormField}
                                    type='number'
                                    variant='outlined' />
                                <Field
                                    label={translate('SET.ratioTest')}
                                    name='ratioTest'
                                    component={TextFormField}
                                    type='number'
                                    variant='outlined' />
                            </Grid>
                        )
                    }
                </Formik>
                {/*{*/}
                {/*    modelConfigsById && !selectedDataSet &&*/}
                {/*    <FormControl className={classes.formControl}>*/}
                {/*        <Select*/}
                {/*            id="demo-simple-select-autowidth"*/}
                {/*            label="Set Type"*/}
                {/*            value={setType}*/}
                {/*            onChange={handleModelConfigId}*/}
                {/*            autoWidth*/}
                {/*            MenuProps={{ variant: "menu", getContentAnchorEl: null }}>*/}
                {/*            <MenuItem value={"none"}>None</MenuItem>*/}
                {/*            {Object.keys(modelConfigsById).map((id: string, index: number) => {*/}
                {/*                return <MenuItem key={`modelConfigId-${index}`}*/}
                {/*                                 value={modelConfigsById[id].id}>{modelConfigsById[id].name}</MenuItem>*/}
                {/*            })}*/}
                {/*        </Select>*/}
                {/*    </FormControl>*/}
                {/*}*/}
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
