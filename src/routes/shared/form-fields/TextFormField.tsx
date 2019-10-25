
import { TextField } from "@material-ui/core";
import { FieldProps, getIn } from "formik";
import React from "react";

interface TextFormFieldProps extends FieldProps {
  errorOverride?: boolean
  fullWidth?: boolean
}

export const TextFormField = ({
  field,
  form,
  errorOverride,
  fullWidth,
  ...props
}: TextFormFieldProps) => {
  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  return (
    <TextField
      fullWidth={fullWidth}
      margin="normal"
      label
      helperText={errorText}
      error={!!errorText || !!errorOverride}
      {...field}
      {...props}
    />
  );
};