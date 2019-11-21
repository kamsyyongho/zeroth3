import { createContext } from "react";
import { noop } from '../../constants';

export interface ParsedNavigationProps {
  /**
   * gets the props stored from another page
   */
  getProps: <T>(propKeys: string[]) => T;
  /**
   * sets the props to be used in another page
   * @param update will merge the current state with the incoming props
   */
  setProps: (props: { [x: string]: unknown; }, update?: boolean) => void;
  /**
   * removes any stored props
   */
  clearProps: () => void;
}


const defaultContext: ParsedNavigationProps = {
  getProps: noop,
  setProps: noop,
  clearProps: noop,
};

export const NavigationPropsContext = createContext(defaultContext);