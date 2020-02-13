import { Chip, Divider, Grid, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
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

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
    subTitle: {
      fontWeight: 500,
      color: theme.palette.grey[600],
    },
    modelTitle: {
      fontWeight: 600,
    },
    divider: {
      backgroundColor: theme.table.border,
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
  languageModels: LanguageModel[];
  acousticModels: AcousticModel[];
  handleSubGraphListUpdate: (subGraph: SubGraph, isEdit?: boolean) => void;
  handleLanguageModelCreate: (languageModel: LanguageModel) => void;
}


interface ModelConfigListItemExpandProps extends ModelConfigListItemExpandPropsFromParent {
  configToEdit: ModelConfig;
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
  // key used to reset the form on close
  const [formCounter, setFormCounter] = React.useState(0);

  const classes = useStyles();
  const theme = useTheme();

  const handleClose = () => {
    setIsError(false);
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
    thresholdHr: yup.number().typeError(numberText).moreThan(VALIDATION.PROJECT.threshold.moreThan).lessThan(yup.ref('thresholdLr'), `${translate('forms.validation.lessThan', { target: thresholdHrText, value: thresholdLrText })}`).nullable(),
    thresholdLr: yup.number().typeError(numberText).moreThan(VALIDATION.PROJECT.threshold.moreThan).moreThan(yup.ref('thresholdHr'), `${translate('forms.validation.greaterThan', { target: thresholdLrText, value: thresholdHrText })}`).nullable(),
    description: yup.string().max(VALIDATION.MODELS.ACOUSTIC.description.max, descriptionMaxText).trim(),
  });
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues = React.useMemo(() => {
    const initialValues: FormValues = {
      name: configToEdit.name,
      selectedAcousticModelId: configToEdit.acousticModel.id,
      selectedLanguageModelId: configToEdit.languageModel.id,
      thresholdHr: configToEdit.thresholdHr ?? null,
      thresholdLr: configToEdit.thresholdLr ?? null,
      description: configToEdit.description,
    };
    return initialValues;
  }, [configToEdit]);

  const handleSubmit = async (values: FormValues) => {
    const { name, description, selectedAcousticModelId, selectedLanguageModelId, thresholdLr, thresholdHr } = values;
    if (selectedAcousticModelId === null ||
      selectedLanguageModelId === null
    ) return;
    if (api?.modelConfig && !loading) {
      setLoading(true);
      setIsError(false);
      const response = await api.modelConfig.updateModelConfig(configToEdit.id, projectId, name.trim(), description.trim(), selectedAcousticModelId, selectedLanguageModelId, thresholdLr, thresholdHr);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
        onSuccess(response.modelConfig, true);
        handleClose();
      } else {
        log({
          file: `ModelConfigListItemExpand.tsx`,
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
    <Grid
      key={formCounter}
      wrap='nowrap'
      direction='column'
      alignContent='center'
      alignItems='center'
      justify='flex-start'
      xs={12}
      className={classes.root}
    >
      <Formik key={formCounter} initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => {
          if (nameFormValue !== formikProps.values.name) {
            formikProps.setFieldValue('name', nameFormValue, true);
          }
          return (
            <>
              <Form>
                <Grid
                  container
                  item
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                  spacing={2}
                >
                  <Grid item>
                    <Typography align='center' className={classes.subTitle} >{`${descriptionText}:`}</Typography>
                  </Grid>
                  <Grid item>
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
                >
                  <Grid item>
                    <Typography align='center' className={classes.subTitle} >{`${thresholdHrText}:`}</Typography>
                  </Grid>
                  <Grid item>
                    <Field
                      name='thresholdHr'
                      component={TextFormField}
                      type='number'
                      margin="normal"
                      errorOverride={isError}
                    />
                  </Grid>
                  <Grid item>
                    <Typography align='center' className={classes.subTitle} >{`${thresholdLrText}:`}</Typography>
                  </Grid>
                  <Grid item>
                    <Field
                      name='thresholdLr'
                      component={TextFormField}
                      type='number'
                      margin="normal"
                      errorOverride={isError}
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
                >
                  <Grid item>
                    <Typography align='center' className={classes.modelTitle} >{`${translate("forms.languageModel")}:`}</Typography>
                  </Grid>
                  <Grid item>
                    <Field
                      name='selectedLanguageModelId'
                      component={SelectFormField}
                      options={languageModelFormSelectOptions}
                      errorOverride={isError}
                      fullWidth={false}
                      variant='outlined'
                    />
                  </Grid>
                  <Grid item>
                    <IconButton
                      color="primary"
                      onClick={openLanguageDialog}
                    >
                      <AddIcon />
                    </IconButton>
                  </Grid>
                </Grid>
                <Grid
                  container
                  item
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                  spacing={2}
                >
                  {configToEdit.languageModel.version && <>
                    <Grid item>
                      <Typography align='center' className={classes.subTitle} >{`${translate("common.version")}:`}</Typography>
                    </Grid>
                    <Grid item>
                      <Typography align='center' >{configToEdit.languageModel.version}</Typography>
                    </Grid>
                  </>}
                  {configToEdit.languageModel.description && <>
                    <Grid item>
                      <Typography align='center' className={classes.subTitle} >{`${translate("forms.description")}:`}</Typography>
                    </Grid>
                    <Grid item>
                      <Typography align='center' >{configToEdit.languageModel.description}</Typography>
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
                >
                  <Grid item>
                    <Typography align='center' className={classes.subTitle} >{`${translate("forms.top")}:`}</Typography>
                  </Grid>
                  <Grid item>
                    <Chip
                      variant='outlined'
                      size='small'
                      label={configToEdit.languageModel.topGraph.name}
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
                >
                  <Grid item>
                    <Typography align='center' className={classes.subTitle} >{`${translate("forms.sub")}:`}</Typography>
                  </Grid>
                  <Grid item >
                    <ChipList
                      variant='outlined'
                      labels={configToEdit.languageModel.subGraphs.map(subGraph => subGraph.name)}
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
                >
                  <Grid item>
                    <Typography align='center' className={classes.modelTitle} >{`${translate("forms.acousticModel")}:`}</Typography>
                  </Grid>
                  <Grid item>
                    <Field
                      name='selectedAcousticModelId'
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
                    {configToEdit.acousticModel.version && <>
                      <Grid item>
                        <Typography align='center' className={classes.subTitle} >{`${translate("common.version")}:`}</Typography>
                      </Grid>
                      <Grid item>
                        <Typography align='center' >{configToEdit.acousticModel.version}</Typography>
                      </Grid>
                    </>}
                    {configToEdit.acousticModel.description && <>
                      <Grid item>
                        <Typography align='center' className={classes.subTitle} >{`${translate("forms.description")}:`}</Typography>
                      </Grid>
                      <Grid item>
                        <Typography align='center' >{configToEdit.acousticModel.description}</Typography>
                      </Grid>
                    </>}
                  </Grid>
                </Grid>
                {configToEdit.acousticModel.sampleRate && <Grid
                  container
                  item
                  alignContent='center'
                  alignItems='center'
                  justify='flex-start'
                  spacing={2}
                >
                  <Grid item>
                    <Typography align='center' className={classes.subTitle} >{`${translate("forms.sampleRate")}:`}</Typography>
                  </Grid>
                  <Grid item>
                    <ChipList max={1} light labels={[`${configToEdit.acousticModel.sampleRate} Hz`]} />
                  </Grid>
                </Grid>}
              </Form>
              <Divider className={classes.divider} />
              <Grid item justify='flex-end' >
                <Button
                  disabled={!formikProps.isValid || isError || loading}
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
      <LanguageModelDialog
        open={languageOpen}
        onClose={closeLanguageDialog}
        onSuccess={handleLanguageModelCreate}
        handleSubGraphListUpdate={handleSubGraphListUpdate}
        topGraphs={topGraphs}
        subGraphs={subGraphs}
      />
    </Grid>
  );
}