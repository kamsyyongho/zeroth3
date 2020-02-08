import { useEffect, useState } from 'react';
import { Organization, Project } from '../../types';
import { LOCAL_STORAGE_KEYS } from '../../types/misc.types';

export interface GlobalState {
  organizations?: Organization[];
  currentOrganization?: Organization;
  currentProject?: Project;
  uploadQueueEmpty?: boolean;
}

/**
 * Holds the global state that is used throughout the site
 */
export function useGlobalState() {
  const [state, setState] = useState<GlobalState>({});
  const { currentProject, currentOrganization } = state;

  /**
   * updates the current state values with new new state
   * - does NOT erase previous non-updated values
   */
  function setGlobalState(newState: GlobalState) {
    const updatedState = { ...state, ...newState };
    setState(updatedState);
  }

  /**
   * Deletes values based on their keys
   * @param keys the state keys to delete
   */
  function deleteStateValues(keys: string[]) {
    const newState = { ...state };
    keys.forEach(key => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      //@ts-ignore
      delete newState[key];
    });
    setState(newState);
  }

  useEffect(() => {
    if (currentProject?.id) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_ID, currentProject.id);
    }
  }, [currentProject]);

  useEffect(() => {
    if (currentOrganization?.id) {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.ORGANIZATION_ID,
        currentOrganization.id
      );
    }
  }, [currentOrganization]);

  return { globalState: state, setGlobalState, deleteStateValues };
}
