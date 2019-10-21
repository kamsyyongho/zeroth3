import { SnackbarProps } from '@material-ui/core/Snackbar';

export const SNACKBAR: Omit<SnackbarProps, 'open'> = {
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'right'
  },
  autoHideDuration: 5000 // in ms
};
