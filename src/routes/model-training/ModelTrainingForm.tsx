import { CardContent } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import CardActions from '@material-ui/core/CardActions';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import DoneIcon from '@material-ui/icons/Done';
import { Field, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import * as yup from 'yup';
import { VALIDATION } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { DataSet, GenericById, ModelConfig, SnackbarError, SNACKBAR_VARIANTS, TRAINING_METHODS } from '../../types';
import log from '../../util/log/logger';
import { SelectFormField, SelectFormFieldOptions } from '../shared/form-fields/SelectFormField';
import { SwitchFormField } from '../shared/form-fields/SwitchFormField';
import { TextFormField } from '../shared/form-fields/TextFormField';

const useStyles = makeStyles((theme) =>
  createStyles({
    cardAction: {
      justifyContent: 'flex-end',
    },
    switchSpacing: {
      marginTop: theme.spacing(2),
    },
  }),
);
interface ModelTrainingFormProps {
  dataSets: DataSet[];
  modelConfigs: ModelConfig[];
  trainingMethods: TRAINING_METHODS[];
  dataSetsById: GenericById<DataSet>;
  modelConfigsById: GenericById<ModelConfig>;
}

export function ModelTrainingForm(props: ModelTrainingFormProps) {
  const {
    modelConfigs,
    dataSetsById,
    trainingMethods,
    modelConfigsById,
    dataSets
  } = props;
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [loading, setLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  const classes = useStyles();
  const theme = useTheme();

  let allModelConfigsStillTraining = true;
  const modelConfigFormSelectOptions: SelectFormFieldOptions = modelConfigs.map((modelConfig) => {
    const disabled = modelConfig.progress < 100;
    if (!disabled) {
      allModelConfigsStillTraining = false;
    }
    return { label: modelConfig.name, value: modelConfig.id, disabled };
  });
  const dataSetFormSelectOptions: SelectFormFieldOptions = dataSets.map((dataSets) => ({ label: dataSets.name, value: dataSets.id }));
  const trainingMethodFormSelectOptions: SelectFormFieldOptions = trainingMethods.map((method) => ({ label: method, value: method }));

  // validation translated text
  const noAvailableModelConfigText = (modelConfigFormSelectOptions.length && allModelConfigsStillTraining) ? translate('models.validation.allModelConfigsStillTraining', { count: modelConfigFormSelectOptions.length }) : '';
  const requiredTranslationText = translate("forms.validation.required");
  const nameText = translate("forms.validation.between", { target: translate('forms.name'), first: VALIDATION.MODELS.ACOUSTIC.name.min, second: VALIDATION.MODELS.ACOUSTIC.name.max, context: 'characters' });

  const formSchema = yup.object({
    name: yup.string().min(VALIDATION.MODELS.ACOUSTIC.name.min, nameText).max(VALIDATION.MODELS.ACOUSTIC.name.max, nameText).required(requiredTranslationText).trim(),
    selectedModelConfigId: yup.string().nullable().required(requiredTranslationText),
    selectedDataSetId: yup.string().nullable().required(requiredTranslationText),
    selectedTrainingMethod: yup.string().nullable().required(requiredTranslationText),
    shared: yup.boolean().required(requiredTranslationText),
  });
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    name: "",
    selectedModelConfigId: null,
    selectedDataSetId: null,
    selectedTrainingMethod: null,
    shared: true,
  };


  const handleSubmit = async (values: FormValues) => {
    const { name, selectedModelConfigId, selectedDataSetId, selectedTrainingMethod, shared } = values;
    if (selectedModelConfigId === null ||
      selectedDataSetId === null ||
      selectedTrainingMethod === null
    ) return;
    if (api?.models && !loading) {
      setLoading(true);
      setIsError(false);
      const response = await api.models.transferLearning(name.trim(), selectedModelConfigId, selectedDataSetId, shared);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
        setIsError(false);
      } else {
        log({
          file: `ModelTrainingForm.tsx`,
          caller: `handleSubmit - failed to submit model training`,
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


  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
      {(formikProps) => {
        let modelHelperText = ' ';
        if (formikProps.values.selectedModelConfigId) {
          modelHelperText = modelConfigsById[formikProps.values.selectedModelConfigId].description || ' ';
        }
        let transcriberHelperText = ' ';
        if (formikProps.values.selectedDataSetId && dataSetsById[formikProps.values.selectedDataSetId].transcribers.length) {
          transcriberHelperText = translate('SET.numberTranscribers', { count: dataSetsById[formikProps.values.selectedDataSetId].transcribers.length });
        }
        return (<>
          <CardContent >
            <Form>
              <Field autoFocus name='name' component={TextFormField} label={translate("forms.name")} errorOverride={isError} />
              <Field
                name='selectedModelConfigId'
                component={SelectFormField}
                options={modelConfigFormSelectOptions}
                label={translate("forms.modelConfig")}
                errorOverride={isError || noAvailableModelConfigText}
                helperText={noAvailableModelConfigText || modelHelperText}
              />
              <Field
                name='selectedDataSetId'
                component={SelectFormField}
                options={dataSetFormSelectOptions}
                label={translate("modelTraining.trainingData")}
                errorOverride={isError}
                helperText={transcriberHelperText}
              />
              <Field
                name='selectedTrainingMethod'
                component={SelectFormField}
                options={trainingMethodFormSelectOptions}
                label={translate("modelTraining.trainingMethod")}
                errorOverride={isError}
              />
              <div
                className={classes.switchSpacing}
              >
                <Field
                  name='shared'
                  component={SwitchFormField}
                  label={translate("modelTraining.shareSettings")}
                  text={(value: boolean) => translate(value ? "modelTraining.shared" : "modelTraining.notShared")}
                  errorOverride={isError}
                />
              </div>
            </Form>
          </CardContent>
          <CardActions className={classes.cardAction} >
            <Button
              disabled={!formikProps.isValid || isError || loading}
              onClick={formikProps.submitForm}
              color="primary"
              variant="outlined"
              startIcon={loading ?
                <MoonLoader
                  sizeUnit={"px"}
                  size={15}
                  color={theme.palette.primary.main}
                  loading={true}
                /> : (<DoneIcon />)}
            >
              {translate("modelTraining.startTraining")}
            </Button>
          </CardActions>
        </>);
      }}
    </Formik>
  );
}