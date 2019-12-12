import { createMuiTheme, Theme } from '@material-ui/core/styles';
import { ThemeOptions } from '@material-ui/core/styles/createMuiTheme';
import { PaletteOptions } from '@material-ui/core/styles/createPalette';
import { TypographyOptions } from '@material-ui/core/styles/createTypography';

const palette: PaletteOptions = {
  primary: { main: '#2f99cb' },
  secondary: { main: '#004261' },
};

const typography: TypographyOptions = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Lato',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
};

/**
 * a custom category that we are including in our theme
 */
const customTheme = {
  status: {
    selected: 'rgba(47, 153, 203, 0.1)',
  },
  table: {
    border: '#aec2cb',
  },
};

/**
 * Custom interface that must be used when using custom theme values
 */
export interface CustomTheme extends Theme {
  status: {
    selected: string;
  };
  table: {
    border: string;
  };
}

interface CustomThemeOptions extends ThemeOptions {
  status?: {
    selected?: string;
  };
  table?: {
    border?: string;
  };
}

const options: CustomThemeOptions = {
  palette,
  typography,
  ...customTheme,
};

/**
 * main theme for the site
 */
export const theme = createMuiTheme(options);
