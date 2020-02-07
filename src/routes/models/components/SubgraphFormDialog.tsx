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
import { SnackbarError, SNACKBAR_VARIANTS, SubGraph, TopGraph } from '../../../types';
import log from '../../../util/log/logger';
import { DropZoneFormField } from '../../shared/form-fields/DropZoneFormField';
import { SelectFormField, SelectFormFieldOptions } from '../../shared/form-fields/SelectFormField';
import { SwitchFormField } from '../../shared/form-fields/SwitchFormField';
import { TextFormField } from '../../shared/form-fields/TextFormField';

interface SubgraphFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (subGraph: SubGraph, isEdit?: boolean) => void;
  subGraphToEdit?: SubGraph;
  topGraphs: TopGraph[];
}


export function SubgraphFormDialog(props: SubgraphFormDialogProps) {
  const { open, onClose, onSuccess, subGraphToEdit, topGraphs } = props;
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [loading, setLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const isEdit = !!subGraphToEdit;

  const theme = useTheme();

  const handleClose = () => {
    setIsError(false);
    onClose();
  };

  // to expand to fullscreen on small displays
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const topGraphFormSelectOptions = React.useMemo(() => {
    const tempFormSelectOptions: SelectFormFieldOptions = topGraphs.map((topGraph) => ({ label: topGraph.name, value: topGraph.id }));
    return tempFormSelectOptions;
  }, [topGraphs]);

  const validFilesCheck = (files: File[]) => !!files.length && files[0] instanceof File;

  // validation translated text
  const requiredTranslationText = translate("forms.validation.required");
  const numberText = translate("forms.validation.number");

  const formSchema = yup.object({
    name: yup.string().required(requiredTranslationText).trim(),
    selectedTopGraphId: yup.string().typeError(numberText).nullable().required(requiredTranslationText),
    isPublic: yup.boolean(),
    isImmutable: yup.boolean(),
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
  });
  type FormValues = yup.InferType<typeof formSchema>;
  let initialValues: FormValues = {
    name: "",
    text: "",
    selectedTopGraphId: (topGraphs && topGraphs[0] && topGraphs[0].id) || null,
    isPublic: true,
    isImmutable: false,
    shouldUploadFile: false,
    files: [],
  };
  if (subGraphToEdit) {
    initialValues = {
      ...initialValues,
      selectedTopGraphId: subGraphToEdit.topGraphId,
      name: subGraphToEdit.name,
    };
  }

  const handleSubmit = async (values: FormValues) => {
    if (values.selectedTopGraphId === null) return;
    const { shouldUploadFile, files } = values;
    if (shouldUploadFile && !validFilesCheck(files)) {
      return;
    }
    if (api?.models && !loading) {
      setLoading(true);
      setIsError(false);
      const { name, text, selectedTopGraphId, isImmutable, isPublic } = values;
      let response: postSubGraphResult;
      if (isEdit && subGraphToEdit) {
        response = await api.models.updateSubGraph(subGraphToEdit.id, name.trim(), text.trim(), selectedTopGraphId, isPublic, isImmutable);
      } else {
        if (shouldUploadFile) {
          // only send the first file, because our limit is 1 file only
          response = await api.models.uploadSubGraphFile(name.trim(), files[0], selectedTopGraphId, isPublic, isImmutable);
        } else {
          response = await api.models.postSubGraph(name.trim(), text.trim(), selectedTopGraphId, isPublic, isImmutable);
        }
      }
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
        onSuccess(response.subGraph, isEdit);
        onClose();
      } else {
        log({
          file: `SubgraphFormDialog.tsx`,
          caller: `handleSubmit - failed to create new subgraph / upload subgraph file`,
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

  return (
    <Dialog
      fullScreen={fullScreen}
      disableBackdropClick={loading}
      disableEscapeKeyDown={loading}
      open={open}
      onClose={handleClose}
      aria-labelledby="sub-graph-dialog"
    >
      <DialogTitle id="sub-graph-dialog">{translate(`models.${isEdit ? 'editSubGraph' : 'createSubGraph'}`)}</DialogTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => (
          <>
            <DialogContent>
              <Form>
                <Field autoFocus name='name' component={TextFormField} label={translate("forms.name")} errorOverride={isError} />
                <Field name='selectedTopGraphId' component={SelectFormField}
                  options={topGraphFormSelectOptions} label={translate("forms.top")} errorOverride={isError} />
                {!isEdit && <Field name='shouldUploadFile' component={SwitchFormField} label={translate("forms.source")} text={(value: boolean) => translate(value ? "forms.file" : "forms.text")} errorOverride={isError} />}
                <Field
                  showPreviews
                  filesLimit={1}
                  acceptedFiles={['text/*']}
                  hidden={!formikProps.values.shouldUploadFile}
                  name='files'
                  dropZoneText={translate('forms.dropZone.text')}
                  component={DropZoneFormField}
                  errorOverride={isError || !!formikProps.errors.files}
                  errorTextOverride={formikProps.errors.files}
                />
                <Field multiline hidden={formikProps.values.shouldUploadFile} name='text' component={TextFormField} label={translate("forms.text")} errorOverride={isError} />
                <Field name='isPublic' component={SwitchFormField} label={translate("forms.privacySetting")} text={(value: boolean) => translate(value ? "forms.private" : "forms.public")} errorOverride={isError} />
                <Field name='isImmutable' component={SwitchFormField} label={translate("forms.mutability")} text={(value: boolean) => translate(value ? "forms.immutable" : "forms.mutable")} errorOverride={isError} />
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