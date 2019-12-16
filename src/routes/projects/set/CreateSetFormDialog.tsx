import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import AddIcon from '@material-ui/icons/Add';
import { Field, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import * as yup from 'yup';
import { VALIDATION } from '../../../constants';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { FilterParams, SnackbarError } from '../../../types';
import log from '../../../util/log/logger';
import { TextFormField } from '../../shared/form-fields/TextFormField';

interface CreateSetFormDialogProps {
  open: boolean;
  projectId: string;
  filterParams: FilterParams;
  onClose: () => void;
  onSuccess?: () => void;
}


export function CreateSetFormDialog(props: CreateSetFormDialogProps) {
  const { open, onClose, onSuccess, projectId, filterParams } = props;
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [loading, setLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  const theme = useTheme();
  // to expand to fullscreen on small displays
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const handleSuccess = () => {
    onClose();
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess();
    }
  };

  // validation translated text
  const nameText = translate("forms.validation.between", { target: translate('forms.name'), first: VALIDATION.SET.name.min, second: VALIDATION.SET.name.max, context: 'characters' });
  const requiredTranslationText = translate("forms.validation.required");

  const formSchema = yup.object({
    name: yup.string().min(VALIDATION.SET.name.min, nameText).max(VALIDATION.SET.name.max, nameText).required(requiredTranslationText).trim(),
  });
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    name: "",
  };

  const handleSubmit = async (values: FormValues) => {
    if (api?.dataSet && !loading) {
      setLoading(true);
      setIsError(false);
      const response = await api.dataSet.postDataSet(values.name.trim(), projectId, filterParams);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        handleSuccess();
      } else {
        log({
          file: `CreateSetFormDialog.tsx`,
          caller: `handleSubmit - failed to create set`,
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

  if (!filterParams) {
    return null;
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      disableBackdropClick={loading}
      disableEscapeKeyDown={loading}
      aria-labelledby="create-set-dialog"
    >
      <DialogTitle id="create-set-dialog">{translate("SET.createSet")}</DialogTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => (
          <>
            <DialogContent>
              <Form>
                <Field autoFocus name='name' component={TextFormField} label={translate("forms.name")} errorOverride={isError} />
              </Form>
            </DialogContent>
            <DialogActions>
              <Button disabled={loading} onClick={onClose} color="primary">
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
                  /> : <AddIcon />}
              >
                {translate("common.create")}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}