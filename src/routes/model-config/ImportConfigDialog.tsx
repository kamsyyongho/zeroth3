import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
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
import { TextFormField } from '../shared/form-fields/TextFormField';

const useStyles = makeStyles((theme) =>
    createStyles({
        hidden: {
            visibility: 'hidden',
        },
    }),
);
interface ModelConfigDialogProps {
    projectId: string;
    open: boolean;
    hideBackdrop?: boolean;
    configToEdit?: ModelConfig;
    onClose: (modelConfigId?: string) => void;
    onSuccess: (updatedConfig: ModelConfig, isEdit?: boolean) => void;
    topGraphs: TopGraph[];
    subGraphs: SubGraph[];
    languageModels: LanguageModel[];
    acousticModels: AcousticModel[];
    handleSubGraphListUpdate: (subGraph: SubGraph, isEdit?: boolean) => void;
    handleLanguageModelCreate: (languageModel: LanguageModel) => void;
}

export function ModelConfigDialog(props: ModelConfigDialogProps) {
    const {
        projectId,
        open,
        hideBackdrop,
        onClose,
        onSuccess,
        configToEdit,
        topGraphs,
        subGraphs,
        languageModels,
        acousticModels,
        handleSubGraphListUpdate,
        handleLanguageModelCreate,
    } = props;
    const { enqueueSnackbar } = useSnackbar();
    const { translate } = React.useContext(I18nContext);
    const api = React.useContext(ApiContext);
    const [languageOpen, setLanguageOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [isError, setIsError] = React.useState(false);
    const isEdit = !!configToEdit;

    const classes = useStyles();
    const theme = useTheme();
    // to expand to fullscreen on small displays
    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    let allAcousticModelsStillTraining = true;
    const acousticModelFormSelectOptions: SelectFormFieldOptions = acousticModels.map((acousticModel) => {
        const disabled = acousticModel.progress < 100;
        if (!disabled) {
            allAcousticModelsStillTraining = false;
        }
        return { label: acousticModel.name, value: acousticModel.id, disabled };
    });
    const languageModelFormSelectOptions: SelectFormFieldOptions = languageModels.map((languageModel) => ({ label: languageModel.name, value: languageModel.id }));

    // validation translated text
    const noAvailableAcousticModelText = (acousticModelFormSelectOptions.length && allAcousticModelsStillTraining) ? translate('models.validation.allAcousticModelsStillTraining', { count: acousticModelFormSelectOptions.length }) : '';
    const requiredTranslationText = translate("forms.validation.required");
    const descriptionText = translate("forms.description");
    const descriptionMaxText = translate("forms.validation.lessEqualTo", { target: descriptionText, value: VALIDATION.MODELS.ACOUSTIC.description.max });
    const nameText = translate("forms.validation.between", { target: translate('forms.name'), first: VALIDATION.MODELS.ACOUSTIC.name.min, second: VALIDATION.MODELS.ACOUSTIC.name.max, context: 'characters' });
    const thresholdHrText = translate("forms.thresholdHr");
    const thresholdLrText = translate("forms.thresholdLr");
    const numberText = translate("forms.validation.number");

    const formSchema = yup.object({
        name: yup.string().min(VALIDATION.MODELS.ACOUSTIC.name.min, nameText).max(VALIDATION.MODELS.ACOUSTIC.name.max, nameText).required(requiredTranslationText).trim(),
        selectedAcousticModelId: yup.string().nullable().required(requiredTranslationText),
        selectedLanguageModelId: yup.string().nullable().required(requiredTranslationText),
        thresholdLr: yup.number().typeError(numberText).min(VALIDATION.PROJECT.threshold.moreThan).nullable().test('lowRiskTest', translate('forms.validation.lessThan', { target: thresholdLrText, value: thresholdHrText }), function (thresholdLr) {
            const { thresholdHr } = this.parent;
            if (thresholdLr === 0 || thresholdHr === 0 || thresholdLr === null) return true;
            return thresholdLr < thresholdHr;
        }),
        thresholdHr: yup.number().typeError(numberText).min(VALIDATION.PROJECT.threshold.moreThan).nullable().test('highRiskTest', translate('forms.validation.greaterThan', { target: thresholdHrText, value: thresholdLrText }), function (thresholdHr) {
            const { thresholdLr } = this.parent;
            if (thresholdLr === 0 || thresholdHr === 0 || thresholdHr === null) return true;
            return thresholdHr > thresholdLr;
        }),
        description: yup.string().max(VALIDATION.MODELS.ACOUSTIC.description.max, descriptionMaxText).trim(),
    });
    type FormValues = yup.InferType<typeof formSchema>;
    let initialValues: FormValues = {
        name: "",
        selectedAcousticModelId: null,
        selectedLanguageModelId: null,
        thresholdHr: null,
        thresholdLr: null,
        description: "",
    };
    if (configToEdit) {
        initialValues = {
            ...initialValues,
            name: configToEdit.name,
            selectedAcousticModelId: configToEdit.acousticModel.id,
            selectedLanguageModelId: configToEdit.languageModel.id,
            thresholdHr: configToEdit.thresholdHr ?? null,
            thresholdLr: configToEdit.thresholdLr ?? null,
            description: configToEdit.description,
        };
    }

    const handleClose = () => {
        setIsError(false);
        onClose((isEdit && configToEdit) ? configToEdit.id : undefined);
    };

    const handleSubmit = async (values: FormValues) => {
        const { name, description, selectedAcousticModelId, selectedLanguageModelId, thresholdLr, thresholdHr } = values;
        if (selectedAcousticModelId === null ||
            selectedLanguageModelId === null
        ) return;
        if (api?.modelConfig && !loading) {
            setLoading(true);
            setIsError(false);
            let response: postModelConfigResult;
            if (isEdit && configToEdit) {
                response = await api.modelConfig.updateModelConfig(configToEdit.id, projectId, name.trim(), description.trim(), selectedAcousticModelId, selectedLanguageModelId, thresholdLr, thresholdHr);
            } else {
                response = await api.modelConfig.postModelConfig(projectId, name.trim(), description.trim(), selectedAcousticModelId, selectedLanguageModelId, thresholdLr, thresholdHr);
            }
            let snackbarError: SnackbarError | undefined = {} as SnackbarError;
            if (response.kind === 'ok') {
                snackbarError = undefined;
                enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
                onSuccess(response.modelConfig, isEdit);
                handleClose();
            } else {
                log({
                    file: `ModelConfigDialog.tsx`,
                    caller: `handleSubmit - failed to create model config`,
                    value: response,
                    important: true,
                });
                snackbarError.isError = true;
                setIsError(true);
                const { serverError } = response;
                if (serverError) {
                    snackbarError.errorText = serverError.message || "";
                }
            }
            snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
            setLoading(false);
        }
    };

    const openLanguageDialog = () => setLanguageOpen(true);
    const closeLanguageDialog = () => setLanguageOpen(false);

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
            <DialogTitle id="model-config-dialog">{translate(`modelConfig.header`)}</DialogTitle>
            <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
                {(formikProps) => (
                    <>
                        <DialogContent>
                            <Form>
                                <Field
                                    name='selectedAcousticModelId'
                                    component={SelectFormField}
                                    options={acousticModelFormSelectOptions}
                                    label={translate("forms.acousticModel")}
                                    errorOverride={isError || noAvailableAcousticModelText}
                                    helperText={noAvailableAcousticModelText}
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
            <LanguageModelDialog
                open={languageOpen}
                onClose={closeLanguageDialog}
                onSuccess={handleLanguageModelCreate}
                handleSubGraphListUpdate={handleSubGraphListUpdate}
                topGraphs={topGraphs}
                subGraphs={subGraphs}
                hideBackdrop
            />
        </Dialog>
    );
}