import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import clsx from 'clsx';
import { Field, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import * as yup from 'yup';
import { VALIDATION } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { postModelConfigResult } from '../../services/api/types';
import { AcousticModel, LanguageModel, ModelConfig, SnackbarError, SNACKBAR_VARIANTS, SubGraph, TopGraph } from '../../types';
import log from '../../util/log/logger';
import { LanguageModelDialog } from '../models/components/language-model/LanguageModelDialog';
import {InputSelectFormField} from '../shared/form-fields/InputSelectFormField';
import { TextFormField } from '../shared/form-fields/TextFormField';
import DoneIcon from '@material-ui/icons/Done';

const useStyles = makeStyles((theme) =>
    createStyles({
        hidden: {
            visibility: 'hidden',
        },
    }),
);
interface ImportConfigDialogProps {
    projectId: string;
    modelConfig?: ModelConfig;
    open: boolean;
    hideBackdrop?: boolean;
    isUpdateDeployment: boolean;
    onClose: () => void;
    onSuccess: (modelConfig: ModelConfig) => void;
}

export function UpdateDeploymentDialog(props: ImportConfigDialogProps) {
    const {
        projectId,
        modelConfig,
        open,
        hideBackdrop,
        isUpdateDeployment,
        onClose,
        onSuccess,
    } = props;
    const { enqueueSnackbar } = useSnackbar();
    const { translate } = React.useContext(I18nContext);
    const api = React.useContext(ApiContext);
    const [languageOpen, setLanguageOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [isError, setIsError] = React.useState(false);
    const [organizationConfigList, setOrganizationConfigList] = React.useState<ModelConfig[]>([]);

    //model name and id hashmap for field options

    const classes = useStyles();
    const theme = useTheme();
    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    // validation translated text
    const noAvailableAcousticModelText = (!organizationConfigList.length) ? translate('models.validation.allAcousticModelsStillTraining') : '';
    const requiredTranslationText = translate("forms.validation.required");

    const updateDeploymentFormSchema = yup.object({
        replicas: yup.number(),
        alias: yup.string(),
    });
    const deployModelFormSchema = yup.object({
        replicas: yup.number().min(1),
    });
    const updateDeploymentInitialValues = {replicas: modelConfig?.replicas || 0, alias: modelConfig?.alias || ''};
    const deployModelInitialValues = {replicas: 1};
    const formSchema = isUpdateDeployment ? updateDeploymentFormSchema : deployModelFormSchema;
    type FormValues = yup.InferType<typeof formSchema>;
    const initialValues: FormValues = isUpdateDeployment ? updateDeploymentInitialValues : deployModelInitialValues;

    const handleClose = () => {
        setIsError(false);
        onClose();
    };

    // function input type as any due to ternary conditional errors with FormValues type
    const handleUpdateDeploymentSubmit = async (values: any) => {
        if(modelConfig && api?.modelConfig && !loading) {
            const { alias, replicas } = values;
            setLoading(true);
            setIsError(false);
            const response = await api.modelConfig?.updateDeployment(projectId, modelConfig.id, replicas, alias);
            let snackbarError: SnackbarError | undefined = {} as SnackbarError;
            if(response.kind === 'ok') {
                const updatedModelConfig = Object.assign({}, modelConfig, {alias, replicas});
                snackbarError = undefined;
                enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
                onSuccess(updatedModelConfig);
                handleClose();
            } else {
                log({
                    file: 'ImportConfigDialog.tsx',
                    caller: 'handleUpdateDeploymentSubmit - failed to update deployment model configs',
                    value: response,
                    important: true,
                });
                snackbarError.isError = true;
                setIsError(true);
                const { serverError } = response;
                if(serverError) {
                    snackbarError.errorText = serverError.message || "";
                }
            }
        }
        setLoading(false);
    };

    const handleDeployModelSubmit = async (values: FormValues) => {
        const { replicas } = values;
        if(modelConfig && api?.modelConfig && !loading) {
            setLoading(true);
            setIsError(false);
            const response = await api.modelConfig?.postDeploymentRequest(projectId, modelConfig.id, replicas);
            let snackbarError: SnackbarError | undefined = {} as SnackbarError;
            if(response.kind === 'ok') {
                const updatedModelConfig = Object.assign({}, modelConfig, {replicas});
                snackbarError = undefined;
                enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
                onSuccess(updatedModelConfig);
                handleClose();
            } else {
                log({
                    file: 'ImportConfigDialog.tsx',
                    caller: 'handleDeployModelSubmit - failed to deploy model',
                    value: response,
                    important: true,
                });
                snackbarError.isError = true;
                setIsError(true);
                const { serverError } = response;
                if(serverError) {
                    snackbarError.errorText = serverError.message || "";
                }
            }
        }
        setLoading(false);
    };

    return (
        <Dialog
            fullScreen={fullScreen}
            disableBackdropClick={loading}
            disableEscapeKeyDown={loading}
            open={open}
            onClose={handleClose}
            aria-labelledby="model-config-dialog"
            classes={{
                container: clsx(languageOpen && classes.hidden)
            }}
            BackdropProps={{
                className: clsx(hideBackdrop && classes.hidden),
            }}
        >
            <DialogTitle id="model-config-dialog">
                {isUpdateDeployment
                    ? translate(`modelConfig.updateDeploymentHeader`)
                    : translate(`modelConfig.deployModelHeader`)}
            </DialogTitle>
            <Formik
                initialValues={initialValues}
                isInitialValid={!isUpdateDeployment}
                onSubmit={isUpdateDeployment ? handleUpdateDeploymentSubmit : handleDeployModelSubmit}
                validationSchema={formSchema}>
                {(formikProps) => (
                    <>
                        <DialogContent>
                            <Form>
                                {
                                   isUpdateDeployment &&
                                   <Field
                                       name='alias'
                                       component={TextFormField}
                                       type='text'
                                       variant='outlined'
                                       label={translate("modelConfig.alias")}
                                       helperText={translate('modelConfig.aliasGuide')}
                                   />
                                }

                                <Field
                                    name='replicas'
                                    component={TextFormField}
                                    type='number'
                                    variant='outlined'
                                    label={translate("modelConfig.replicas")}
                                    helperText={translate('modelConfig.replicasGuide')}
                                />
                            </Form>
                        </DialogContent>
                        <DialogActions>
                            <Button disabled={loading} onClick={handleClose} color="primary">
                                {translate("common.cancel")}
                            </Button>
                            <Button
                                disabled={!formikProps.isValid || loading}
                                onClick={formikProps.submitForm}
                                color="primary"
                                variant="outlined"
                                startIcon={loading ?
                                    <MoonLoader
                                        sizeUnit={"px"}
                                        size={15}
                                        color={theme.palette.primary.main}
                                        loading={true}
                                    /> : <DoneIcon />}
                            >
                                {translate("common.save")}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Formik>
        </Dialog>
    );
}
