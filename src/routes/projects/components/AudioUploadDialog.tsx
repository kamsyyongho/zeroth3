import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import BackupIcon from '@material-ui/icons/Backup';
import { Field, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import * as yup from 'yup';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { ProblemKind } from '../../../services/api/types';
import { ModelConfig, SnackbarError } from '../../../types';
import log from '../../../util/log/logger';
import { DropZoneFormField } from '../../shared/form-fields/DropZoneFormField';
import { SelectFormField, SelectFormFieldOptions } from '../../shared/form-fields/SelectFormField';


interface AudioUploadDialogProps {
  open: boolean;
  projectId: number;
  modelConfigs: ModelConfig[];
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_TOTAL_FILE_SIZE_LIMIT = 10000000; // 10 MB in bytes
const MAX_TOTAL_FILE_SIZE_LIMIT_STRING = '10 MB';

export function AudioUploadDialog(props: AudioUploadDialogProps) {
  const { open, projectId, modelConfigs, onClose, onSuccess } = props;
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [loading, setLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  const theme = useTheme();

  const handleClose = () => {
    setIsError(false);
    onClose();
  };

  // to expand to fullscreen on small displays
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const formSelectOptions = React.useMemo(() => {
    const tempFormSelectOptions: SelectFormFieldOptions = modelConfigs.map((modelConfig) => ({ label: modelConfig.name, value: modelConfig.id }));
    return tempFormSelectOptions;
  }, [modelConfigs]);

  const validFilesCheck = (files: File[]) => !!files.length && files.every(file => file instanceof File);

  // validation translated text
  const requiredTranslationText = translate("forms.validation.required");
  const numberText = translate("forms.validation.number");
  const integerText = translate("forms.validation.integer");
  const maxFileSizeText = translate("forms.validation.maxFileSize", { value: MAX_TOTAL_FILE_SIZE_LIMIT_STRING });


  const testMaxTotalFileSize = (files: File[]) => {
    let fileSizeCounter = 0;
    let isValid = true;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      fileSizeCounter += file.size;
      if (fileSizeCounter >= MAX_TOTAL_FILE_SIZE_LIMIT) {
        isValid = false;
        break;
      }
    }
    return isValid;
  };

  const formSchema = yup.object({
    selectedModelConfigId: yup.number().integer(integerText).typeError(numberText).nullable().required(requiredTranslationText),
    files: yup.array<File>().required(requiredTranslationText).test('files', maxFileSizeText, testMaxTotalFileSize),
  });
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    selectedModelConfigId: null,
    files: [],
  };

  const handleSubmit = async (values: FormValues) => {
    const { files, selectedModelConfigId } = values;
    if (!validFilesCheck(files) || selectedModelConfigId === null) {
      return;
    }
    if (api && api.rawData && !loading) {
      setLoading(true);
      setIsError(false);
      const response = await api.rawData.uploadRawData(projectId, selectedModelConfigId, files);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        onSuccess();
        onClose();
      } else {
        if (response.kind === ProblemKind['rejected']) {
          log({
            file: `AudioUploadDialog.tsx`,
            caller: `handleSubmit - uploaded file size exceeded`,
            value: response,
            important: true,
          });
        } else {
          log({
            file: `AudioUploadDialog.tsx`,
            caller: `handleSubmit - failed to upload audio file(s)`,
            value: response,
            important: true,
          });
        }
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
      disableBackdropClick={loading}
      disableEscapeKeyDown={loading}
      open={open}
      onClose={handleClose}
      aria-labelledby="audio-upload-dialog"
    >
      <DialogTitle id="audio-upload-dialog">{translate(`TDP.uploadData`)}</DialogTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => (
          <>
            <DialogContent>
              <Form>
                <Field name='selectedModelConfigId' component={SelectFormField}
                  options={formSelectOptions} label={translate("forms.modelConfig")} errorOverride={isError} />
                <Field
                  showPreviews
                  maxFileSize={MAX_TOTAL_FILE_SIZE_LIMIT}
                  acceptedFiles={['audio/*']}
                  name='files'
                  component={DropZoneFormField}
                  helperText={!!formikProps.values.files.length && translate('forms.numberFiles', { count: formikProps.values.files.length })}
                  errorOverride={isError || !!formikProps.errors.files}
                  errorTextOverride={formikProps.errors.files}
                />
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
                  /> : <BackupIcon />}
              >
                {translate("common.upload")}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}