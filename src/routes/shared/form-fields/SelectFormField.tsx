import { FormControl, FormHelperText, InputLabel, MenuItem, Select, SelectProps } from "@material-ui/core";
import { FieldProps, getIn } from "formik";
import React from "reactn";
import { I18nContext } from '../../../hooks/i18n/I18nContext';

export interface SelectFormFieldOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export type SelectFormFieldOptions = Array<SelectFormFieldOption>;

interface SelectFormFieldProps extends FieldProps, SelectProps {
  errorOverride?: boolean;
  helperText?: string;
  label?: string;
  disabledValues?: (string | number)[];
  options: SelectFormFieldOptions;
}

export const SelectFormField = ({ field, helperText, form, label, options, errorOverride, disabledValues = [], fullWidth, ...props }: SelectFormFieldProps) => {
  const { translate } = React.useContext(I18nContext);
  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  // to account for initial empty fields being `null`
  if (field.value === null) {
    field.value = '';
  }
  return (
    <FormControl fullWidth={fullWidth} error={!!errorText || !!errorOverride}>
      {label && <InputLabel>{label}</InputLabel>}
      <Select fullWidth={fullWidth} {...field} {...props}>
        {options.length ? (options.map((op: SelectFormFieldOption) => {
          // account for blank options
          if (op.value === '') {
            return (<MenuItem key={'empty'} value={op.value} >
              <em>{op.label}</em>
            </MenuItem>);
          }
          return (<MenuItem disabled={op.disabled || (disabledValues).includes(op.value)} key={op.value} value={op.value}>
            {op.label}
          </MenuItem>);
        })) : (
            <MenuItem key={'empty'} value={''} disabled >
              <em>{translate('forms.none')}</em>
            </MenuItem>
          )}
      </Select>
      <FormHelperText>{errorText || helperText}</FormHelperText>
    </FormControl>
  );
};