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
import { VALIDATION } from '../../../../constants/validation.constants';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { AcousticModel, SnackbarError } from '../../../../types';
import log from '../../../../util/log/logger';
import { SelectFormField, SelectFormFieldOptions } from '../../../shared/form-fields/SelectFormField';
import { TextFormField } from '../../../shared/form-fields/TextFormField';

interface AcousticModelDialogProps {
  open: boolean;
  onClose: (modelId?: string) => void;
  onSuccess: (model: AcousticModel, isEdit?: boolean) => void;
  modelToEdit: AcousticModel;
}


export function AcousticModelDialog(props: AcousticModelDialogProps) {
  const { open, onClose, onSuccess, modelToEdit } = props;
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [loading, setLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const isEdit = !!modelToEdit;

  const theme = useTheme();
  // to expand to fullscreen on small displays
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const formSelectOptions = React.useMemo(() => {
    const tempFormSelectOptions: SelectFormFieldOptions = [];
    VALIDATION.MODELS.ACOUSTIC.sampleRates.forEach(value => tempFormSelectOptions.push({ label: `${value} kHz`, value }));
    return tempFormSelectOptions;
  }, []);


  // validation translated text
  const descriptionText = translate("forms.description");
  const descriptionMaxText = translate("forms.validation.lessEqualTo", { target: descriptionText, value: VALIDATION.MODELS.ACOUSTIC.description.max });

  const yupSchemaObject = {
    description: yup.string().max(VALIDATION.MODELS.ACOUSTIC.description.max, descriptionMaxText).trim(),
  };


  const formSchema = yup.object(yupSchemaObject);
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    description: modelToEdit.description || '',
  };


  const handleClose = () => {
    setIsError(false);
    onClose((isEdit && modelToEdit) ? modelToEdit.id : undefined);
  };

  const handleSubmit = async (values: FormValues) => {
    if (api?.models && !loading) {
      setLoading(true);
      setIsError(false);
      const { description } = values;
      const response = await api.models.updateAcousticModel(modelToEdit.id, description.trim());
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        onSuccess(response.acousticModel, isEdit);
        handleClose();
      } else {
        log({
          file: `AcousticModelDialog.tsx`,
          caller: `handleSubmit - failed to create acoustic model`,
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
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setLoading(false);
    }
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      disableBackdropClick={loading}
      disableEscapeKeyDown={loading}
      open={open}
      onClose={handleClose}
      aria-labelledby="acoustic-model-dialog"
    >
      <DialogTitle id="acoustic-model-dialog">{translate(`models.tabs.acousticModel.${isEdit ? 'edit' : 'create'}`)}</DialogTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => (
          <>
            <DialogContent>
              <Form>
                {!isEdit && <>
                  <Field autoFocus name='name' component={TextFormField} label={translate("forms.name")} errorOverride={isError} />
                  <Field name='location' component={TextFormField} label={translate("forms.location")} errorOverride={isError} />
                  <Field name='sampleRate' component={SelectFormField}
                    options={formSelectOptions} label={translate("forms.sampleRate_khz")} errorOverride={isError} />
                </>}
                <Field name='description' component={TextFormField} label={descriptionText} errorOverride={isError} />
              </Form>
            </DialogContent>
            <DialogActions>
              <Button disabled={loading} onClick={handleClose} color="primary">
                {translate("common.cancel")}
              </Button>
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
                  /> : (isEdit ? <EditIcon /> : <AddIcon />)}
              >
                {translate(isEdit ? "common.edit" : "common.create")}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}