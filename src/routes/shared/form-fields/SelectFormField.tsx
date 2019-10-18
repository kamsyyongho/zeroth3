import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@material-ui/core";
import { FieldProps, getIn } from "formik";
import React from "react";

export type SelectFormFieldOptions = Array<{ label: string; value: string | number }>

interface SelectFormFieldProps extends FieldProps {
  errorOverride?: boolean
  label?: string
  options: SelectFormFieldOptions
}

export const SelectFormField = ({ field, form, label, options, errorOverride, ...props }: SelectFormFieldProps) => {
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  return (
    <FormControl fullWidth error={!!errorText || !!errorOverride}>
      {label && <InputLabel>{label}</InputLabel>}
      <Select fullWidth {...field} {...props}>
        {options.map(op => (
          <MenuItem key={op.value} value={op.value}>
            {op.label}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{errorText}</FormHelperText>
    </FormControl>
  );
};