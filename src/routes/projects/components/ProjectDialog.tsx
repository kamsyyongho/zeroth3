import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import clsx from 'clsx';
import { Field, Form, Formik } from 'formik';
import { useSnackbar } from 'notistack';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import * as yup from 'yup';
import { VALIDATION } from '../../../constants';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { postProjectResult, updateProjectResult } from '../../../services/api/types';
import { Project, SnackbarError, SNACKBAR_VARIANTS } from '../../../types';
import log from '../../../util/log/logger';
import { TextFormField } from '../../shared/form-fields/TextFormField';


const useStyles = makeStyles((theme) =>
  createStyles({
    hidden: {
      visibility: 'hidden',
    },
  }),
);

interface ProjectDialogProps {
  open: boolean;
  hideBackdrop?: boolean;
  onClose: (projectId?: string) => void;
  onSuccess: (project: Project, isEdit?: boolean) => void;
  projectToEdit?: Project;
}

export function ProjectDialog(props: ProjectDialogProps) {
  const { open, hideBackdrop, onClose, onSuccess, projectToEdit } = props;
  const isEdit = !!projectToEdit;
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const api = React.useContext(ApiContext);
  const [loading, setLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  const theme = useTheme();
  const classes = useStyles();
  // to expand to fullscreen on small displays
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));


  // validation translated text
  const nameText = translate("forms.validation.between", { target: translate('forms.name'), first: VALIDATION.PROJECT.name.min, second: VALIDATION.PROJECT.name.max, context: 'characters' });
  const requiredTranslationText = translate("forms.validation.required");

  const formSchema = yup.object({
    name: yup.string().min(VALIDATION.PROJECT.name.min, nameText).max(VALIDATION.PROJECT.name.max, nameText).required(requiredTranslationText).trim(),
  });
  type FormValues = yup.InferType<typeof formSchema>;
  let initialValues: FormValues = {
    name: "",
  };
  if (projectToEdit) {
    initialValues = {
      ...initialValues,
      name: projectToEdit.name,
    };
  }

  const handleClose = () => {
    setIsError(false);
    onClose((isEdit && projectToEdit) ? projectToEdit.id : undefined);
  };

  const handleSubmit = async (values: FormValues) => {
    if (api?.projects && !loading) {
      setLoading(true);
      setIsError(false);
      const { name } = values;
      let response: updateProjectResult | postProjectResult;
      if (isEdit && projectToEdit) {
        response = await api.projects.updateProject(name.trim(), projectToEdit.id);
      } else {
        response = await api.projects.postProject(name.trim());
      }
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        const { project } = response;
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: SNACKBAR_VARIANTS.success });
        onSuccess(project, isEdit);
        handleClose();
      } else {
        log({
          file: `ProjectDialog.tsx`,
          caller: `handleSubmit - failed create project`,
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
      aria-labelledby="project-dialog"
      BackdropProps={{
        className: clsx(hideBackdrop && classes.hidden),
      }}
    >
      <DialogTitle id="project-dialog">{translate(isEdit ? "projects.editProject" : "projects.createProject")}</DialogTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => (
          <>
            <DialogContent>
              <Form>
                <Field autoFocus name='name' component={TextFormField} label={translate("forms.name")} errorOverride={isError} />
              </Form>
            </DialogContent>
            <DialogActions>
              <Button disabled={loading} onClick={handleClose} color="primary">
                {translate("common.cancel")}
              </Button>
              <Button
                disabled={!formikProps.isValid || loading}
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