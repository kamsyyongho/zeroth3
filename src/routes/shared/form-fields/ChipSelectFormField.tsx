import { Chip, FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@material-ui/core";
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { FieldProps, getIn } from "formik";
import React from "reactn";
import { SelectFormFieldOption, SelectFormFieldOptions } from './SelectFormField';


const useStyles = makeStyles((theme) =>
  createStyles({
    default: {
      margin: 2,
    },
    light: {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
      margin: 2,
    },
  }),
);

interface LabelsByValue {
  [x: string]: string;
}

interface ChipSelectFormFieldProps extends FieldProps {
  errorOverride?: boolean;
  fullWidth?: boolean;
  label?: string;
  /** if we need to use the lighter primary text */
  light?: boolean;
  labelsByValue: LabelsByValue;
  options: SelectFormFieldOptions;
}

export const ChipSelectFormField = ({ field, form, label, options, labelsByValue, errorOverride, fullWidth, light, ...props }: ChipSelectFormFieldProps) => {
  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);

  const classes = useStyles();
  return (
    <FormControl fullWidth={fullWidth} error={!!errorText || !!errorOverride}>
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        multiple
        fullWidth={fullWidth}
        renderValue={selected => (
          <>
            {(selected as string[]).map(value => (
              <Chip
                key={value}
                label={labelsByValue[value]}
                size='small'
                className={light ? classes.light : classes.default}
              />
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
