import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  loading: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
  });

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    watch = false,
  } = options;

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setState({
      position,
      error: null,
      loading: false,
    });
  }, []);

  const updateError = useCallback((error: GeolocationPositionError) => {
    setState({
      position: null,
      error,
      loading: false,
    });
  }, []);

  const getCurrentPosition = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }));
    
    if (!navigator.geolocation) {
      updateError({
        code: 2,
        message: "Geolocation is not supported by this browser.",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      updatePosition,
      updateError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, updatePosition, updateError]);

  useEffect(() => {
    if (!navigator.geolocation) {
      updateError({
        code: 2,
        message: "Geolocation is not supported by this browser.",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
      return;
    }

    let watchId: number | null = null;

    if (watch) {
      watchId = navigator.geolocation.watchPosition(
        updatePosition,
        updateError,
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    } else {
      getCurrentPosition();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watch, enableHighAccuracy, timeout, maximumAge, updatePosition, updateError, getCurrentPosition]);

  return {
    ...state,
    getCurrentPosition,
  };
}
