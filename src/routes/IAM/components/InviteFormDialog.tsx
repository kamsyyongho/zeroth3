import { Snackbar } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import SendIcon from '@material-ui/icons/Send';
import clsx from 'clsx';
import { Field, Form, Formik } from 'formik';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import * as yup from 'yup';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import log from '../../../util/log/logger';
import { TextFormField } from '../../shared/form-fields/TextFormField';

interface InviteFormDialogProps {
  open: boolean
  onClose: () => void
}

const useStyles = makeStyles((theme: Theme) => ({
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing(1),
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
}));


export function InviteFormDialog(props: InviteFormDialogProps) {
  const { open, onClose } = props;
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [loading, setLoading] = React.useState(false)
  const [snackbarOpen, setSnackbarOpen] = React.useState(false)
  const [isError, setIsError] = React.useState(false)

  const classes = useStyles();
  const theme = useTheme();
  // to expand to fullscreen on small displays
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));


  const formSchema = yup.object({
    email: yup.string().email(`${translate("forms.validation.email")}`).required(`${translate("forms.validation.required")}`)
  })
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    email: "",
  };

  const handleOpenSnackbar = () => setSnackbarOpen(true);
  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const handleSubmit = async (values: FormValues) => {
    if (api && api.IAM) {
      setLoading(true);
      const response = await api.IAM.inviteUser(values.email);
      if (response.kind === "ok") {
        //!
        //TODO
        // show completed message
        log({
          file: `InviteFormDialog.tsx`,
          caller: `handleSubmit - SUCCESS`,
          value: response,
        })
        setIsError(false);
        onClose();
      } else {
        log({
          file: `InviteFormDialog.tsx`,
          caller: `handleSubmit - failed send invite`,
          value: response,
          important: true,
        })
        setIsError(true);
      }
      handleOpenSnackbar();
      setLoading(false);
    }
  }

  return (
    <>
      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={onClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">{translate("IAM.inviteUser")}</DialogTitle>
        <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
          {(formikProps) => (
            <>
              <DialogContent>
                <Form>
                  <Field name='email' component={TextFormField} label={translate("forms.email")} errorOverride={isError} />
                </Form>
              </DialogContent>
              <DialogActions>
                <Button onClick={onClose} color="primary">
                  {translate("common.cancel")}
                </Button>
                <Button onClick={formikProps.submitForm} color="primary"
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
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        open={snackbarOpen}
        onClose={handleCloseSnackbar}
        autoHideDuration={2500}
        aria-describedby="client-snackbar"
        message={
          <span id="client-snackbar" className={classes.message}>
            {isError ? <ErrorIcon className={clsx(classes.icon, classes.iconVariant)} /> :
              <CheckCircleIcon className={clsx(classes.icon, classes.iconVariant)} />}
            {translate(isError ? 'common.error' : 'common.success')}
          </span>
        }
      />
    </>
  );
}