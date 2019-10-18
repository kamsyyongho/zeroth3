import { useState } from 'react';
import { DEFAULT_ANCHOR_ORIGIN } from './SnackbarContext';

export interface SnackbarError {
  isError: boolean
  errorText?: string
}

export const useSnackbar = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorText, setErrorText] = useState("")
  const [anchorOrigin, setAnchorOrigin] = useState(DEFAULT_ANCHOR_ORIGIN)

  const setError = (errorText?: string) => {
    setIsError(true)
    if (errorText) setErrorText(errorText);
  }

  const openSnackbar = (error: SnackbarError = { isError: false }, callback: () => void = () => { }) => {
    const { isError, errorText } = error;
    if (isError) setError(errorText);
    setSnackbarOpen(true);
    callback();
  }

  const closeSnackbar = () => {
    setSnackbarOpen(false);
    setIsError(false);
    setErrorText("");
    setAnchorOrigin(DEFAULT_ANCHOR_ORIGIN)
  }

  return { openSnackbar, closeSnackbar, errorText, isError, snackbarOpen, anchorOrigin, setAnchorOrigin }
}