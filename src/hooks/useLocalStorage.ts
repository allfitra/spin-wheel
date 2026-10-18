import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Storage version prefix to ensure schema evolution safety.
 */
export const STORAGE_PREFIX = 'spinwheel:v3';

/**
 * Type-safe localStorage hook with:
 * - Versioned storage keys
 * - Try/catch error resilience (quota exceeded, disabled storage, incognito)
 * - Cross-tab synchronization via `window.addEventListener('storage')`
 * - Functional state updates support
 */
export function useLocalStorage<T>(
  keySuffix: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const fullKey = `${STORAGE_PREFIX}:${keySuffix}`;
  const [hasError, setHasError] = useState(false);

  // Read initial value from localStorage or fallback
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(fullKey);
      if (item !== null) {
        return JSON.parse(item) as T;
      }
    } catch (error) {
      console.warn(`[useLocalStorage] Gagal membaca key "${fullKey}":`, error);
      setHasError(true);
    }
    return initialValue;
  }, [fullKey, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);
  const storedValueRef = useRef<T>(storedValue);
  storedValueRef.current = storedValue;

  // Setter function that writes to localStorage and updates state
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (typeof window === 'undefined') return;

      try {
        const nextValue =
          typeof value === 'function'
            ? (value as (val: T) => T)(storedValueRef.current)
            : value;

        setStoredValue(nextValue);
        setHasError(false);

        try {
          window.localStorage.setItem(fullKey, JSON.stringify(nextValue));
        } catch (storageError) {
          console.warn(`[useLocalStorage] Gagal menulis key "${fullKey}" (penuh atau diblokir):`, storageError);
          setHasError(true);
        }
      } catch (error) {
        console.warn(`[useLocalStorage] Gagal memproses nilai untuk "${fullKey}":`, error);
        setHasError(true);
      }
    },
    [fullKey]
  );

  // Sync across browser tabs
  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === fullKey && event.newValue !== null) {
        try {
          const parsed = JSON.parse(event.newValue) as T;
          setStoredValue(parsed);
          setHasError(false);
        } catch (e) {
          console.warn(`[useLocalStorage] Gagal parsing storage event untuk "${fullKey}":`, e);
        }
      } else if (event.key === fullKey && event.newValue === null) {
        // Key was removed
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [fullKey, initialValue]);

  return [storedValue, setValue, hasError];
}
