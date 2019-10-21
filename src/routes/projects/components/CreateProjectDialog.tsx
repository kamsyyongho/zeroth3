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
import { Project, SnackbarError } from '../../../types';
import log from '../../../util/log/logger';
import { SelectFormField, SelectFormFieldOptions } from '../../shared/form-fields/SelectFormField';
import { TextFormField } from '../../shared/form-fields/TextFormField';



interface CreateProjectDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (newProject: Project) => void
}

export function CreateProjectDialog(props: CreateProjectDialogProps) {
  const { open, onClose, onSuccess } = props;
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const api = React.useContext(ApiContext);
  const [loading, setLoading] = React.useState(false)
  const [isError, setIsError] = React.useState(false)

  const theme = useTheme();
  // to expand to fullscreen on small displays
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const formSelectOptions = React.useMemo(() => {
    const tempFormSelectOptions: SelectFormFieldOptions = [];
    for (let i = 1; i <= 100; i++) {
      tempFormSelectOptions.push({ label: `${i}`, value: i });
    }
    return tempFormSelectOptions
  }, [])

  // validation translated text
  const thresholdLcText = translate("forms.thresholdLc") as string;
  const thresholdHcText = translate("forms.thresholdHc") as string;
  const nameText = translate("forms.validation.between", { target: translate('forms.name'), first: VALIDATION.PROJECT.name.min, second: VALIDATION.PROJECT.name.max, context: 'characters' }) as string;
  const requiredTranslationText = translate("forms.validation.required") as string;

  const formSchema = yup.object({
    name: yup.string().min(VALIDATION.PROJECT.name.min, nameText).max(VALIDATION.PROJECT.name.max, nameText).required(requiredTranslationText).trim(),
    thresholdLc: yup.number().min(VALIDATION.PROJECT.threshold.min).max(VALIDATION.PROJECT.threshold.max).lessThan(yup.ref('thresholdHc'), `${translate('forms.validation.lessThan', { target: thresholdLcText, value: thresholdHcText })}`).required(requiredTranslationText),
    thresholdHc: yup.number().min(VALIDATION.PROJECT.threshold.min).max(VALIDATION.PROJECT.threshold.max).moreThan(yup.ref('thresholdLc'), `${translate('forms.validation.greaterThan', { target: thresholdHcText, value: thresholdLcText })}`).required(requiredTranslationText),
  })
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    name: "",
    thresholdLc: VALIDATION.PROJECT.threshold.min,
    thresholdHc: VALIDATION.PROJECT.threshold.max,
  };

  const handleSubmit = async (values: FormValues) => {
    if (api && api.projects) {
      setLoading(true);
      setIsError(false);
      const { name, thresholdHc, thresholdLc } = values;
      const response = await api.projects.postProject(name.trim(), thresholdHc, thresholdLc);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === "ok") {
        //!
        //TODO
        // show completed message
        log({
          file: `CreateProjectDialog.tsx`,
          caller: `handleSubmit - SUCCESS`,
          value: response,
        })
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        onSuccess(response.project)
        onClose();
      } else {
        log({
          file: `CreateProjectDialog.tsx`,
          caller: `handleSubmit - failed create project`,
          value: response,
          important: true,
        })
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
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">{translate("projects.createProject")}</DialogTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => (
          <>
            <DialogContent>
              <Form>
                <Field autoFocus name='name' component={TextFormField} label={translate("forms.name")} errorOverride={isError} />
                <Field name='thresholdLc' component={SelectFormField}
                  options={formSelectOptions} label={thresholdLcText} errorOverride={isError} />
                <Field name='thresholdHc' component={SelectFormField}
                  options={formSelectOptions} label={thresholdHcText} errorOverride={isError} />
              </Form>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} color="primary">
                {translate("common.cancel")}
              </Button>
              <Button onClick={formikProps.submitForm} color="primary" variant="outlined"
                startIcon={loading ?
                  <MoonLoader
                    sizeUnit={"px"}
                    size={15}
                    color={theme.palette.primary.main}
                    loading={true}
                  /> : <AddIcon />}
              >
                {translate("projects.create")}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}