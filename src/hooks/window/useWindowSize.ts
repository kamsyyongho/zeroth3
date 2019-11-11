import { useCallback, useEffect, useState } from 'react';

interface WindowSize {
  height?: number;
  width?: number;
}

/**
 * Dynamically gets the current window dimensions
 * @returns `{ height, width }`
 */
export function useWindowSize() {
  const isClient = typeof window === 'object';

  const getWindowSize = useCallback(() => {
    return {
      width: isClient ? window.innerWidth : undefined,
      height: isClient ? window.innerHeight : undefined,
    };
  }, [isClient]);

  const [windowSize, setWindowSize] = useState<WindowSize>(getWindowSize);

  useEffect(() => {
    function handleResize() {
      setWindowSize(getWindowSize());
    }
    if (isClient) {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [getWindowSize, isClient]);

  return windowSize;
}
