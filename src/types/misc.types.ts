/** used to set/get items to/from localState */
export enum LOCAL_STORAGE_KEYS {
  'ORGANIZATION_ID' = 'ORGANIZATION_ID',
  'PROJECT_ID' = 'PROJECT_ID',
}

export interface BooleanById {
  [id: string]: boolean;
}

export interface BooleanByIndex {
  [index: number]: boolean;
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

export const HUE_VALUES: string[] = Object.keys(HUES).map(hue => hue);

export const DEFAULT_HUES = [HUES.red, HUES.orange, HUES.purple];
