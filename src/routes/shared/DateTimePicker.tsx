import { DateTimePicker as MuiDateTimePicker, DateTimePickerProps as MuiDateTimePickerProps } from '@material-ui/pickers';
import React from 'react';
import { I18nContext } from '../../hooks/i18n/I18nContext';

interface DateTimePickerProps extends MuiDateTimePickerProps {
  fullWidth?: boolean;
}

export default function DateTimePicker(props: DateTimePickerProps) {
  const { fullWidth = true, ampm = true, onChange, ...restProps } = props;
  const { dateTimeFormat } = React.useContext(I18nContext);

  const handleDateChange = (date: Date | null) => {
    onChange(date);
  };

  return (
    <MuiDateTimePicker
      format={dateTimeFormat}
      onChange={handleDateChange}
      ampm={ampm}
      fullWidth={fullWidth}
      {...restProps}
    />
  );
};