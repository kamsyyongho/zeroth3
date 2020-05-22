
import { DateTimePicker, DateTimePickerProps } from '@material-ui/pickers';
import { FormControl, FormControlLabel, FormHelperText, FormLabel } from '@material-ui/core';
import { FieldProps, getIn } from "formik";
import React from "reactn";
import { I18nContext } from '../../../hooks/i18n/I18nContext';

interface DateTimePickerFormFieldProps extends FieldProps, DateTimePickerProps {
  errorOverride?: boolean;
  fullWidth?: boolean;
}

export const DateTimePickerFormField = (props: DateTimePickerFormFieldProps) => {
  const {
    field,
    form,
    fullWidth,
    margin,
    errorOverride,
    ampm = true,
    ...restProps
  } = props;
  const { dateTimeFormats } = React.useContext(I18nContext);
  const [errorText, setErrorText] = React.useState<string | undefined>();

  return (
      <FormControl fullWidth={fullWidth} error={!!errorText || !!errorOverride} style={errorText ? { color: '#f44336 !important' } : {}}>
        <DateTimePicker
            format={dateTimeFormats.dateTime}
            ampm={ampm}
            margin={margin}
            value={field.value}
            helperText={errorText}
            onError={() => setErrorText(getIn(form.errors, field.name))}
            onChange={(date: Date | null) => form.setFieldValue(field.name, date)}
            fullWidth={fullWidth}
            {...restProps}
        />
      </FormControl>
  );

};