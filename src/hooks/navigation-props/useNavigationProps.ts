import { useState } from 'react';

/**
 * Holds any temporary props that we want to pass between pages
 */
export function useNavigationProps() {
  const [navigationProps, setNavigationProps] = useState<{
    [x: string]: unknown;
  }>();

  function getProps<T>(propKeys: string[]): T {
    const state = navigationProps || {};
    const navProps: any = {};
    try {
      propKeys.forEach(key => {
        navProps[key] = state[key];
      });
    } catch {
      return {} as T;
    }
    return navProps as T;
  }

  function setProps(props: { [x: string]: unknown }, update = false): void {
    const newProps = update ? { ...navigationProps, ...props } : props;
    setNavigationProps(newProps);
  }

  function clearProps() {
    setNavigationProps({});
  }

  return { getProps, setProps, clearProps };
}
