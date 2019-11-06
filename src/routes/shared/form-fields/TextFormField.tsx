
import { TextField } from "@material-ui/core";
import { FieldProps, getIn } from "formik";
import React from "react";

interface TextFormFieldProps extends FieldProps {
  errorOverride?: boolean;
  multiline?: boolean;
  hidden?: boolean;
  fullWidth?: boolean;
  margin?: "none" | "dense" | "normal";
}

export const TextFormField = ({
  field,
  form,
  multiline,
  errorOverride,
  hidden,
  margin,
  fullWidth,
  ...props
}: TextFormFieldProps) => {
  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  return (
    <TextField
      style={{ display: hidden ? 'none' : undefined }}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={multiline ? 3 : undefined}
      rowsMax={multiline ? 5 : undefined}
      margin={margin || 'normal'}
      helperText={errorText}
      error={!!errorText || !!errorOverride}
      {...field}
      {...props}
      // handle empty fields for 'number' type inputs
      // prevents controlled component error when passing empty values on init
      value={(field.value === undefined || field.value === null) ? '' : field.value}
    />
  );
};