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
import {
  DataSet,
  GenericById,
  ModelConfig,
  SnackbarError,
  SNACKBAR_VARIANTS,
  StringById,
  TRAINING_METHODS,
  AUDIO_UPLOAD_TYPE_TRANS_LEARNING_VALUES,
  AUDIO_UPLOAD_TYPE_TRANS_LEARNING,
} from '../../types';
import log from '../../util/log/logger';
import { CheckboxFormField } from '../shared/form-fields/CheckboxFormField';
import { ChipSelectFormField } from '../shared/form-fields/ChipSelectFormField';
import { SelectFormField, SelectFormFieldOptions } from '../shared/form-fields/SelectFormField';
import { TextFormField } from '../shared/form-fields/TextFormField';
import clsx from "clsx";

const useStyles = makeStyles((theme) =>
  createStyles({
    cardAction: {
      justifyContent: 'flex-end',
    },
    hidden: {
      visibility: 'hidden',
    },
    hiddenTextInput: {
      height: 0,
      visibility: 'hidden',
    },
  }),
);

interface ModelTrainingFormProps {
  dataSets: DataSet[];
  projectId: string;
  modelConfigs: ModelConfig[];
  trainingMethods: TRAINING_METHODS[];
  dataSetsById: GenericById<DataSet>;
  modelConfigsById: GenericById<ModelConfig>;
}

export function ModelTrainingForm(props: ModelTrainingFormProps) {
  const {
    modelConfigs,
    projectId,
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
  let allDataSetsStillTranscribing = true;
  const dataSetNamesById: StringById = {};
  const dataSetFormSelectOptions: SelectFormFieldOptions = dataSets.map((dataSets) => {
    dataSetNamesById[dataSets.id] = dataSets.name;
    const disabled = (dataSets.total !== dataSets.processed);
    if (!disabled) {
      allDataSetsStillTranscribing = false;
    }
    return { label: dataSets.name, value: dataSets.id, disabled };
  });

  const trainingMethodFormSelectOptions: SelectFormFieldOptions = trainingMethods.map((method) => ({ label: method, value: method }));

  // validation translated text
  const noAvailableModelConfigText = (modelConfigFormSelectOptions.length && allModelConfigsStillTraining) ? translate('models.validation.allModelConfigsStillTraining', { count: modelConfigFormSelectOptions.length }) : '';
  const noAvailableDataSetsText = (dataSetFormSelectOptions.length && allDataSetsStillTranscribing) ? translate('modelTraining.validation.allModelConfigsStillTranscribing', { count: dataSetFormSelectOptions.length }) : '';
  const requiredTranslationText = translate("forms.validation.required");
  const nameText = translate("forms.validation.between", { target: translate('forms.name'), first: VALIDATION.MODELS.ACOUSTIC.name.min, second: VALIDATION.MODELS.ACOUSTIC.name.max, context: 'characters' });

  //subject to refactoring if seperating the source data for field
  const handleSubmit = async (values: FormValues) => {
    const { name, selectedModelConfigId, selectedDataSetIds, selectedTrainingMethod, shared, hrOnly, uploadType, text } = values;
    const isDataSet = uploadType === AUDIO_UPLOAD_TYPE_TRANS_LEARNING.DATASET as string;
    let response!: any;

    if (selectedModelConfigId === null ||
        selectedTrainingMethod === null
    ) return;
    if (api?.models && !loading) {
      setLoading(true);
      setIsError(false);
      if(isDataSet) {
        response = await api.models.transferLearningByDataSet(
            projectId,
            name.trim(),
            selectedModelConfigId,
            selectedDataSetIds,
            shared,
            hrOnly,
        );
      } else {
        response = await api.models.transferLearningByUrl(
            projectId,
            name.trim(),
            selectedModelConfigId,
            shared,
            hrOnly,
            text
        )
      }
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


  const formSchema = yup.object({
    name: yup.string().min(VALIDATION.MODELS.ACOUSTIC.name.min, nameText).max(VALIDATION.MODELS.ACOUSTIC.name.max, nameText).required(requiredTranslationText).trim(),
    selectedModelConfigId: yup.string().nullable().required(requiredTranslationText),
    selectedDataSetIds: yup.array().of(yup.string().required(requiredTranslationText)),
    selectedTrainingMethod: yup.string().nullable().required(requiredTranslationText),
    shared: yup.boolean().required(requiredTranslationText),
    hrOnly: yup.boolean().required(requiredTranslationText),
    uploadType: yup.string().nullable().required(requiredTranslationText),
    text: yup.string(),
  });
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    name: "",
    selectedModelConfigId: null,
    selectedDataSetIds: [],
    selectedTrainingMethod: null,
    shared: true,
    hrOnly: false,
    text: '',
    uploadType: AUDIO_UPLOAD_TYPE_TRANS_LEARNING.DATASET as string,
  };


  const getNumberOfTranscribersHelperText = (selectedDataSets: string[], dataSetsById: GenericById<DataSet>) => {
    if (!selectedDataSets.length) return ' ';
    let count = 0;
    selectedDataSets.forEach((dataSetId) => {
      count += dataSetsById[dataSetId].transcribers.length;
    });
    return translate('SET.numberTranscribers', { count });
  };

  const getModelHelperText = (modelConfigId: string | null, modelConfigsById: GenericById<ModelConfig>) => {
    if (!modelConfigId) return ' ';
    return modelConfigsById[modelConfigId].description || ' ';
  };

  const uploadTypeFormSelectOptions = React.useMemo(() => {
    const tempFormSelectOptions: SelectFormFieldOptions = AUDIO_UPLOAD_TYPE_TRANS_LEARNING_VALUES.map((uploadType) => {
      let label = uploadType;
      switch (uploadType) {
        case AUDIO_UPLOAD_TYPE_TRANS_LEARNING.DATASET as string:
          label = translate('SET.dataSet');
          break;
        case AUDIO_UPLOAD_TYPE_TRANS_LEARNING.URL as string:
          label = translate('common.url');
          break;

          //file path is not supported for now will change latro
        // case AUDIO_UPLOAD_TYPE_TRANS_LEARNING.PATH as string:
        //   label = translate('forms.location');
        //   break;
      }
      return { label, value: uploadType };
    });
    return tempFormSelectOptions;
  }, [translate]);



  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
      {(formikProps) => {
        const modelHelperText = getModelHelperText(formikProps.values.selectedModelConfigId, modelConfigsById);
        const transcriberHelperText = getNumberOfTranscribersHelperText(formikProps.values.selectedDataSetIds, dataSetsById);
        const isDataSet = formikProps.values.uploadType === AUDIO_UPLOAD_TYPE_TRANS_LEARNING.DATASET as string;
        const textInputLabel = formikProps.values.uploadType === AUDIO_UPLOAD_TYPE_TRANS_LEARNING.URL as string
            ? translate('forms.fileUrl')
            : translate('forms.filePath');

        return (<>
          <CardContent >
            <Form>
              <Field
                name='name'
                component={TextFormField}
                label={translate("forms.name")}
                errorOverride={isError}
                autoFocus
              />
              <Field
                name='selectedModelConfigId'
                component={SelectFormField}
                options={modelConfigFormSelectOptions}
                label={translate("forms.modelConfig")}
                errorOverride={isError || noAvailableModelConfigText}
                helperText={noAvailableModelConfigText || modelHelperText}
              />
              <Field
                  fullWidth
                  name='uploadType'
                  component={SelectFormField}
                  options={uploadTypeFormSelectOptions}
                  label={translate("forms.source")}
              />
              <Field
                  className={clsx(isDataSet && classes.hiddenTextInput)}
                  name='text'
                  component={TextFormField}
                  label={textInputLabel}
                  variant="outlined"
                  margin="normal"
              />
              <Field
                hidden={!isDataSet}
                name='selectedDataSetIds'
                component={ChipSelectFormField}
                options={dataSetFormSelectOptions}
                labelsByValue={dataSetNamesById}
                label={translate("modelTraining.trainingData")}
                errorOverride={isError || noAvailableDataSetsText}
                helperText={noAvailableDataSetsText || transcriberHelperText}
                light
              />
              <Field
                name='selectedTrainingMethod'
                component={SelectFormField}
                options={trainingMethodFormSelectOptions}
                label={translate("modelTraining.trainingMethod")}
                errorOverride={isError}
              />
              <Field
                name='shared'
                component={CheckboxFormField}
                text={translate("modelTraining.shared")}
                errorOverride={isError}
              />
              <Field
                name='hrOnly'
                component={CheckboxFormField}
                text={translate("modelTraining.highRiskSegmentsOnly")}
                errorOverride={isError}
              />
            </Form>
          </CardContent>
          <CardActions className={classes.cardAction} >
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