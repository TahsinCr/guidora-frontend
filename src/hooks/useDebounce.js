import { useState, useEffect } from 'react';

/**
 * useDebounce hook - delays updating value until delay (ms) has passed without new changes
 * @param {any} value
 * @param {number} delay
 * @returns {any} debouncedValue
 */
export function useDebounce(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

