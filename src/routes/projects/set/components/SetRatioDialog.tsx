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
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { ServerError } from '../../../../services/api/types/api-problem.types';
import { Field, Formik, ErrorMessage } from 'formik';
import { SNACKBAR_VARIANTS } from '../../../../types/snackbar.types';
import { useSnackbar } from 'notistack';
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
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import IconButton from '@material-ui/core/IconButton';

interface RequestEvaluationDialogrops {
    open: boolean;
    onClose: () => void;
    selectedDataSet?: DataSet;
    projectId: string;
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
        },
        ratioContent: {
            display: 'flex',
            flexDirection: 'column',
        },
        ratioControlrow: {
            display: 'flex',
            flexDirection: 'row',
            alignContent: 'center',
        },
        ratioControlButton: {
            padding: 0,
            width: '20px',
            height: '20px',
        },
        ratioControlButtonContainer: {
            marginLeft: '20px',
        },
        errorMsg: {
            fontSize: '12px',
            color: 'red',
            marginBottom: '15px',
        }
    }));

export function SetRatioDialog(props: RequestEvaluationDialogrops) {
    const { open, onClose, selectedDataSet, projectId } = props;
    const { translate } = React.useContext(I18nContext);
    const api = React.useContext(ApiContext);
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = React.useState(false);
    const [setType, setSetType] = React.useState("none");
    const [trainingRatio, setTrainingRatio] = React.useState(0);
    const [validationRatio, setValidationRatio] = React.useState(0);
    const [testRatio, setTestRatio] = React.useState(0);
    const [errorMsg, setErrorMsg] = React.useState('');

    const classes = useStyles();
    const theme = useTheme();

    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    const numberText = translate("forms.validation.number");
    const integerText = translate("forms.validation.integer");

    const formSchema = yup.object({
        ratioTraining: yup.number().typeError(numberText).integer(integerText).required(),
        ratioValidation: yup.number().typeError(numberText).integer(integerText).required(),
        ratioTest: yup.number().typeError(numberText).integer(integerText).required(),
    });
    type FormValues = yup.InferType<typeof formSchema>;

    const initialValues: FormValues = {
        ratioTraining: 0,
        ratioValidation: 0,
        ratioTest: 0,
    };

    const handleClose = () => {
        setLoading(false);
        setSetType('none');
        onClose();
    };

    const handleSubmit = async () => {
        if(selectedDataSet && api?.dataSet) {
            setLoading(true);
            let serverError: ServerError | undefined;
            const response = await api.dataSet.createTrainingSet(projectId, selectedDataSet.id, trainingRatio, validationRatio, testRatio);

            if(response.kind === 'ok') {
                enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
                handleClose();
            } else {
                serverError = response.serverError;
                let errorMessageText = translate('common.error');
                if(serverError?.message) {
                    errorMessageText = serverError.message;
                }
                enqueueSnackbar(errorMessageText, { variant: SNACKBAR_VARIANTS.error })
            }
            setLoading(false);
        }
    };

    const setSubTypeRatio = (subType: string, addValue: number) => {
        if(subType === 'test') setTestRatio(Number((testRatio + addValue).toFixed(1)));
        if(subType === 'training') setTrainingRatio(Number((trainingRatio + addValue).toFixed(1)));
        if(subType === 'validation') setValidationRatio(Number((validationRatio + addValue).toFixed(1)));
    };

    const isSubtractDisabled = (subType: string) => {
        if(subType === 'test' && testRatio === 0) return true;
        if(subType === 'training' && trainingRatio === 0) return true;
        if(subType === 'validation' && validationRatio === 0) return true;
    };

    const isAddDisabled = (subType: string) => {
        if(subType === 'test' && testRatio === 0.8) return true;
        if(subType === 'training' && trainingRatio === 0.8) return true;
        if(subType === 'validation' && validationRatio === 0.8) return true;
    };

    const ratioControlButton = (subSetType: string) => (
        <div className={classes.ratioControlButtonContainer}>
            <IconButton
                className={classes.ratioControlButton}
                disabled={isAddDisabled(subSetType)}
                onClick={() => setSubTypeRatio(subSetType, 0.1)}>
                <ArrowUpwardIcon />
            </IconButton>
            <IconButton
                className={classes.ratioControlButton}
                disabled={isSubtractDisabled(subSetType)}
                onClick={() => setSubTypeRatio(subSetType, -0.1)}>
                <ArrowDownwardIcon />
            </IconButton>
        </div>
    );

    React.useEffect(() => {
        if(validationRatio + trainingRatio + testRatio !== 1) {
            setErrorMsg(translate('SET.ratioTotalError'));
        } else {
            setErrorMsg('');
        }
        return () => {
            setErrorMsg('');
        }
    }, [validationRatio, trainingRatio, testRatio]);

    React.useEffect(() =>{
        return () => {
            setValidationRatio(0);
            setTrainingRatio(0);
            setValidationRatio(0);
            setErrorMsg('');
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
                {translate('SET.createTrainingSet')}
            </DialogTitle>
            <DialogContent className={classes.dialogContent}>
                <div className={classes.ratioContent}>
                    {errorMsg.length > 0 && <Typography className={classes.errorMsg}>{errorMsg}</Typography>}
                    <div className={classes.ratioControlrow}>
                        <Typography>{`${translate('SET.ratioTraining')} : ${trainingRatio ? trainingRatio * 100 : 0}%`}</Typography>
                        {
                            ratioControlButton('training')
                        }
                    </div>
                    <div className={classes.ratioControlrow}>
                        <Typography>{`${translate('SET.ratioValidation')} : ${validationRatio ? validationRatio * 100 : 0}%`}</Typography>
                        {
                            ratioControlButton('validation')
                        }
                    </div>
                    <div className={classes.ratioControlrow}>
                        <Typography>{`${translate('SET.ratioTest')} : ${testRatio ? testRatio * 100 : 0}%`}</Typography>
                        {
                            ratioControlButton('test')
                        }
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button disabled={loading} onClick={onClose} color="primary">
                    {translate("common.cancel")}
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={testRatio + validationRatio + trainingRatio !== 1}
                    color="primary"
                    variant="outlined"
                    startIcon={loading ?
                        <MoonLoader
                            sizeUnit={"px"}
                            size={15}
                            color={theme.palette.primary.main}
                            loading={true}
                        /> : <DoneIcon />}>
                    {translate('common.okay')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
