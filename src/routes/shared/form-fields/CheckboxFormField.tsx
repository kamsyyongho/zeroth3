import { FormControl, FormControlLabel, FormLabel, FormHelperText } from '@material-ui/core';
import Checkbox, { CheckboxProps } from '@material-ui/core/Checkbox';
import { FieldProps, getIn } from "formik";
import React from "react";

interface CheckboxFormFieldProps extends FieldProps {
  errorOverride?: boolean
  fullWidth?: boolean
  label?: string
  color?: CheckboxProps['color']
  text?: ((value: boolean) => string) | string
}

export const CheckboxFormField = ({ field, form, label, text, color, errorOverride, fullWidth, ...props }: CheckboxFormFieldProps) => {
  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  return (
    <FormControl fullWidth={fullWidth} error={!!errorText || !!errorOverride}>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControlLabel
        control={
          <Checkbox
            color={color || 'primary'}
            checked={field.value}
            value={field.value}
            {...field}
            {...props}
          />
        }
        label={typeof text === 'function' ? text(field.value) : text}
      />
      <FormHelperText>{errorText}</FormHelperText>
    </FormControl>
  );
};