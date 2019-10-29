import { Chip, FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@material-ui/core";
import { FieldProps, getIn } from "formik";
import React from "react";
import { SelectFormFieldOption, SelectFormFieldOptions } from './SelectFormField';


interface LabelsByValue {
  [x: string]: string
}

interface ChipSelectFormFieldProps extends FieldProps {
  errorOverride?: boolean
  fullWidth?: boolean
  label?: string
  labelsByValue: LabelsByValue
  options: SelectFormFieldOptions
}

export const ChipSelectFormField = ({ field, form, label, options, labelsByValue, errorOverride, fullWidth, ...props }: ChipSelectFormFieldProps) => {
  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  return (
    <FormControl fullWidth={fullWidth} error={!!errorText || !!errorOverride}>
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        multiple
        fullWidth={fullWidth}
        renderValue={selected => (
          <>
            {(selected as string[]).map(value => (
              <Chip key={value} label={labelsByValue[value]} style={{ margin: 2 }} />
            ))}
          </>
        )}
        {...field} {...props}>
        {options.map((op: SelectFormFieldOption) => (
          <MenuItem key={op.value} value={op.value}>
            {op.label}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{errorText}</FormHelperText>
    </FormControl>
  );
};
