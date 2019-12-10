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
}


const defaultContext: ParsedGlobalState = {
  globalState: {},
  setGlobalState: noop,
};

export const GlobalStateContext = createContext(defaultContext);