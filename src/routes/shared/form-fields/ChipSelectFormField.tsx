import { Chip, FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@material-ui/core";
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { FieldProps, getIn } from "formik";
import React from "reactn";
import { I18nContext } from '../../../hooks/i18n/I18nContext';
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
  helperText?: string;
  label?: string;
  /** if we need to use the lighter primary text */
  light?: boolean;
  labelsByValue: LabelsByValue;
  options: SelectFormFieldOptions;
  //hidden prop for adding display toggle for transfer learning dataset selection option
    hidden?: boolean;
}

export const ChipSelectFormField = ({ field,
                                        form,
                                        helperText,
                                        label,
                                        options,
                                        labelsByValue,
                                        errorOverride,
                                        fullWidth,
                                        light,
                                        hidden = false,
                                        ...props }: ChipSelectFormFieldProps) => {
  const { translate } = React.useContext(I18nContext);
  if (fullWidth === undefined) fullWidth = true;
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);

  const classes = useStyles();
  return (
    <FormControl fullWidth={fullWidth}
                 error={!!errorText || !!errorOverride}
                 style={{ display: hidden ? 'none' : undefined }}>
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
        {options.length ? (options.map((op: SelectFormFieldOption) => (
          <MenuItem key={op.value} value={op.value} disabled={op.disabled} >
            {op.label}
          </MenuItem>
        ))) : (
            <MenuItem key={'empty'} value={undefined} disabled >
              <em>{translate('forms.none')}</em>
            </MenuItem>
          )}
      </Select>
      <FormHelperText>{errorText || helperText}</FormHelperText>
    </FormControl>
  );
};
