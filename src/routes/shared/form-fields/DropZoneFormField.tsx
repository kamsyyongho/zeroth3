import { Box, FormControl, FormHelperText } from '@material-ui/core';
import { FieldProps, getIn } from "formik";
import { DropzoneArea, DropzoneAreaProps } from 'material-ui-dropzone';
import React from "reactn";
import { noop } from '../../../constants/misc.constants';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { useSnackbar } from 'notistack';
import { SNACKBAR_VARIANTS } from '../../../types';

/**
 * max upload file size in bytes
 * - 300 MB
 */
const MAX_FILE_SIZE = 300000000;

/**
 * The size conversion that is used by `material-ui-dropzone`
 * - this function has been copied VERBATIM (the types were added by me) to keep consistancy with their code
 * @param filesize in bytes
 */
function convertBytesToMbsOrKbs(filesize: number) {
  let size = '';
  // I know, not technically correct...
  if (filesize >= 1000000) {
    size = (filesize / 1000000) + ' megabytes';
  } else if (filesize >= 1000) {
    size = (filesize / 1000) + ' kilobytes';
  } else {
    size = filesize + ' bytes';
  }
  return size;
}

interface DropZoneFormFieldProps extends FieldProps, DropzoneAreaProps {
  errorOverride?: boolean;
  errorTextOverride?: boolean;
  helperText?: string;
  dropZoneText?: string;
  hidden?: boolean;
  fullWidth?: boolean;
  onDuplicateFileNames?: (fileName?: string) => void;
  onMaxFileSizeExceeded?: (totalSize?: string) => void;
}

export const DropZoneFormField = ({
  field,
  form,
  errorOverride,
  errorTextOverride,
  helperText,
  dropZoneText,
  filesLimit,
  maxFileSize,
  showPreviews,
  acceptedFiles,
  hidden,
  fullWidth,
  onDuplicateFileNames = noop,
  onMaxFileSizeExceeded = noop,
  ...props
}: DropZoneFormFieldProps) => {
  const { translate } = React.useContext(I18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const [selectedFilesLength, setSelectedFilesLength] = React.useState(0);
  const [fileNames, setFileNames] = React.useState<string[]>([]);
  const [showAlerts, setShowAlerts] = React.useState<boolean>(true);

  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  const isError = !!errorText || !!errorOverride;

  const handleChange = (selectedFiles: File[]) => {
    // reset errors before check
    form.setFieldError(field.name, '');
    onDuplicateFileNames();
    onMaxFileSizeExceeded();


    const fileSizeToCompare = maxFileSize ? maxFileSize : MAX_FILE_SIZE;
    const uniqueFileNames: string[] = [];
    let totalSize = 0;
    let invalidFiles = false;
    let snackBarMessage = selectedFiles.length < 7 ? 'Files Added : ' : `${selectedFiles.length} Files Added`;
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      totalSize += file.size;
      if (uniqueFileNames.includes(file.name)) {
        onDuplicateFileNames(file.name);
        invalidFiles = true;
        form.setFieldError(field.name, `${translate('forms.dropZone.reject.duplicateFileNames')}: ${file.name}`);
        break;
      } else {
        uniqueFileNames.push(file.name);
        setFileNames(uniqueFileNames);
      }
    }
    if (totalSize > fileSizeToCompare) {
      invalidFiles = true;
      onMaxFileSizeExceeded(convertBytesToMbsOrKbs(totalSize));
      form.setFieldError(field.name, translate('forms.validation.maxFileSize', { value: convertBytesToMbsOrKbs(totalSize) }));
    }
    if (!invalidFiles) {
      form.setFieldValue(field.name, selectedFiles);
    }
    setSelectedFilesLength(selectedFiles.length);
  };

  const handleRejectText = (
    rejectedFile: { name: string; type: string | undefined; size: number; },
    acceptedFiles: string[],
    maxFileSize: number
  ) => {
    const main = translate('forms.dropZone.reject.main', { name: rejectedFile.name });
    let message = main;
    if (rejectedFile.type && !acceptedFiles.includes(rejectedFile.type)) {
      const notSupported = translate('forms.dropZone.reject.notSupported');
      message += ` ${notSupported} `;
    }
    if (rejectedFile.size > maxFileSize) {
      const exceedSizeLimit = translate('forms.dropZone.reject.exceedSizeLimit', { size: convertBytesToMbsOrKbs(maxFileSize) });
      message += ` ${exceedSizeLimit} `;
    }
    return message;
  };

  const handleRemoveFile = (fileName: string) => {
    enqueueSnackbar(`File Removed : ${fileName}`, { variant: SNACKBAR_VARIANTS.error, autoHideDuration: 3000, });
    return '';
  };

  const handleFileAdded = (fileName: string) => {
    if(fileNames.includes(fileName)) {
      enqueueSnackbar(`[${fileName}] ${translate('forms.dropZone.reject.duplicateFileNames')}`,
          { variant: SNACKBAR_VARIANTS.error, autoHideDuration: 2000, });
    }
    return '';
  };

  const handleFileLimit = (fileLimit: number) => {
    enqueueSnackbar(`File Limit Exceeded : ${fileLimit}`,
        { variant: SNACKBAR_VARIANTS.error, autoHideDuration: 3000, });
    return '';
  };

  return (
    <FormControl
      style={{ display: hidden ? 'none' : undefined, minWidth: 300 }}
      fullWidth={fullWidth}
      error={isError}
    >
      <Box border={isError ? 1 : 0} borderColor={isError ? 'error.main' : undefined} >
        <DropzoneArea
          filesLimit={filesLimit || 100}
          acceptedFiles={acceptedFiles}
          maxFileSize={maxFileSize || MAX_FILE_SIZE}
          onChange={handleChange}
          dropzoneText={dropZoneText || translate('forms.dropZone.main')}
          showFileNamesInPreview={selectedFilesLength < 7}
          showPreviews={selectedFilesLength  < 7}
          showPreviewsInDropzone={false}
          useChipsForPreview={true}
          getFileLimitExceedMessage={handleFileLimit}
          getFileRemovedMessage={handleRemoveFile}
          getFileAddedMessage={handleFileAdded}
          getDropRejectMessage={handleRejectText}
          //disable alerts for and handle alerts in onDrop API
          showAlerts={false}
          {...props}
        />
      </Box>
      {helperText && <FormHelperText error={false} >{helperText}</FormHelperText>}
      <FormHelperText>{errorText || (errorOverride && errorTextOverride)}</FormHelperText>
    </FormControl>
  );
};