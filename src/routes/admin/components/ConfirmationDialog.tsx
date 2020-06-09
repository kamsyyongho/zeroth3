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
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { ModelConfig, GenericById, DataSet } from '../../../types';
import { SelectFormField, SelectFormFieldOptions } from '../../shared/form-fields/SelectFormField';
import Select from '@material-ui/core/Select';
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { CustomTheme } from '../../../theme';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import {Grid, TableCell, TableBody, Tooltip, Typography} from '@material-ui/core';
import { ProgressBar } from '../../shared/ProgressBar';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import { TextFormField } from '../../shared/form-fields/TextFormField';
import * as yup from 'yup';
import { Field, Form, Formik } from 'formik';

interface CreateSetFormDialogProps {
    open: boolean;
    buttonMsg: string;
    contentMsg: string;
    isConfirm: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onReject: () => void;
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
        },
        button: {
            marginLeft: '15px',
            width: '90px',
        },
        buttonReject: {
            backgroundColor: '#c33636',
        }
    }));

export function ConfirmationDialog(props: CreateSetFormDialogProps) {
    const { contentMsg , buttonMsg, isConfirm, open, onClose, onConfirm, onReject } = props;
    const { translate } = React.useContext(I18nContext);
    const [loading, setLoading] = React.useState(false);
    const [setType, setSetType] = React.useState("none");
    const classes = useStyles();
    const theme = useTheme();
    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));
    const requiredTranslationText = translate("forms.validation.required");

    const handleClose = () => {
        setLoading(false);
        setSetType('none');
        onClose();
    };

    const handleSubmit = (values: FormValues) => {
        const { reason } = values;
        onReject(reason);
    }

    const formSchema = yup.object({
        reason: yup.string().required(requiredTranslationText).trim(),
    });
    type FormValues = yup.InferType<typeof formSchema>;
    const initialValues: FormValues = {
        reason: "",
    };

    const renderRejectContent = () => {
        return (
            <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
                {(formikProps) => {
                    return (<>
                        <DialogContent className={classes.dialogContent}>
                            <Form>
                                <Field
                                    name='reason'
                                    component={TextFormField}
                                    label={translate("admin.reason")}
                                    autoFocus
                                />

                            </Form>
                        </DialogContent>
                        <DialogActions>
                            <Button disabled={loading} onClick={onClose} color="primary">
                                {translate("common.cancel")}
                            </Button>
                            <Button
                                disabled={!formikProps.isValid}
                                onClick={formikProps.submitForm}
                                className={[classes.button, classes.buttonReject].join(' ')}
                                color='secondary'
                                variant='contained'
                                size='small'>
                                {buttonMsg}
                            </Button>
                        </DialogActions>
                    </>);
                }}
            </Formik>
        );
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
              </DialogContent>
              <DialogActions>
                  <Button disabled={loading} onClick={onClose} color="primary">
                      {translate("common.cancel")}
                  </Button>
                  {
                      isConfirm ?
                          <Button
                              className={classes.button}
                              variant='contained'
                              color="primary"
                              size='small'
                              onClick={onConfirm}>
                              {buttonMsg}
                          </Button>
                          :
                          <Button
                              onClick={onReject}
                              className={[classes.button, classes.buttonReject].join(' ')}
                              color='secondary'
                              variant='contained'
                              size='small'>
                              {buttonMsg}
                          </Button>
                  }
    
              </DialogActions>

        </Dialog>
    );
}