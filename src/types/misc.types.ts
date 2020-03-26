/** used to set/get items to/from localState */
export enum LOCAL_STORAGE_KEYS {
  'ORGANIZATION_ID' = 'ORGANIZATION_ID',
  'PROJECT_ID' = 'PROJECT_ID',
  'TDP_TABLE_ROWS_PER_PAGE' = 'TDP_TABLE_ROWS_PER_PAGE',
  'TRANSCRIBER_TABLE_ROWS_PER_PAGE' = 'TRANSCRIBER_TABLE_ROWS_PER_PAGE',
  'WORD_CONFIDENCE_THRESHOLD' = 'WORD_CONFIDENCE_THRESHOLD',
}

export interface StringById {
  [id: string]: string;
}

export interface BooleanById {
  [id: string]: boolean;
}

export interface BooleanByIndex {
  [index: number]: boolean;
}

export interface GenericById<T> {
  [id: string]: T;
}

export interface GenericByIndex<T> {
  [id: string]: T;
}

export enum HUES {
  'red' = 'red',
  'orange' = 'orange',
  'purple' = 'purple',
  'pink' = 'pink',
  'green' = 'green',
  'yellow' = 'yellow',
  'blue' = 'blue',
  'monochrome' = 'monochrome',
}

export const HUE_VALUES: string[] = Object.keys(HUES);

export const DEFAULT_HUES = [HUES.red, HUES.orange, HUES.purple];
export interface RandomColorOptions {
  hue?: number | string;
  luminosity?: 'bright' | 'light' | 'dark' | 'random';
  seed?: number | string;
  format?:
    | 'hsvArray'
    | 'hslArray'
    | 'hsl'
    | 'hsla'
    | 'rgbArray'
    | 'rgb'
    | 'rgba'
    | 'hex';
  alpha?: number;
}
