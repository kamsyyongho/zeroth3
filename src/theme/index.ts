import { createMuiTheme, Theme } from '@material-ui/core/styles';
import { ThemeOptions } from '@material-ui/core/styles/createMuiTheme';
import { PaletteOptions } from '@material-ui/core/styles/createPalette';

const palette: PaletteOptions = {
  primary: { main: '#2f99cb' },
  secondary: { main: '#004261' },
};

/**
 * a custom category that we are including in our theme
 */
const status = {
  selected: 'rgba(47, 153, 203, 0.1)',
};

/**
 * Custom interface that must be used when using custom theme values
 */
export interface CustomTheme extends Theme {
  status: {
    selected: string;
  };
}

interface CustomThemeOptions extends ThemeOptions {
  status?: {
    selected?: string;
  };
}

const options: CustomThemeOptions = {
  palette,
  status,
};

/**
 * main theme for the site
 */
export const theme = createMuiTheme(options);
