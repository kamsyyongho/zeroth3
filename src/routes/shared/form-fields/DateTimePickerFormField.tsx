
import { DateTimePicker, DateTimePickerProps } from '@material-ui/pickers';
import { FieldProps, getIn } from "formik";
import React from "react";
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
    ampm = true,
    ...restProps
  } = props;
  const { dateTimeFormat } = React.useContext(I18nContext);
  const errorText =
    getIn(form.touched, field.name) && getIn(form.errors, field.name);
  return (
    <DateTimePicker
      format={dateTimeFormat}
      ampm={ampm}
      margin={margin}
      value={field.value}
      onChange={(date: Date | null) => form.setFieldValue(field.name, date)}
      fullWidth={fullWidth}
      {...restProps}
    />
  );
};