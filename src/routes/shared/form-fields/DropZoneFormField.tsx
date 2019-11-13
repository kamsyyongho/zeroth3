import { Box, FormControl, FormHelperText } from '@material-ui/core';
import { FieldProps, getIn } from "formik";
import { DropzoneArea, DropzoneAreaProps } from 'material-ui-dropzone';
import React from "react";

/**
 * max upload file size in bytes
 * - 300 MB
 */
const MAX_FILE_SIZE = 300000000;


interface DropZoneFormFieldProps extends FieldProps, DropzoneAreaProps {
  errorOverride?: boolean;
  errorTextOverride?: boolean;
  helperText?: string;
  hidden?: boolean;
  fullWidth?: boolean;
}

export const DropZoneFormField = ({
  field,
  form,
  errorOverride,
  errorTextOverride,
  helperText,
  filesLimit,
  maxFileSize,
  showPreviews,
  acceptedFiles,
  hidden,
  fullWidth,
  ...props
}: DropZoneFormFieldProps) => {
  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  const isError = !!errorText || !!errorOverride;
  return (
    <FormControl
      style={{ display: hidden ? 'none' : undefined }}
      fullWidth={fullWidth}
      error={isError}
    >
      <Box border={isError ? 1 : 0} borderColor={isError ? 'error.main' : undefined} >
        <DropzoneArea
          filesLimit={filesLimit || 100}
          acceptedFiles={acceptedFiles}
          maxFileSize={maxFileSize || MAX_FILE_SIZE}
          onChange={(selectedFiles: File[]) => form.setFieldValue(field.name, selectedFiles)}
          showFileNamesInPreview={true}
          showPreviews={showPreviews}
          showPreviewsInDropzone={false}
          {...props}
        />
      </Box>
      {helperText && <FormHelperText error={false} >{helperText}</FormHelperText>}
      <FormHelperText>{errorText || (errorOverride && errorTextOverride)}</FormHelperText>
    </FormControl>
  );
};