
import { TextField } from "@material-ui/core";
import { FieldProps, getIn } from "formik";
import React from "react";

interface TextFormFieldProps extends FieldProps {
  errorOverride?: boolean
}

export const TextFormField = ({
  field,
  form,
  errorOverride,
  ...props
}: TextFormFieldProps) => {
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  return (
    <TextField
      fullWidth
      margin="normal"
      label
      helperText={errorText}
      error={!!errorText || !!errorOverride}
      {...field}
      {...props}
    />
  );
};