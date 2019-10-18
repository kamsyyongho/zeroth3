import { SnackbarOrigin } from "@material-ui/core/Snackbar";
import { createContext } from "react";
import { SnackbarError } from './useSnackbar';

export const DEFAULT_ANCHOR_ORIGIN: SnackbarOrigin = {
  vertical: 'bottom',
  horizontal: 'right',
}

export interface ParsedSnackbarContext {
  openSnackbar: (error?: SnackbarError, callback?: () => void) => void,
  closeSnackbar: () => void,
  snackbarOpen: boolean,
  isError: boolean,
  errorText: string,
  anchorOrigin: SnackbarOrigin
  setAnchorOrigin: (anchorOrigin: SnackbarOrigin) => void
}

const defaultContext: ParsedSnackbarContext = {
  openSnackbar: () => { },
  closeSnackbar: () => { },
  snackbarOpen: false,
  isError: false,
  errorText: "",
  anchorOrigin: DEFAULT_ANCHOR_ORIGIN,
  setAnchorOrigin: () => { }
}

export const SnackbarContext = createContext(defaultContext)