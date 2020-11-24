import { Chip, Divider, Grid, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import DoneIcon from '@material-ui/icons/Done';
import { Field, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import * as yup from 'yup';
import { VALIDATION } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../theme/index';
import { AcousticModel, LanguageModel, ModelConfig, SnackbarError, SNACKBAR_VARIANTS, SubGraph, TopGraph } from '../../types';
import log from '../../util/log/logger';
import { LanguageModelDialog } from '../models/components/language-model/LanguageModelDialog';
import { ChipList } from '../shared/ChipList';
import { SelectFormField, SelectFormFieldOptions } from '../shared/form-fields/SelectFormField';
import { TextFormField } from '../shared/form-fields/TextFormField';
import { CheckboxFormField } from '../shared/form-fields/CheckboxFormField';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
      width: '100%',
    },
    subTitle: {
      fontWeight: 500,
      color: theme.palette.grey[600],
    },
    modelTitle: {
      fontWeight: 600,
    },
    form: {
      width: '100%',
    },
    divider: {
      backgroundColor: theme.table.border,
      width: '100%',
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
  }),
);

export interface ModelConfigListItemExpandPropsFromParent {
  projectId: string;
  onSuccess: (updatedConfig: ModelConfig, isEdit?: boolean) => void;
  topGraphs: TopGraph[];
  subGraphs: SubGraph[];
  acousticModels: AcousticModel[];
  handleSubGraphListUpdate: (subGraph: SubGraph, isEdit?: boolean) => void;
}

interface ModelConfigListItemExpandProps extends ModelConfigListItemExpandPropsFromParent {
  modelConfig: ModelConfig;
  expanded: boolean;
  nameFormValue: string;
  onLoading: (loading: boolean) => void;
  onClose: () => void;
}

export function ModelConfigListItemExpand(props: ModelConfigListItemExpandProps) {
  const {
    projectId,
    expanded,
    nameFormValue,
    onLoading,
    onClose,
    onSuccess,
    modelConfig,
    topGraphs,
    subGraphs,
    acousticModels,
    handleSubGraphListUpdate,
  } = props;
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [languageOpen, setLanguageOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [isThresholdError, setIsThresholdError] = React.useState(false);
  // key used to reset the form on close
  const [formCounter, setFormCounter] = React.useState(0);

  const classes = useStyles();
  const theme = useTheme();

  const handleClose = () => {
    setIsError(false);
    setIsThresholdError(false);
    onLoading(false);
    onClose();
  };

  React.useEffect(() => {
    if (!expanded) {
      handleClose();
      setFormCounter(formCounter + 1);
    }
  }, [expanded]);

  React.useEffect(() => {
    onLoading(loading);
  }, [loading]);

  let allAcousticModelsStillTraining = true;
  const acousticModelFormSelectOptions: SelectFormFieldOptions = acousticModels.map((acousticModel) => {
    const disabled = acousticModel.progress < 100;
    if (!disabled) {
      allAcousticModelsStillTraining = false;
    }
    return { label: acousticModel.name, value: acousticModel.id, disabled };
  });

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
    selectedAcousticModelId: yup.string().when([], {is: () => !modelConfig.imported, then: yup.string().nullable().required(requiredTranslationText)}),
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
    shareable: yup.boolean().when([], {is: () => !modelConfig.imported, then: yup.boolean().nullable()}),
  });
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues = React.useMemo(() => {
    const initialValues: FormValues = {
      name: modelConfig.name,
      selectedAcousticModelId: modelConfig.acousticModel.id,
      thresholdHr: modelConfig.thresholdHr ?? null,
      thresholdLr: modelConfig.thresholdLr ?? null,
      description: modelConfig.description,
      shareable: modelConfig.shareable ?? false,
    };
    return initialValues;
  }, [modelConfig]);

  const handleSubmit = async (values: FormValues) => {
    const { name, description, selectedAcousticModelId, thresholdLr, thresholdHr, shareable } = values;
    if (selectedAcousticModelId === null) return;
    if (api?.modelConfig && !loading) {
      setLoading(true);
      setIsError(false);
      const subGraphById = modelConfig.subGraphs.map(subGraph => subGraph.id);
      const response = await api.modelConfig.updateModelConfig(modelConfig.id, projectId, name.trim(), description.trim(), selectedAcousticModelId, thresholdLr, thresholdHr, shareable, modelConfig.topGraph.id, subGraphById);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
        onSuccess(response.modelConfig, true);
        handleClose();
      } else {
        log({
          file: `ModelConfigListItemExpand.tsx`,
          caller: `handleSubmit - failed to update model config`,
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

  const updateThreshold = async (thresholdLr: number | null, thresholdHr: number | null) => {
    if (api?.modelConfig && !loading) {
      setLoading(true);
      setIsThresholdError(false);
      const response = await api.modelConfig.updateThreshold(modelConfig.id, projectId, thresholdLr, thresholdHr);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
      } else {
        log({
          file: `ModelConfigListItemExpand.tsx`,
          caller: `updateThreshold - failed to update model config threshold`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        setIsThresholdError(true);
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
    <Grid
      key={formCounter}
      container
      item
      xs={12}
      wrap='nowrap'
      direction='column'
      alignContent='flex-start'
      alignItems='flex-start'
      justify='flex-start'
      className={classes.root}
    >
      <Formik key={formCounter} initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => {
          const { name, thresholdHr, thresholdLr } = formikProps.values;
          const shouldShowThresholdSubmit = thresholdHr !== modelConfig.thresholdHr || thresholdLr !== modelConfig.thresholdLr;
          const thresholdSubmitDisabled = Boolean(formikProps.errors.thresholdHr || formikProps.errors.thresholdLr || loading);
          if (nameFormValue !== name) {
            formikProps.setFieldValue('name', nameFormValue, true);
          }
          return (
            <>
              <Form className={classes.form} >
                <Grid
                  container
                  item
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                  spacing={2}
                  xs={12}
                >
                  <Grid item xs={2}>
                    <Typography align='left' className={classes.subTitle} >{`${descriptionText}:`}</Typography>
                  </Grid>
                  <Grid item xs={10}>
                    <Field
                      name='description'
                      component={TextFormField}
                      errorOverride={isError}
                    />
                  </Grid>
                </Grid>
                <Grid
                  container
                  item
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                  spacing={2}
                  xs={12}
                >
                  <Grid item xs={2}>
                    <Typography align='left' className={classes.subTitle} >{`${thresholdLrText}:`}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Field
                      name='thresholdLr'
                      component={TextFormField}
                      type='number'
                      margin="normal"
                      errorOverride={isError || isThresholdError}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Typography align='left' className={classes.subTitle} >{`${thresholdHrText}:`}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Field
                      name='thresholdHr'
                      component={TextFormField}
                      type='number'
                      margin="normal"
                      errorOverride={isError || isThresholdError}
                    />
                  </Grid>
                  <Grid container item xs={2} >
                    {shouldShowThresholdSubmit && <>
                      <Grid item><IconButton
                        color='primary'
                        disabled={thresholdSubmitDisabled}
                        onClick={() => updateThreshold(thresholdLr, thresholdHr)}
                      >
                        <DoneIcon />
                      </IconButton></Grid>
                      <Grid item><IconButton
                        color='secondary'
                        disabled={loading}
                        onClick={() => {
                          formikProps.setFieldValue('thresholdHr', modelConfig.thresholdHr ?? null);
                          formikProps.setFieldValue('thresholdLr', modelConfig.thresholdLr ?? null);
                        }}
                      >
                        <CloseIcon />
                      </IconButton></Grid>
                    </>}
                  </Grid>
                </Grid>
                <Divider className={classes.divider} />
                <Grid
                  container
                  item
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                  spacing={2}
                  xs={12}
                >
                  {modelConfig.languageModel.description && <>
                    <Grid item>
                      <Typography align='left' className={classes.subTitle}>{`${translate("forms.description")}:`}</Typography>
                    </Grid>
                    <Grid item>
                      <Typography align='left' >{modelConfig.languageModel.description}</Typography>
                    </Grid>
                  </>}
                </Grid>
                <Grid
                  container
                  item
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                  spacing={2}
                  xs={12}>
                  <Grid item style={{ marginTop: '10px' }}>
                    <Typography align='left' className={classes.subTitle} >{`${translate("forms.top")}:`}</Typography>
                  </Grid>
                  <Grid item>
                    <Chip
                      variant='outlined'
                      size='small'
                      label={modelConfig.languageModel.topGraph.name}
                    />
                  </Grid>
                </Grid>
                <Grid
                  container
                  item
                  wrap='nowrap'
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                  spacing={2}
                  xs={12}>
                  <Grid item>
                    <Typography align='left' className={classes.subTitle} >{`${translate("forms.sub")}:`}</Typography>
                  </Grid>
                  <Grid item >
                    <ChipList
                      variant='outlined'
                      labels={modelConfig.languageModel.subGraphs.map(subGraph => subGraph.name)}
                    />
                  </Grid>
                </Grid>
                <Divider className={classes.divider} />
                <Grid
                  container
                  item
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                  spacing={2}
                  xs={12}
                >
                  <Grid item xs={2}>
                    <Typography align='left' className={classes.modelTitle} >{`${translate("forms.acousticModel")}:`}</Typography>
                  </Grid>
                  <Grid item xs={10}>
                    <Field
                      name='selectedAcousticModelId'
                      disabled={modelConfig.imported}
                      component={SelectFormField}
                      options={acousticModelFormSelectOptions}
                      errorOverride={isError || noAvailableAcousticModelText}
                      helperText={noAvailableAcousticModelText}
                      fullWidth={false}
                      variant='outlined'
                    />
                  </Grid>
                  <Grid
                    container
                    item
                    alignContent='center'
                    alignItems='center'
                    justify='flex-start'
                    spacing={2}
                  >
                    {modelConfig.acousticModel.version && <>
                      <Grid item>
                        <Typography align='left' className={classes.subTitle} >{`${translate("common.version")}:`}</Typography>
                      </Grid>
                      <Grid item>
                        <Typography align='left' >{modelConfig.acousticModel.version}</Typography>
                      </Grid>
                    </>}
                    {modelConfig.acousticModel.description && <>
                      <Grid item>
                        <Typography align='left' className={classes.subTitle} >{`${translate("forms.description")}:`}</Typography>
                      </Grid>
                      <Grid item>
                        <Typography align='left' >{modelConfig.acousticModel.description}</Typography>
                      </Grid>
                    </>}
                  </Grid>
                </Grid>
                {modelConfig.acousticModel.sampleRate && <Grid
                  container
                  item
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                  spacing={2}
                  xs={12}
                >
                  <Grid item>
                    <Typography align='left' className={classes.subTitle} >{`${translate("forms.sampleRate")}:`}</Typography>
                  </Grid>
                  <Grid item>
                    <ChipList max={1} light labels={[`${modelConfig.acousticModel.sampleRate} Hz`]} />
                  </Grid>
                </Grid>}
              </Form>
              <Divider className={classes.divider} />
              <Grid
                  container
                  item
                  alignContent='flex-start'
                  alignItems='center'
                  justify='flex-start'
                  spacing={2}>
                <Grid item>
                  <Field
                      name='shareable'
                      disabled={modelConfig.imported}
                      component={CheckboxFormField}
                      text={translate("modelTraining.shared")}
                      errorOverride={isError}
                  />
                </Grid>
              </Grid>
              <Grid container item justify='flex-end' >
                <Button
                  disabled={!formikProps.isValid || loading}
                  onClick={formikProps.submitForm}
                  color="primary"
                  variant="contained"
                  startIcon={loading ?
                    <MoonLoader
                      sizeUnit={"px"}
                      size={15}
                      color={theme.palette.primary.main}
                      loading={true}
                    /> : (<DoneIcon />)}
                >
                  {translate('common.save')}
                </Button>
              </Grid>
            </>
          );
        }}
      </Formik>
    </Grid>
  );
}
