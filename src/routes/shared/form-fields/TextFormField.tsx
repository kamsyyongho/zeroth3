
import { TextField } from "@material-ui/core";
import { FieldProps, getIn } from "formik";
import React from "react";

interface TextFormFieldProps extends FieldProps {
  errorOverride?: boolean
  multiline?: boolean
  hidden?: boolean
  fullWidth?: boolean
}

export const TextFormField = ({
  field,
  form,
  multiline,
  errorOverride,
  hidden,
  fullWidth,
  ...props
}: TextFormFieldProps) => {
  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  return (
      <TextField
        style={{display: hidden ? 'none' : undefined }}
        fullWidth={fullWidth}
        multiline={multiline}
        rows={multiline ? 3 : undefined}
        rowsMax={multiline ? 5 : undefined}
        margin="normal"
        label
        helperText={errorText}
        error={!!errorText || !!errorOverride}
        {...field}
        {...props}
      />
  );
};