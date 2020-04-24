import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import AddIcon from '@material-ui/icons/Add';
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
import { SelectFormField, SelectFormFieldOptions } from '../shared/form-fields/SelectFormField';

const useStyles = makeStyles((theme) =>
    createStyles({
        hidden: {
            visibility: 'hidden',
        },
    }),
);
interface ImportConfigDialogProps {
    projectId: string;
    open: boolean;
    hideBackdrop?: boolean;
    selectOptions: SelectFormFieldOptions;
    onClose: () => void;
    onSuccess: () => void;
}

export function ImportConfigDialog(props: ImportConfigDialogProps) {
    const {
        projectId,
        open,
        hideBackdrop,
        onClose,
        selectOptions,
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

    const formSchema = yup.object({
        selectedModelConfigId: yup.string().nullable().required(requiredTranslationText),
    });
    type FormValues = yup.InferType<typeof formSchema>;
    const initialValues: FormValues = {
        selectedModelConfigId: null,
    };

    const handleClose = () => {
        setIsError(false);
        onClose();
    };

    const handleSubmit = async (values: FormValues) => {
        const { selectedModelConfigId } = values;
        if (selectedModelConfigId === null) return;

        if(api?.modelConfig && !loading) {
            setLoading(true);
            setIsError(false);
            const response = await api.modelConfig?.importOrganizationModelConfigs(projectId, selectedModelConfigId);
            let snackbarError: SnackbarError | undefined = {} as SnackbarError;
            if(response.kind === 'ok') {
                snackbarError = undefined;
                enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success })
                handleClose();
                onSuccess();
            } else {
                log({
                    file: 'ImportConfigDialog.tsx',
                    caller: 'handleSubmit - failed to import organization model configs',
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
            <DialogTitle id="model-config-dialog">{translate(`modelConfig.import_header`)}</DialogTitle>
            <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
                {(formikProps) => (
                    <>
                        <DialogContent>
                            <Form>
                                <Field
                                    name='selectedModelConfigId'
                                    component={SelectFormField}
                                    props={{ whiteSpace: 'normal' }}
                                    options={selectOptions}
                                    label={translate("modelConfig.header_plural")}
                                    helperText={translate('modelConfig.import_guide')}
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
                                    /> : <AddIcon />}
                            >
                                {translate("modelConfig.import")}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Formik>
        </Dialog>
    );
}