import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for automatic data refresh
 * @param {Function} fetchFunction - Function to call for data refresh
 * @param {number} intervalMs - Refresh interval in milliseconds (default: 10000 = 10 seconds)
 * @param {boolean} enabled - Whether auto-refresh is enabled (default: true)
 * @param {Array} dependencies - Dependencies to watch for changes
 * @returns {Object} - Object with refresh controls
 */
export const useAutoRefresh = (
  fetchFunction, 
  intervalMs = 10000, // 10 seconds default
  enabled = true,
  dependencies = []
) => {
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (isMountedRef.current && fetchFunction) {
      try {
        await fetchFunction();
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    }
  }, [fetchFunction]);

  // Start auto-refresh
  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (enabled && fetchFunction) {
      intervalRef.current = setInterval(refresh, intervalMs);
    }
  }, [enabled, fetchFunction, intervalMs, refresh]);

  // Stop auto-refresh
  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Effect to handle auto-refresh lifecycle
  useEffect(() => {
    if (enabled && fetchFunction) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [enabled, fetchFunction, startAutoRefresh, stopAutoRefresh, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopAutoRefresh();
    };
  }, [stopAutoRefresh]);

  return {
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    isEnabled: enabled && !!intervalRef.current
  };
};

export default useAutoRefresh; 