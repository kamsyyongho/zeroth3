import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import { Field, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import * as yup from 'yup';
import { VALIDATION } from '../../../constants/validation.constants';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { postModelConfigResult } from '../../../services/api/types';
import { AcousticModel, LanguageModel, ModelConfig, SnackbarError, SubGraph, TopGraph } from '../../../types';
import log from '../../../util/log/logger';
import { AcousticModelDialog } from '../../models/components/acoustic-model/AcousticModelDialog';
import { LanguageModelDialog } from '../../models/components/language-model/LanguageModelDialog';
import { SelectFormField, SelectFormFieldOptions } from '../../shared/form-fields/SelectFormField';
import { TextFormField } from '../../shared/form-fields/TextFormField';

interface ModelConfigDialogProps {
  projectId: number;
  open: boolean;
  configToEdit?: ModelConfig;
  onClose: (modelConfigId?: number) => void;
  onSuccess: (updatedConfig: ModelConfig, isEdit?: boolean) => void;
  topGraphs: TopGraph[];
  subGraphs: SubGraph[];
  languageModels: LanguageModel[];
  acousticModels: AcousticModel[];
  handleSubGraphCreate: (subGraph: SubGraph) => void;
  handleAcousticModelCreate: (acousticModel: AcousticModel) => void;
  handleLanguageModelCreate: (languageModel: LanguageModel) => void;
}

interface SubGraphsById {
  [x: number]: string;
}

export function ModelConfigDialog(props: ModelConfigDialogProps) {
  const {
    projectId,
    open,
    onClose,
    onSuccess,
    configToEdit,
    topGraphs,
    subGraphs,
    languageModels,
    acousticModels,
    handleSubGraphCreate,
    handleAcousticModelCreate,
    handleLanguageModelCreate,
  } = props;
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [acousticOpen, setAcousticOpen] = React.useState(false);
  const [languageOpen, setLanguageOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const isEdit = !!configToEdit;

  const theme = useTheme();
  // to expand to fullscreen on small displays
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const languageModelFormSelectOptions: SelectFormFieldOptions = languageModels.map((languageModel) => ({ label: languageModel.name, value: languageModel.id }));
  const acousticModelFormSelectOptions: SelectFormFieldOptions = acousticModels.map((acousticModel) => ({ label: acousticModel.name, value: acousticModel.id }));

  // validation translated text
  const requiredTranslationText = translate("forms.validation.required");
  const numberText = translate("forms.validation.number");
  const integerText = translate("forms.validation.integer");
  const descriptionText = translate("forms.description");
  const descriptionMaxText = translate("forms.validation.lessEqualTo", { target: descriptionText, value: VALIDATION.MODELS.ACOUSTIC.description.max });
  const nameText = translate("forms.validation.between", { target: translate('forms.name'), first: VALIDATION.MODELS.ACOUSTIC.name.min, second: VALIDATION.MODELS.ACOUSTIC.name.max, context: 'characters' });

  const formSchema = yup.object({
    name: yup.string().min(VALIDATION.MODELS.ACOUSTIC.name.min, nameText).max(VALIDATION.MODELS.ACOUSTIC.name.max, nameText).required(requiredTranslationText).trim(),
    selectedAcousticModelId: yup.number().integer(integerText).typeError(numberText).positive(requiredTranslationText).required(requiredTranslationText),
    selectedLanguageModelId: yup.number().integer(integerText).typeError(numberText).positive(requiredTranslationText).required(requiredTranslationText),
    description: yup.string().max(VALIDATION.MODELS.ACOUSTIC.description.max, descriptionMaxText).trim(),
  });
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    name: "",
    selectedAcousticModelId: 0,
    selectedLanguageModelId: 0,
    description: "",
  };
  // if (configToEdit) {
  //   initialValues = {
  //     ...initialValues,
  //     name: modelToEdit.name,
  //     description: modelToEdit.description,
  //     selectedTopGraphId: modelToEdit.topGraph.id,
  //     selectedSubGraphIds: modelToEdit.subGraphs.map(subGraph => subGraph.id),
  //   };
  // }

  const handleClose = () => onClose((isEdit && configToEdit) ? configToEdit.id : undefined);

  const handleSubmit = async (values: FormValues) => {
    if (api && api.modelConfig) {
      setLoading(true);
      setIsError(false);
      const { name, description, selectedAcousticModelId, selectedLanguageModelId } = values;
      let response: postModelConfigResult;
      if (isEdit && configToEdit) {
        //!
        //!
        //!
        //TODO
        //* HANDLE THE EDIT LOGIC HERE
        //!
        //!
        //!
        return;
      } else {
        response = await api.modelConfig.postModelConfig(projectId, name.trim(), description.trim(), selectedAcousticModelId, selectedLanguageModelId);
      }
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        onSuccess(response.modelConfig);
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
      snackbarError && snackbarError.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setLoading(false);
    }
  };

  const openAcousticDialog = () => setAcousticOpen(true);
  const openLanguageDialog = () => setLanguageOpen(true);
  const closeAcousticDialog = () => setAcousticOpen(false);
  const closeLanguageDialog = () => setLanguageOpen(false);

  return (
    <Dialog
      fullScreen={fullScreen}
      disableBackdropClick={loading}
      disableEscapeKeyDown={loading}
      open={open}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">{translate(`modelConfig.header`)}</DialogTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => (
          <>
            <DialogContent>
              <Form>
                <Field autoFocus name='name' component={TextFormField} label={translate("forms.name")} errorOverride={isError} />
                <Field name='selectedAcousticModelId' component={SelectFormField}
                  options={acousticModelFormSelectOptions} label={translate("forms.acousticModel")} errorOverride={isError} />
                <Button
                  fullWidth
                  color="primary"
                  onClick={openAcousticDialog}
                  startIcon={<AddIcon />}
                >
                  {translate('models.tabs.acousticModel.create')}
                </Button>
                <Field name='selectedLanguageModelId' component={SelectFormField}
                  options={languageModelFormSelectOptions} label={translate("forms.languageModel")} errorOverride={isError} />
                <Button
                  fullWidth
                  color="primary"
                  onClick={openLanguageDialog}
                  startIcon={<AddIcon />}
                >
                  {translate('models.tabs.languageModel.create')}
                </Button>
                <Field name='description' component={TextFormField} label={descriptionText} errorOverride={isError} />
              </Form>
            </DialogContent>
            <DialogActions>
              <Button disabled={loading} onClick={handleClose} color="primary">
                {translate("common.cancel")}
              </Button>
              <Button
                disabled={!formikProps.isValid}
                onClick={formikProps.submitForm}
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
                {translate(isEdit ? "modelConfig.edit" : "modelConfig.create")}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
      <AcousticModelDialog
        open={acousticOpen}
        onClose={closeAcousticDialog}
        onSuccess={handleAcousticModelCreate}
      />
      <LanguageModelDialog
        open={languageOpen}
        onClose={closeLanguageDialog}
        onSuccess={handleLanguageModelCreate}
        handleSubGraphCreate={handleSubGraphCreate}
        topGraphs={topGraphs}
        subGraphs={subGraphs}
      />
    </Dialog>
  );
}