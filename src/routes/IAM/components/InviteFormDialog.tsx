import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import SendIcon from '@material-ui/icons/Send';
import { Field, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import * as yup from 'yup';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { SnackbarError } from '../../../types';
import log from '../../../util/log/logger';
import { TextFormField } from '../../shared/form-fields/TextFormField';

interface InviteFormDialogProps {
  open: boolean;
  onClose: () => void;
}


export function InviteFormDialog(props: InviteFormDialogProps) {
  const { open, onClose } = props;
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [loading, setLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  const theme = useTheme();
  // to expand to fullscreen on small displays
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));


  const formSchema = yup.object({
    email: yup.string().email(`${translate("forms.validation.email")}`).required(`${translate("forms.validation.required")}`).trim()
  });
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    email: "",
  };

  const handleSubmit = async (values: FormValues) => {
    if (api && api.IAM && !loading) {
      setLoading(true);
      setIsError(false);
      const response = await api.IAM.inviteUser(values.email.trim());
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        onClose();
      } else {
        log({
          file: `InviteFormDialog.tsx`,
          caller: `handleSubmit - failed send invite`,
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

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      disableBackdropClick={loading}
      disableEscapeKeyDown={loading}
      aria-labelledby="invite-dialog"
    >
      <DialogTitle id="invite-dialog">{translate("IAM.inviteUser")}</DialogTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => (
          <>
            <DialogContent>
              <Form>
                <Field autoFocus name='email' component={TextFormField} label={translate("forms.email")} errorOverride={isError} />
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
                  /> : <SendIcon />}
              >
                {translate("IAM.invite")}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}