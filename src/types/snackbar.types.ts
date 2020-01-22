export interface SnackbarError {
  isError: boolean;
  errorText?: string;
}

export enum SNACKBAR_VARIANTS {
  'default' = 'default',
  'error' = 'error',
  'success' = 'success',
  'warning' = 'warning',
  'info' = 'info',
}
