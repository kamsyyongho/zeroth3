import { Box, FormControl, FormHelperText } from '@material-ui/core';
import { FieldProps, getIn } from "formik";
import { DropzoneArea, DropzoneAreaProps } from 'material-ui-dropzone';
import React from "react";

/**
 * max upload file size in bytes
 * - 300 Mb
 */
const MAX_FILE_SIZE = 300000000;


interface DropZoneFormFieldProps extends FieldProps, DropzoneAreaProps {
  errorOverride?: boolean
  hidden?: boolean
  fullWidth?: boolean
}

export const DropZoneFormField = ({ field, form, errorOverride, hidden, fullWidth, ...props }: DropZoneFormFieldProps) => {
  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  const isError = !!errorText || !!errorOverride;
  return (
      <FormControl 
        style={{display: hidden ? 'none' : undefined }}
        fullWidth={fullWidth}
        error={isError}
      >
        <Box border={isError ? 1 : 0} borderColor={isError ? 'error.main' : undefined} >
          <DropzoneArea
            filesLimit={1}
            acceptedFiles={['text/plain']}
            maxFileSize={MAX_FILE_SIZE}
            onChange={(selectedFiles: File[]) => form.setFieldValue(field.name, selectedFiles)}
            showFileNamesInPreview={true}
            showPreviews={true}
            showPreviewsInDropzone={false}
            {...props}
          />
        </Box>
        <FormHelperText>{errorText}</FormHelperText>
      </FormControl>
  );
};