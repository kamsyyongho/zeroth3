import { createContext } from "react";
import { noop } from '../../constants';
import { GlobalState } from './useGlobalState';

export interface ParsedGlobalState {
  globalState: GlobalState;
  /**
   * updates the current state values with new new state
   * - does NOT erase previous non-updated values
   */
  setGlobalState: (state: GlobalState) => void;
  /**
   * Deletes values based on their keys
   * @param keys the state keys to delete
   */
  deleteStateValues: (keys: string[]) => void;
}


const defaultContext: ParsedGlobalState = {
  globalState: {},
  setGlobalState: noop,
  deleteStateValues: noop,
};

export const GlobalStateContext = createContext(defaultContext);