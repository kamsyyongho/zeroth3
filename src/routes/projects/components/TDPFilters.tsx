import { Button } from '@material-ui/core';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Grid from '@material-ui/core/Grid';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FilterListIcon from '@material-ui/icons/FilterList';
import { Field, Formik } from 'formik';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import * as yup from 'yup';
import { VALIDATION } from '../../../constants/validation.constants';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { SearchDataRequest } from '../../../services/api/types';
import { CONTENT_STATUS_VALUES } from '../../../types/voice-data.types';
import { DateTimePickerFormField } from '../../shared/form-fields/DateTimePickerFormField';
import { SelectFormField, SelectFormFieldOptions } from '../../shared/form-fields/SelectFormField';
import { TextFormField } from '../../shared/form-fields/TextFormField';
import { ModelConfigsById } from '../TDP';

interface TDPFiltersProps {
  updateVoiceData: (options?: SearchDataRequest) => void;
  modelConfigsById: ModelConfigsById;
  loading?: boolean;
}

const useStyles = makeStyles(theme => ({
  root: {
    background: theme.palette.background.default,
  },
  heading: {
    marginLeft: 15,
  },
}));

export function TDPFilters(props: TDPFiltersProps) {
  const { updateVoiceData, modelConfigsById, loading } = props;
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();
  const theme = useTheme();

  const statusFormSelectOptions = React.useMemo(() => {
    const tempFormSelectOptions: SelectFormFieldOptions = CONTENT_STATUS_VALUES.map((status) => ({ label: status, value: status }));
    // add the placeholder
    tempFormSelectOptions.unshift({ label: translate('forms.none'), value: '' });
    return tempFormSelectOptions;
  }, [translate]);

  const modelConfigFormSelectOptions = React.useMemo(() => {
    const tempFormSelectOptions: SelectFormFieldOptions = Object.keys(modelConfigsById).map((id) => ({ label: modelConfigsById[Number(id)].name, value: modelConfigsById[Number(id)].id }));
    // add the placeholder
    tempFormSelectOptions.unshift({ label: translate('forms.none'), value: '' });
    return tempFormSelectOptions;
  }, [modelConfigsById, translate]);

  const numberText = translate("forms.validation.number");
  const integerText = translate("forms.validation.integer");
  const lengthMinText = translate("forms.validation.greaterEqualTo", { target: translate('forms.lengthMin'), value: VALIDATION.TDP.length.min });

  const formSchema = yup.object({
    startDate: yup.date().nullable().notRequired(),
    endDate: yup.date().nullable().notRequired(),
    maxLength: yup.number().typeError(numberText).integer(integerText).notRequired(),
    minLength: yup.number().typeError(numberText).integer(integerText).min(VALIDATION.TDP.length.min, lengthMinText).notRequired(),
    transcript: yup.string().notRequired(),
    status: yup.mixed().oneOf(CONTENT_STATUS_VALUES.concat([''])).notRequired(),
    modelConfigId: yup.mixed<number | ''>().notRequired(),
  });
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    startDate: null,
    endDate: null,
    status: '',
    modelConfigId: '',
  };


  // FORCE CONTROLLED COMPONENT - while empty field;

  const handleSubmit = (values: FormValues) => {
    const {
      startDate,
      endDate,
      maxLength,
      minLength,
      transcript,
      status,
      modelConfigId,
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
    };
    updateVoiceData(options);
  };

  return (
    <Formik isInitialValid initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
      {(formikProps) => (
        <ExpansionPanel className={classes.root}>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="filter-header"
          >
            <FilterListIcon />
            <Typography variant='h5' className={classes.heading} >{translate('table.filterResults')}</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Grid
              container
              direction="row"
              justify="flex-start"
              alignItems="flex-start"
            >
              <Grid container item xs={12} spacing={1}>
                <Grid item sm={4}>
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
                  <Field
                    fullWidth
                    name='endDate'
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
                <Grid item xs={3}>
                  <Field
                    name='minLength'
                    component={TextFormField}
                    label={translate('forms.lengthMin')}
                    placeholder={`${VALIDATION.TDP.length.min}`}
                    type='number'
                    variant="outlined"
                    margin="normal"
                  />
                  <Field
                    name='maxLength'
                    component={TextFormField}
                    label={translate('forms.lengthMax')}
                    type='number'
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid container item xs={12} spacing={1}>
                  <Grid item sm={4}>
                    <Field
                      fullWidth
                      name='status'
                      component={SelectFormField}
                      options={statusFormSelectOptions}
                      label={translate("forms.status")}
                    />
                    <Field
                      fullWidth
                      name='modelConfigId'
                      component={SelectFormField}
                      options={modelConfigFormSelectOptions}
                      label={translate("modelConfig.header")}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid container item xs={12} spacing={1}>
                <Grid item sm={4}>
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
                <Grid item xs={3}>
                  <Button
                    disabled={!formikProps.isValid || loading}
                    onClick={formikProps.submitForm}
                    color="primary"
                    variant="contained"
                  >{loading &&
                    <MoonLoader
                      sizeUnit={"px"}
                      size={15}
                      color={theme.palette.common.white}
                      loading={true}
                    />}{'TEST SUBMIT'}</Button>
                  <Button
                    disabled={loading}
                    onClick={() => formikProps.resetForm()}
                    color="primary"
                    variant="contained"
                  >{translate('common.clear')}</Button>
                </Grid>
              </Grid>
            </Grid>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      )}
    </Formik>
  );
}
