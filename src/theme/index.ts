import { grey, pink, red, green } from '@material-ui/core/colors';
import { createMuiTheme, Theme } from '@material-ui/core/styles';
import { ThemeOptions } from '@material-ui/core/styles/createMuiTheme';
import { PaletteOptions } from '@material-ui/core/styles/createPalette';
import { TypographyOptions } from '@material-ui/core/styles/createTypography';
import { Overrides } from '@material-ui/core/styles/overrides';

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
    'Muli',
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
  table: {
    border: '#aec2cb',
    highlight: 'rgba(47, 153, 203, 0.1)',
  },
  header: {
    lightBlue: '#a8d0e3',
  },
  editor: {
    playing: '#077db5',
    highlight: pink.A200,
    LC: '#ffe190',
    focussed: grey[400],
    changes: green[400],
  },
  audioPlayer: {
    waveform: '#2f99cb',
    loop: grey[800],
  },
  error: red.A700,
};

/**
 * Custom interface that must be used when using custom theme values
 */
export interface CustomTheme extends Theme {
  table: {
    border: string;
    highlight: string;
  };
  header: {
    lightBlue: string;
  };
  editor: {
    playing: string;
    highlight: string;
    LC: string;
    focussed: string;
    changes: string;
  };
  audioPlayer: {
    waveform: string;
    loop: string;
  };
  error: string;
}

interface CustomThemeOptions extends ThemeOptions {
  table?: {
    border?: string;
    highlight?: string;
  };
  header?: {
    lightBlue?: string;
  };
  editor?: {
    playing?: string;
    highlight?: string;
    LC?: string;
    focussed?: string;
    changes?: string;
  };
  audioPlayer?: {
    waveform?: string;
    loop?: string;
  };
  error?: string;
}

const overrides: Overrides = {
  MuiListItem: {
    button: {
      '&:hover': {
        backgroundColor: customTheme.table.highlight,
      },
    },
    root: {
      '&$selected': {
        backgroundColor: customTheme.table.highlight,
        '&:hover': {
          backgroundColor: customTheme.table.highlight,
        },
      },
    },
  },
};

const options: CustomThemeOptions = {
  palette,
  typography,
  overrides,
  ...customTheme,
};

/**
 * main theme for the site
 */
export const theme = createMuiTheme(options);
