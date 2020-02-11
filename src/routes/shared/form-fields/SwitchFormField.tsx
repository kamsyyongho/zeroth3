import { FormControl, FormControlLabel, FormHelperText, FormLabel, Switch } from '@material-ui/core';
import { SwitchProps } from '@material-ui/core/Switch';
import { FieldProps, getIn } from "formik";
import React from "reactn";

interface SwitchFormFieldProps extends FieldProps {
  errorOverride?: boolean;
  fullWidth?: boolean;
  label?: string;
  color?: SwitchProps['color'];
  text?: ((value: boolean) => string) | string;
}

export const SwitchFormField = ({ field, form, label, text, color, errorOverride, fullWidth, ...props }: SwitchFormFieldProps) => {
  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  return (
    <FormControl fullWidth={fullWidth} error={!!errorText || !!errorOverride}>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControlLabel
        control={
          <Switch
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