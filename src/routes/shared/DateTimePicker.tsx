import { DateTimePicker as MuiDateTimePicker, DateTimePickerProps as MuiDateTimePickerProps } from '@material-ui/pickers';
import React from 'reactn';
import { I18nContext } from '../../hooks/i18n/I18nContext';

interface DateTimePickerProps extends MuiDateTimePickerProps {
  fullWidth?: boolean;
}

export default function DateTimePicker(props: DateTimePickerProps) {
  const { fullWidth, ampm = true, ...restProps } = props;
  const { dateTimeFormats } = React.useContext(I18nContext);

  return (
    <MuiDateTimePicker
      format={dateTimeFormats.dateTime}
      ampm={ampm}
      fullWidth={fullWidth}
      {...restProps}
    />
  );
};