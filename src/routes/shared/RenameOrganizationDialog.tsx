import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { useTheme } from '@material-ui/core/styles';
import EditIcon from '@material-ui/icons/Edit';
import { Field, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import * as yup from 'yup';
import { VALIDATION } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { SnackbarError } from '../../types/snackbar.types';
import log from '../../util/log/logger';
import { TextFormField } from './form-fields/TextFormField';

interface RenameOrganizationDialogProps {
  open: boolean;
  name: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function RenameOrganizationDialog(props: RenameOrganizationDialogProps) {
  const { open, name, onSuccess, onClose } = props;
  const api = React.useContext(ApiContext);
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  const theme = useTheme();

  // validation translated text
  const nameText = translate("forms.validation.between", { target: translate('forms.name'), first: VALIDATION.ORGANIZATION.name.min, second: VALIDATION.ORGANIZATION.name.max, context: 'characters' });
  const requiredTranslationText = translate("forms.validation.required");

  const formSchema = yup.object({
    name: yup.string().min(VALIDATION.PROJECT.name.min, nameText).max(VALIDATION.PROJECT.name.max, nameText).required(requiredTranslationText).trim(),
  });
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    name: name || '',
  };

  const handleSubmit = async (values: FormValues) => {
    if (api?.organizations && !loading) {
      setLoading(true);
      setIsError(false);
      const response = await api.organizations.renameOrganization(values.name);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        onSuccess();
        onClose();
      } else {
        log({
          file: `RenameOrganizationDialog.tsx`,
          caller: `renameOrganization - failed to get organization`,
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
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">{translate('organization.renameOrg')}</DialogTitle>
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
                  /> : <EditIcon />}
              >
                {translate("organization.rename")}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}