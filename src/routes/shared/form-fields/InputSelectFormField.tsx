import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { FieldProps, getIn } from "formik";
import React from "reactn";

interface InputSelectFormFieldProps extends FieldProps {
  errorOverride?: boolean;
  hidden?: boolean;
  fullWidth?: boolean;
  margin?: "none" | "dense" | "normal";
  options: string[];
}

export const InputSelectFormField = ({
  field,
  form,
  errorOverride,
  hidden,
  margin,
  fullWidth,
  options,
  ...props
}: InputSelectFormFieldProps) => {
  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  return (
    <Autocomplete
      freeSolo
      options={options}
      // handle empty fields for 'number' type inputs
      // prevents controlled component error when passing empty values on init
      value={(field.value === undefined || field.value === null) ? '' : field.value}
      renderInput={params => (
        <TextField
          style={{ display: hidden ? 'none' : undefined }}
          fullWidth={fullWidth}
          margin={margin || 'normal'}
          helperText={errorText}
          error={!!errorText || !!errorOverride}
          {...field}
          {...params}
        />
      )}
      onChange={(event: React.ChangeEvent<{}>, value: string | null) => {
        form.setFieldValue(field.name, value || '');
      }}
      {...props}
    />
  );
};