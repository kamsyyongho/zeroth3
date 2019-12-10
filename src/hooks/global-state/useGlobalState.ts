import { useState } from 'react';
import { Organization } from '../../types';

export interface GlobalState {
  organization?: Organization;
}

/**
 * Holds the global state that is used throughout the site
 */
export function useGlobalState() {
  const [state, setState] = useState<GlobalState>({});

  /**
   * updates the current state values with new new state
   * - does NOT erase previous non-updated values
   */
  function setGlobalState(newState: GlobalState) {
    setState(prevState => ({ ...prevState, ...newState }));
  }

  return { globalState: state, setGlobalState };
}
