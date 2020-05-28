import { Box, Button, Card, CardActions, CardContent } from '@material-ui/core';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Grid from '@material-ui/core/Grid';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FilterListIcon from '@material-ui/icons/FilterList';
import { Field, Formik, ErrorMessage } from 'formik';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import * as yup from 'yup';
import { VALIDATION } from '../../../../constants/validation.constants';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { SearchDataRequest } from '../../../../services/api/types';
import { CustomTheme } from '../../../../theme/index';
import { CONTENT_STATUS_VALUES, DataSet, GenericById, ModelConfig, TranscriberStats, Transcriber } from '../../../../types';
import { DateTimePickerFormField } from '../../../shared/form-fields/DateTimePickerFormField';
import { SelectFormField, SelectFormFieldOptions } from '../../../shared/form-fields/SelectFormField';
import { TextFormField } from '../../../shared/form-fields/TextFormField';

interface TDPFiltersProps {
  updateVoiceData: (options?: SearchDataRequest) => void;
  modelConfigsById: GenericById<ModelConfig>;
  dataSetsById: any;
  transcriberStats: Transcriber[];
  loading?: boolean;
}

const useStyles = makeStyles(theme => ({
  root: {
    background: theme.palette.background.default,
    marginBottom: 1,
  },
  heading: {
    marginLeft: 15,
  },
  card: {
    width: '100%',
  },
}));

export function TDPFilters(props: TDPFiltersProps) {
  const { updateVoiceData, modelConfigsById, dataSetsById, transcriberStats, loading } = props;
  const { translate } = React.useContext(I18nContext);
  const [submitPressed, setSubmitPressed] = React.useState(false);
  const classes = useStyles();
  const theme: CustomTheme = useTheme();

  const statusFormSelectOptions = React.useMemo(() => {
    const tempFormSelectOptions: SelectFormFieldOptions = CONTENT_STATUS_VALUES.map((status) => ({ label: status, value: status }));
    // add the placeholder
    tempFormSelectOptions.unshift({ label: translate('forms.none'), value: '' });
    return tempFormSelectOptions;
  }, [translate]);

  const modelConfigFormSelectOptions = React.useMemo(() => {
    const tempFormSelectOptions: SelectFormFieldOptions = Object.keys(modelConfigsById).map((id) => ({
      label: modelConfigsById[id].name,
      value: modelConfigsById[id].id,
      disabled: !modelConfigsById[id].progress,
    }));
    // add the placeholder
    tempFormSelectOptions.unshift({ label: translate('forms.none'), value: '' });
    return tempFormSelectOptions;
  }, [modelConfigsById, translate]);

  const dataSetFormSelectOptions = React.useMemo(() => {
    const tempFormSelectOptions: SelectFormFieldOptions = Object.keys(dataSetsById).map((id) => ({
      label: dataSetsById[id].name,
      value: dataSetsById[id].id,
    }));
    // add the placeholder
    tempFormSelectOptions.unshift({ label: translate('forms.none'), value: '' });
    return tempFormSelectOptions;
  }, [modelConfigsById, translate]);

    const transcriberFormSelectOptions = React.useMemo(() => {
      const tempFormSelectOptions: SelectFormFieldOptions = transcriberStats.map((transcriber) => ({
        label: transcriber.email,
        value: transcriber.id,
      }));
    // add the placeholder
    tempFormSelectOptions.unshift({ label: translate('forms.none'), value: '' });
    return tempFormSelectOptions;
  }, [transcriberStats, translate]);

  const numberText = translate("forms.validation.number");
  const integerText = translate("forms.validation.integer");
  const lengthMinText = translate("forms.validation.greaterEqualTo", { target: translate('forms.lengthMin'), value: VALIDATION.TDP.length.min });
  const minEndDateText = translate('forms.validation.TDPFilterEndDate');

  const formSchema = yup.object({
    startDate: yup.date().nullable().notRequired(),
    endDate: yup.date()
        .min(yup.ref('startDate'), minEndDateText)
        .nullable()
        .notRequired(),
    maxLength: yup.number().typeError(numberText).integer(integerText).notRequired(),
    minLength: yup.number().typeError(numberText).integer(integerText).min(VALIDATION.TDP.length.min, lengthMinText).notRequired(),
    transcript: yup.string().notRequired(),
    status: yup.mixed().oneOf(CONTENT_STATUS_VALUES.concat([''])).notRequired(),
    modelConfigId: yup.mixed<string | ''>().notRequired(),
    dataSetId: yup.mixed<string | ''>().notRequired(),
    filename: yup.string().notRequired(),
    transcriber: yup.mixed<string | ''>().notRequired(),
  });
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    startDate: null,
    endDate: null,
    status: '',
    modelConfigId: '',
    dataSetId: '',
  };


  const handleSubmit = (values: FormValues) => {
    const {
      startDate,
      endDate,
      maxLength,
      minLength,
      transcript,
      status,
      modelConfigId,
      dataSetId,
      filename,
      transcriber,
    } = values;
    // sanitize the data
    const from: Date | undefined = startDate === null ? undefined : startDate;
    const till: Date | undefined = endDate === null ? undefined : endDate;
    const options: SearchDataRequest = {
      from,
      till,
      'length-max': maxLength,
      'length-min': minLength,
      transcript,
      status: status === '' ? undefined : status,
      'model-config': modelConfigId === '' ? undefined : modelConfigId,
      'data-set': dataSetId === '' ? undefined : dataSetId,
      filename,
      transcriber,
    };
    updateVoiceData(options);
  };

  return (
    <Formik
      isInitialValid
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={formSchema}
    >
      {(formikProps) => (
        <ExpansionPanel className={classes.root} elevation={0} >
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon color='primary' />}
            aria-controls="filter"
            id="filter-header"
          >
            <FilterListIcon />
            <Typography variant='h5' className={classes.heading} >{translate('table.filter')}</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Box border={1} borderColor={theme.table.border} >
              <Card elevation={0} className={classes.card}>
                <CardContent>
                  <Grid
                    container
                    direction="row"
                    justify="flex-start"
                    alignItems="flex-start"
                    spacing={3}
                  >
                    <Grid
                      container
                      item
                      xs={12}
                      spacing={3}
                      direction="row"
                      wrap='nowrap'
                    >
                      <Grid
                        item
                        xs={6}
                        md={4}
                      >
                        <Field
                          fullWidth
                          name='startDate'
                          component={DateTimePickerFormField}
                          autoOk
                          label={translate('forms.startDate')}
                          clearable
                          clearLabel={translate('common.clear')}
                          showTodayButton
                          todayLabel={translate('forms.today')}
                          okLabel={translate('common.okay')}
                          cancelLabel={translate('common.cancel')}
                          inputVariant='outlined'
                          margin="normal"
                        />
                      </Grid>
                      <Grid
                        item
                        xs={6}
                        md={4}
                      >
                        <Field
                          fullWidth
                          name='endDate'
                          component={DateTimePickerFormField}
                          autoOk
                          label={translate('forms.endDate')}
                          clearable
                          clearLabel={translate('common.clear')}
                          showTodayButton
                          todayLabel={translate('forms.today')}
                          okLabel={translate('common.okay')}
                          cancelLabel={translate('common.cancel')}
                          inputVariant='outlined'
                          margin="normal"
                        />
                      </Grid>
                    </Grid>
                    <Grid
                      container
                      item
                      xs={12}
                      spacing={3}
                      direction="row"
                      wrap='nowrap'
                    >
                      <Grid
                        item
                        xs={6}
                        md={4}
                      >
                        <Field
                          name='minLength'
                          component={TextFormField}
                          label={translate('forms.lengthMin')}
                          placeholder={`${VALIDATION.TDP.length.min}`}
                          type='number'
                          variant="outlined"
                          margin="normal"
                        />
                      </Grid>
                      <Grid
                        item
                        xs={6}
                        md={4}
                      >
                        <Field
                          name='maxLength'
                          component={TextFormField}
                          label={translate('forms.lengthMax')}
                          type='number'
                          variant="outlined"
                          margin="normal"
                        />
                      </Grid>
                    </Grid>
                    <Grid
                      container
                      item
                      xs={12}
                      spacing={5}
                      direction="row"
                      wrap='nowrap'
                      justify='flex-start'
                    >
                      <Grid
                        item
                        xs={6}
                        md={4}
                      >
                        <Field
                          fullWidth
                          name='status'
                          component={SelectFormField}
                          options={statusFormSelectOptions}
                          label={translate("forms.status")}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={6}
                        md={4}
                      >
                        <Field
                          fullWidth
                          name='modelConfigId'
                          component={SelectFormField}
                          options={modelConfigFormSelectOptions}
                          label={translate("modelConfig.header")}
                        />
                      </Grid>
                    </Grid>
                    <Grid
                      container
                      item
                      xs={12}
                      spacing={5}
                      direction="row"
                      wrap='nowrap'
                      justify='flex-start'
                    >
                      <Grid
                        item
                        xs={6}
                        md={4}
                      >
                        <Field
                          name='filename'
                          component={TextFormField}
                          label={translate('TDP.originalFilename')}
                          variant="outlined"
                          margin="normal"
                        />
                      </Grid>
                      <Grid
                          item
                          xs={6}
                          md={4}
                      >
                        <Field
                            fullWidth
                            name='transcriber'
                            component={SelectFormField}
                            options={transcriberFormSelectOptions}
                            label={translate('common.userId')}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={6}
                        md={4}
                      >
                        <Field
                          fullWidth
                          name='dataSetId'
                          component={SelectFormField}
                          options={dataSetFormSelectOptions}
                          label={translate("SET.dataSet")}
                        />
                      </Grid>
                    </Grid>
                    <Grid container item xs={12} spacing={1}>
                      <Field
                        multiline
                        fullWidth
                        name='transcript'
                        component={TextFormField}
                        label={translate('forms.transcript')}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button
                    disabled={loading}
                    onClick={() => {
                      if (submitPressed) {
                        formikProps.resetForm();
                        formikProps.submitForm();
                        setSubmitPressed(false);
                      } else {
                        formikProps.resetForm();
                      }
                    }}
                    color="secondary"
                    variant="outlined"
                  >
                    {translate('common.clearAll')}
                  </Button>
                  <Button
                    disabled={!formikProps.isValid || loading}
                    onClick={() => {
                      formikProps.submitForm();
                      setSubmitPressed(true);
                    }}
                    color="primary"
                    variant="contained"
                  >{loading &&
                    <MoonLoader
                      sizeUnit={"px"}
                      size={15}
                      color={theme.palette.common.white}
                      loading={true}
                    />}
                    {translate('common.search')}
                  </Button>
                </CardActions>
              </Card>
            </Box>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      )}
    </Formik>
  );
}
