import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  useDestinationTracking,
  type DestinationTrackingMode,
  type DestinationTrackingSnapshot,
} from '@/features/adventure/hooks/useDestinationTracking';
import type { AdventureDestination } from '@/features/adventure/types';

const demoDestination: AdventureDestination = {
  coordinates: {
    latitude: 37.2681642,
    longitude: 126.9948671,
  },
  name: '현재 테스트 위치',
};

type AdventureTrackingContextValue = DestinationTrackingSnapshot & {
  destinationName: string | null;
  hasActiveDestination: boolean;
  setAdventureScreenActive: (active: boolean) => void;
  setDestination: (destination: AdventureDestination | null) => void;
};

const AdventureTrackingContext = createContext<AdventureTrackingContextValue | null>(null);

export function AdventureTrackingProvider({ children }: { children: ReactNode }) {
  // TODO: Replace demo destination with the active adventure destination from backend state.
  const [destination, setDestination] = useState<AdventureDestination | null>(demoDestination);
  const [requestedTrackingMode, setRequestedTrackingMode] =
    useState<DestinationTrackingMode>('background');
  const tracking = useDestinationTracking(destination?.coordinates ?? null, requestedTrackingMode);
  const setAdventureScreenActive = useCallback((active: boolean) => {
    setRequestedTrackingMode(active ? 'active' : 'background');
  }, []);
  const value = useMemo(
    () => ({
      ...tracking,
      destinationName: destination?.name ?? null,
      hasActiveDestination: destination !== null,
      setAdventureScreenActive,
      setDestination,
    }),
    [destination, setAdventureScreenActive, tracking],
  );

  return (
    <AdventureTrackingContext.Provider value={value}>{children}</AdventureTrackingContext.Provider>
  );
}

export function useAdventureTracking() {
  const context = useContext(AdventureTrackingContext);

  if (!context) {
    throw new Error('useAdventureTracking must be used within AdventureTrackingProvider');
  }

  return context;
}
