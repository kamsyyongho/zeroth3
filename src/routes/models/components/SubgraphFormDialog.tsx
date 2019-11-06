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
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { postSubGraphResult } from '../../../services/api/types';
import { SnackbarError, SubGraph } from '../../../types';
import log from '../../../util/log/logger';
import { DropZoneFormField } from '../../shared/form-fields/DropZoneFormField';
import { SwitchFormField } from '../../shared/form-fields/SwitchFormField';
import { TextFormField } from '../../shared/form-fields/TextFormField';


interface SubgraphFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (subGraph: SubGraph) => void
  subGraphToEdit?: SubGraph
}


export function SubgraphFormDialog(props: SubgraphFormDialogProps) {
  const { open, onClose, onSuccess, subGraphToEdit } = props;
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [loading, setLoading] = React.useState(false)
  const [isError, setIsError] = React.useState(false)
  const isEdit = !!subGraphToEdit;

  const theme = useTheme();
  // to expand to fullscreen on small displays
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const validFilesCheck = (files: File[]) => !!files.length && files[0] instanceof File

  // validation translated text
  const requiredTranslationText = translate("forms.validation.required");


  const formSchema = yup.object({
    name: yup.string().required(requiredTranslationText).trim(),
    isPublic: yup.boolean(),
    shouldUploadFile: yup.boolean(),
    files: yup.array<File>().when('shouldUploadFile', {
      is: true,
      then: yup.array<File>().required(requiredTranslationText),
      otherwise: yup.array<File>().notRequired(),
    }),
    text: yup.string().when('shouldUploadFile', {
      is: false,
      then: yup.string().required(requiredTranslationText).trim(),
      otherwise: yup.string().notRequired(),
    }),
  })
  type FormValues = yup.InferType<typeof formSchema>;
  let initialValues: FormValues = {
    name: "",
    text: "",
    isPublic: true,
    shouldUploadFile: false,
    files: [],
  };
  if (subGraphToEdit) {
    initialValues = {
      ...initialValues,
      name: subGraphToEdit.name,
    };
  }

  const handleSubmit = async (values: FormValues) => {
    const { shouldUploadFile, files } = values;
    if (shouldUploadFile && !validFilesCheck(files)) {
      return
    }
    if (api && api.models) {
      setLoading(true);
      setIsError(false);
      const { name, text, isPublic } = values;
      let response: postSubGraphResult;
      if (isEdit && subGraphToEdit) {
        //!
        //!
        //!
        //TODO
        //* HANDLE THE EDIT LOGIC HERE
        //!
        //!
        //!
        return
      } else {
        if (shouldUploadFile) {
          response = await api.models.uploadSubGraphFile(name.trim(), files[0], isPublic);
        } else {
          response = await api.models.postSubGraph(name.trim(), text.trim(), isPublic);
        }
      }
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        onSuccess(response.subGraph);
        onClose();
      } else {
        log({
          file: `SubgraphFormDialog.tsx`,
          caller: `handleSubmit - failed create new subgraph / upload subgraph file`,
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
      disableBackdropClick={loading}
      disableEscapeKeyDown={loading}
      open={open}
      onClose={onClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">{translate("models.createSubGraph")}</DialogTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => (
          <>
            <DialogContent>
              <Form>
                <Field autoFocus name='name' component={TextFormField} label={translate("forms.name")} errorOverride={isError} />
                <Field name='shouldUploadFile' component={SwitchFormField} label={translate("forms.source")} text={(value: boolean) => translate(value ? "forms.file" : "forms.text")} errorOverride={isError} />
                <Field hidden={!formikProps.values.shouldUploadFile} name='files' component={DropZoneFormField} errorOverride={isError} />
                <Field multiline hidden={formikProps.values.shouldUploadFile} name='text' component={TextFormField} label={translate("forms.text")} errorOverride={isError} />
                <Field name='isPublic' component={SwitchFormField} label={translate("forms.privacySetting")} text={(value: boolean) => translate(value ? "forms.private" : "forms.public")} errorOverride={isError} />
              </Form>
            </DialogContent>
            <DialogActions>
              <Button disabled={loading} onClick={onClose} color="primary">
                {translate("common.cancel")}
              </Button>
              <Button
                disabled={!formikProps.isValid}
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
                {translate(isEdit ? "common.edit" : "common.submit")}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}