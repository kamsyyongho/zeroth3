import { Box, FormControl, FormHelperText } from '@material-ui/core';
import { FieldProps, getIn } from "formik";
import { DropzoneArea, DropzoneAreaProps } from 'material-ui-dropzone';
import React from "reactn";
import { I18nContext } from '../../../hooks/i18n/I18nContext';

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
  onDuplicateFileNames?: (fileName: string, resetError?: boolean) => void;
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
  onDuplicateFileNames,
  ...props
}: DropZoneFormFieldProps) => {
  const { translate } = React.useContext(I18nContext);

  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  const isError = !!errorText || !!errorOverride;

  const handleChange = (selectedFiles: File[]) => {
    if (typeof onDuplicateFileNames === 'function') {
      const uniqueFileNames: string[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (uniqueFileNames.includes(file.name)) {
          onDuplicateFileNames(file.name);
          form.setFieldError(field.name, `${translate('forms.dropZone.reject.duplicateFileNames')}: ${file.name}`);
          break;
        } else {
          uniqueFileNames.push(file.name);
        }
      }
      if (uniqueFileNames.length === selectedFiles.length) {
        form.setFieldValue(field.name, selectedFiles);
        onDuplicateFileNames('', true);
      }
    } else {
      form.setFieldValue(field.name, selectedFiles);
    }
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
          showFileNamesInPreview={true}
          showPreviews={showPreviews}
          showPreviewsInDropzone={false}
          useChipsForPreview={true}
          getFileLimitExceedMessage={(filesLimit: number) => `File limit exeeded: ${filesLimit}`}
          getFileAddedMessage={(fileName: string) => `File added: ${fileName}`}
          getFileRemovedMessage={(fileName: string) => `File removed: ${fileName}`}
          getDropRejectMessage={handleRejectText}
          {...props}
        />
      </Box>
      {helperText && <FormHelperText error={false} >{helperText}</FormHelperText>}
      <FormHelperText>{errorText || (errorOverride && errorTextOverride)}</FormHelperText>
    </FormControl>
  );
};