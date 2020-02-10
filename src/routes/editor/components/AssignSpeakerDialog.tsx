import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import CheckIcon from '@material-ui/icons/Check';
import { Field, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import * as yup from 'yup';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { Segment, SnackbarError, SNACKBAR_VARIANTS } from '../../../types';
import log from '../../../util/log/logger';
import { TextFormField } from '../../shared/form-fields/TextFormField';

interface AssignSpeakerDialogProps {
  open: boolean;
  projectId: string;
  dataId: string;
  segment?: Segment;
  segmentIndex?: number;
  onClose: () => void;
  onSuccess: (updatedSegment: Segment, segmentIndex: number) => void;
}


export function AssignSpeakerDialog(props: AssignSpeakerDialogProps) {
  const {
    open,
    projectId,
    dataId,
    segment,
    segmentIndex,
    onClose,
    onSuccess,
  } = props;
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [loading, setLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const speaker = segment?.speaker || '';
  const segmentId = segment?.id || '';

  const theme = useTheme();
  // to expand to fullscreen on small displays
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));


  const formSchema = yup.object({
    speaker: yup.string().trim(),
  });
  type FormValues = yup.InferType<typeof formSchema>;
  const initialValues: FormValues = {
    speaker,
  };

  const handleSubmit = async (values: FormValues) => {
    if (api?.voiceData && !loading && segmentId && segment && typeof segmentIndex === 'number') {
      setLoading(true);
      setIsError(false);
      const response = await api.voiceData.updateSpeaker(projectId, dataId, segmentId, values.speaker.trim());
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
        const updatedSegment = { ...segment, speaker: values.speaker.trim() };
        onSuccess(updatedSegment, segmentIndex);
        onClose();
      } else {
        log({
          file: `AssignSpeakerDialog.tsx`,
          caller: `handleSubmit - failed to assign speaker`,
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
      open={open}
      onClose={onClose}
      disableBackdropClick={loading}
      disableEscapeKeyDown={loading}
      aria-labelledby="invite-dialog"
    >
      <DialogTitle id="invite-dialog">{translate(speaker ? "editor.changeSpeaker" : "editor.addSpeaker")}</DialogTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => (
          <>
            <DialogContent>
              <Form>
                <Field autoFocus name='speaker' component={TextFormField} label={translate("forms.speaker")} errorOverride={isError} />
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
                  /> : <CheckIcon />}
              >
                {translate("editor.confirm")}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}