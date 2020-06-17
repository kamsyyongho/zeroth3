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
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { postSubGraphResult } from '../../../services/api/types';
import { SnackbarError,
  SNACKBAR_VARIANTS,
  SubGraph,
  TopGraph,
  TRAINING_DATA_TYPE_SUB_GRAPH,
  TRAINING_DATA_TYPE_SUB_GRAPH_VALUES } from '../../../types';
import log from '../../../util/log/logger';
import { CheckboxFormField } from '../../shared/form-fields/CheckboxFormField';
import { DropZoneFormField } from '../../shared/form-fields/DropZoneFormField';
import { SelectFormField, SelectFormFieldOptions } from '../../shared/form-fields/SelectFormField';
import { SwitchFormField } from '../../shared/form-fields/SwitchFormField';
import { TextFormField } from '../../shared/form-fields/TextFormField';

const useStyles = makeStyles((theme) =>
  createStyles({
    hidden: {
      visibility: 'hidden',
    },
    hiddenTextInput: {
      height: 0,
      visibility: 'hidden',
    },
  }),
);

interface SubgraphFormDialogProps {
  open: boolean;
  hideBackdrop?: boolean;
  onClose: () => void;
  onSuccess: (subGraph: SubGraph, isEdit?: boolean) => void;
  subGraphToEdit?: SubGraph;
  topGraphs: TopGraph[];
}

const ACCEPTED_FILE_TYPES = ['text/*'];

export function SubgraphFormDialog(props: SubgraphFormDialogProps) {
  const { open, hideBackdrop, onClose, onSuccess, subGraphToEdit, topGraphs } = props;
  const { enqueueSnackbar } = useSnackbar();
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const [loading, setLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const isEdit = !!subGraphToEdit;

  const theme = useTheme();
  const classes = useStyles();

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
    isMutable: yup.boolean(),
    uploadType: yup.string().required(requiredTranslationText),
    files: yup.array<File>().when('uploadType', {
      is: (val) => val === TRAINING_DATA_TYPE_SUB_GRAPH.DATASET,
      then: yup.array<File>().required(requiredTranslationText),
      otherwise: yup.array<File>().notRequired(),
    }),
    path: yup.string().when('uploadType', {
      is: (val) => val === TRAINING_DATA_TYPE_SUB_GRAPH.PATH,
      then: yup.string().required(requiredTranslationText),
      otherwise: yup.string().notRequired(),
    }),
    text: yup.string().when('shouldUploadFile', {
      is: (val) => val === TRAINING_DATA_TYPE_SUB_GRAPH.TEXT,
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
    isMutable: true,
    uploadType: TRAINING_DATA_TYPE_SUB_GRAPH.PATH as string,
    path: "",
    files: [],
  };
  if (subGraphToEdit) {
    initialValues = {
      ...initialValues,
      selectedTopGraphId: subGraphToEdit.topGraphId,
      name: subGraphToEdit.name,
      isMutable: !subGraphToEdit.immutable,
    };
  }

  const uploadTypeFormSelectOptions = React.useMemo(() => {
    const tempFormSelectOptions: SelectFormFieldOptions = TRAINING_DATA_TYPE_SUB_GRAPH_VALUES.map((uploadType) => {
      let label = uploadType;
      switch (uploadType) {
        case TRAINING_DATA_TYPE_SUB_GRAPH.DATASET as string:
          label = translate('SET.dataSet');
          break;
        case TRAINING_DATA_TYPE_SUB_GRAPH.PATH as string:
          label = translate('common.path');
          break;
        case TRAINING_DATA_TYPE_SUB_GRAPH.TEXT as string:
          label = translate('forms.text');
          break;
      }
      return { label, value: uploadType };
    });
    return tempFormSelectOptions;
  }, [translate]);

  const handleSubmit = async (values: FormValues) => {
    if (values.selectedTopGraphId === null) return;
    const { uploadType, files } = values;
    if (uploadType === TRAINING_DATA_TYPE_SUB_GRAPH.DATASET && !validFilesCheck(files)) {
      return;
    }
    if (api?.models && !loading) {
      setLoading(true);
      setIsError(false);
      const { name, text, path, selectedTopGraphId, isMutable, isPublic } = values;
      let response!: postSubGraphResult;
      if (isEdit && subGraphToEdit) {
        response = await api.models.updateSubGraph(subGraphToEdit.id, name.trim(), text.trim(), selectedTopGraphId, isPublic, !isMutable);
      } else {
        if (uploadType === TRAINING_DATA_TYPE_SUB_GRAPH.TEXT) {
          response = await api.models.postSubGraph(name.trim(), text.trim(), selectedTopGraphId, isPublic, !isMutable);
        } else {
          if(uploadType === TRAINING_DATA_TYPE_SUB_GRAPH.DATASET) {
            // only send the first file, because our limit is 1 file only
            response = await api.models.uploadSubGraphFile(name.trim(), files[0], selectedTopGraphId, isPublic, !isMutable);
          } else if (uploadType === TRAINING_DATA_TYPE_SUB_GRAPH.PATH) {
            response = await api.models.uploadSubGraphPath(name.trim(), path, selectedTopGraphId, isPublic, !isMutable);
          }
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
      BackdropProps={{
        className: clsx(hideBackdrop && classes.hidden),
      }}
    >
      <DialogTitle id="sub-graph-dialog">{translate(`models.${isEdit ? 'editSubGraph' : 'createSubGraph'}`)}</DialogTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={formSchema}>
        {(formikProps) => {
          const isDataSet = formikProps.values.uploadType === TRAINING_DATA_TYPE_SUB_GRAPH.DATASET as string;
          const textInputLabel = formikProps.values.uploadType === TRAINING_DATA_TYPE_SUB_GRAPH.PATH as string
              ? translate('forms.filePath')
              : translate('forms.fileUrl');
          return (
          <>
            <DialogContent>
              <Form>
                <Field autoFocus name='name' component={TextFormField} label={translate("forms.name")} errorOverride={isError} />
                <Field name='selectedTopGraphId' component={SelectFormField}
                  options={topGraphFormSelectOptions} label={translate("forms.top")} errorOverride={isError} />
{/*                {!isEdit &&
                <Field name='shouldUploadFile'
                       component={SwitchFormField}
                       label={translate("forms.source")}
                       text={(value: boolean) => translate(value ? "forms.file" : "forms.text")} errorOverride={isError} />}*/}
                  <Field
                      fullWidth
                      name='uploadType'
                      component={SelectFormField}
                      options={uploadTypeFormSelectOptions}
                      label={translate("forms.source")}
                  />

                <Field
                    className={clsx(isDataSet && classes.hiddenTextInput)}
                    hidden={formikProps.values.uploadType !== TRAINING_DATA_TYPE_SUB_GRAPH.PATH}
                    name='path'
                    component={TextFormField}
                    label={textInputLabel}
                    variant="outlined"
                    margin="normal"
                />
                <Field
                  showPreviews
                  filesLimit={1}
                  acceptedFiles={ACCEPTED_FILE_TYPES}
                  hidden={formikProps.values.uploadType !== TRAINING_DATA_TYPE_SUB_GRAPH.DATASET}
                  name='files'
                  dropZoneText={translate('forms.dropZone.text')}
                  component={DropZoneFormField}
                  errorOverride={isError || !!formikProps.errors.files}
                  errorTextOverride={formikProps.errors.files}
                />
                <Field
                    multiline
                    hidden={formikProps.values.uploadType !== TRAINING_DATA_TYPE_SUB_GRAPH.TEXT}
                    name='text'
                    component={TextFormField}
                    label={translate("forms.text")}
                    errorOverride={isError} />
                <Field name='isPublic' component={CheckboxFormField} text={translate("forms.private")} errorOverride={isError} />
                <Field name='isMutable' component={CheckboxFormField} text={translate("forms.mutable")} errorOverride={isError} />
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
        )
        }}
      </Formik>
    </Dialog>
  );
}