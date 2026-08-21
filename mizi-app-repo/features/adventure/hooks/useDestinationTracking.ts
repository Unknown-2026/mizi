import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AdventureLocationStatus, Coordinates } from '@/features/adventure/types';

export const arrivalRangeMeters = 30;
const departureRangeMeters = 70;

export type DestinationTrackingMode = 'active' | 'background';
type EffectiveDestinationTrackingMode = DestinationTrackingMode | 'arrived';

export type DestinationTrackingSnapshot = {
  accuracyMeters: number | null;
  bearingDegrees: number | null;
  currentCoordinates: Coordinates | null;
  destination: Coordinates | null;
  distanceMeters: number | null;
  errorMessage: string | null;
  isWithinArrivalRange: boolean;
  requestPermission: () => Promise<Location.PermissionResponse>;
  status: AdventureLocationStatus;
  trackingMode: EffectiveDestinationTrackingMode;
};

const maximumTrustedAccuracyMeters = 50;
const arrivalStableSampleCount = 2;
const departureStableSampleCount = 12;

export function useDestinationTracking(
  destination: Coordinates | null,
  requestedTrackingMode: DestinationTrackingMode = 'background',
): DestinationTrackingSnapshot {
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const smoothedHeadingRef = useRef<number | null>(null);
  const currentCoordinatesRef = useRef<Coordinates | null>(null);
  const rawCoordinatesRef = useRef<Coordinates | null>(null);
  const arrivalInsideCountRef = useRef(0);
  const departureOutsideCountRef = useRef(0);
  const isWithinArrivalRangeRef = useRef(false);
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(null);
  const [deviceHeadingDegrees, setDeviceHeadingDegrees] = useState<number | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [isWithinArrivalRange, setIsWithinArrivalRange] = useState(false);
  const [status, setStatus] = useState<AdventureLocationStatus>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const effectiveTrackingMode = isWithinArrivalRange ? 'arrived' : requestedTrackingMode;
  const trackingOptions = useMemo(
    () => getLocationTrackingOptions(effectiveTrackingMode),
    [effectiveTrackingMode],
  );

  const setLocationSnapshot = useCallback(
    (location: Location.LocationObject) => {
      if (!destination) {
        return;
      }

      const nextCoordinates = toCoordinates(location.coords);
      const previousCoordinates = currentCoordinatesRef.current;
      const nextRawCoordinates = getTrustedRawCoordinates(
        rawCoordinatesRef.current,
        nextCoordinates,
        location.coords.accuracy,
      );
      const coordinates = getStableCoordinates(
        currentCoordinatesRef.current,
        nextCoordinates,
        location.coords.accuracy,
      );

      currentCoordinatesRef.current = coordinates;
      setAccuracyMeters(location.coords.accuracy);

      if (nextRawCoordinates) {
        rawCoordinatesRef.current = nextRawCoordinates;
      }

      if (!areSameCoordinates(previousCoordinates, coordinates)) {
        setCurrentCoordinates(coordinates);
      }

      const arrivalCoordinates = nextRawCoordinates ?? coordinates;
      const isInsideArrivalRange = isArrivedAtDestination(
        arrivalCoordinates,
        destination,
        location.coords.accuracy,
      );
      const isOutsideDepartureRange = isDepartedFromDestination(
        arrivalCoordinates,
        destination,
        location.coords.accuracy,
      );

      if (isInsideArrivalRange) {
        arrivalInsideCountRef.current += 1;
        departureOutsideCountRef.current = 0;
      } else if (isOutsideDepartureRange) {
        arrivalInsideCountRef.current = 0;
        departureOutsideCountRef.current += 1;
      } else {
        arrivalInsideCountRef.current = 0;
        departureOutsideCountRef.current = 0;
      }

      if (
        !isWithinArrivalRangeRef.current &&
        arrivalInsideCountRef.current >= arrivalStableSampleCount
      ) {
        isWithinArrivalRangeRef.current = true;
        setIsWithinArrivalRange(true);
        return;
      }

      if (
        isWithinArrivalRangeRef.current &&
        departureOutsideCountRef.current >= departureStableSampleCount
      ) {
        isWithinArrivalRangeRef.current = false;
        setIsWithinArrivalRange(false);
      }
    },
    [destination],
  );

  useEffect(() => {
    // TODO: Keep this idle path when backend data can return no active destination.
    if (!destination) {
      currentCoordinatesRef.current = null;
      rawCoordinatesRef.current = null;
      arrivalInsideCountRef.current = 0;
      departureOutsideCountRef.current = 0;
      isWithinArrivalRangeRef.current = false;
      setCurrentCoordinates(null);
      setDeviceHeadingDegrees(null);
      setAccuracyMeters(null);
      setIsWithinArrivalRange(false);
      setErrorMessage(null);
      setStatus('no-destination');
      return undefined;
    }

    if (!permission) {
      setStatus('checking');
      return undefined;
    }

    if (!permission.granted) {
      setStatus('permission-needed');
      return undefined;
    }

    let mounted = true;
    let positionSubscription: Location.LocationSubscription | null = null;
    let headingSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      setStatus('locating');
      setErrorMessage(null);

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: trackingOptions.accuracy,
        });
        if (mounted) {
          setLocationSnapshot(current);
          setStatus('ready');
        }

        positionSubscription = await Location.watchPositionAsync(
          {
            accuracy: trackingOptions.accuracy,
            distanceInterval: trackingOptions.distanceInterval,
            timeInterval: trackingOptions.timeInterval,
          },
          (location) => {
            setLocationSnapshot(location);
            setStatus('ready');
          },
          () => {
            setErrorMessage('현재 위치를 업데이트하지 못했어요.');
            setStatus('error');
          },
        );

        if (effectiveTrackingMode === 'active') {
          headingSubscription = await Location.watchHeadingAsync(
            (heading) => {
              const nextHeading =
                heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
              const nextSmoothedHeading = smoothHeadingDegrees(
                smoothedHeadingRef.current,
                nextHeading,
              );

              if (nextSmoothedHeading === null) {
                return;
              }

              smoothedHeadingRef.current = nextSmoothedHeading;
              setDeviceHeadingDegrees(nextSmoothedHeading);
            },
            () => {
              setDeviceHeadingDegrees(null);
            },
          );
        } else {
          smoothedHeadingRef.current = null;
          setDeviceHeadingDegrees(null);
        }
      } catch {
        if (mounted) {
          setErrorMessage('현재 위치를 확인하지 못했어요. 위치 권한과 GPS 설정을 확인해주세요.');
          setStatus('error');
        }
      }
    };

    void startLocationTracking();

    return () => {
      mounted = false;
      positionSubscription?.remove();
      headingSubscription?.remove();
    };
  }, [destination, effectiveTrackingMode, permission, setLocationSnapshot, trackingOptions]);

  return useMemo(() => {
    if (!destination || !currentCoordinates) {
      return {
        accuracyMeters,
        bearingDegrees: null,
        currentCoordinates,
        destination,
        distanceMeters: null,
        errorMessage,
        isWithinArrivalRange: false,
        requestPermission,
        status,
        trackingMode: effectiveTrackingMode,
      };
    }

    const distanceMeters = getDistanceMeters(currentCoordinates, destination);
    const destinationBearingDegrees = getBearingDegrees(currentCoordinates, destination);
    const compassBearingDegrees =
      deviceHeadingDegrees === null
        ? destinationBearingDegrees
        : normalizeDegrees(destinationBearingDegrees - deviceHeadingDegrees);

    return {
      accuracyMeters,
      bearingDegrees: compassBearingDegrees,
      currentCoordinates,
      destination,
      distanceMeters,
      errorMessage,
      isWithinArrivalRange,
      requestPermission,
      status,
      trackingMode: effectiveTrackingMode,
    };
  }, [
    accuracyMeters,
    currentCoordinates,
    deviceHeadingDegrees,
    destination,
    errorMessage,
    isWithinArrivalRange,
    requestPermission,
    status,
    effectiveTrackingMode,
  ]);
}

function getLocationTrackingOptions(mode: EffectiveDestinationTrackingMode) {
  if (mode === 'active') {
    return {
      accuracy: Location.LocationAccuracy.BestForNavigation,
      distanceInterval: 2,
      timeInterval: 750,
    };
  }

  if (mode === 'arrived') {
    return {
      accuracy: Location.LocationAccuracy.High,
      distanceInterval: 8,
      timeInterval: 3000,
    };
  }

  return {
    accuracy: Location.LocationAccuracy.Balanced,
    distanceInterval: 10,
    timeInterval: 5000,
  };
}

function smoothHeadingDegrees(previous: number | null, next: number) {
  if (!Number.isFinite(next) || next < 0) {
    return null;
  }

  const normalizedNext = normalizeDegrees(next);

  if (previous === null) {
    return normalizedNext;
  }

  const diff = getShortestDegreeDifference(previous, normalizedNext);

  if (Math.abs(diff) < 4) {
    return previous;
  }

  return normalizeDegrees(previous + diff * 0.24);
}

function getShortestDegreeDifference(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

function isArrivedAtDestination(
  current: Coordinates,
  destination: Coordinates,
  accuracyMeters: number | null,
) {
  if (isLowTrustLocation(accuracyMeters)) {
    return false;
  }

  const effectiveArrivalRangeMeters = Math.max(
    arrivalRangeMeters,
    Math.min(accuracyMeters ?? arrivalRangeMeters, maximumTrustedAccuracyMeters),
  );

  return getDistanceMetersPrecise(current, destination) <= effectiveArrivalRangeMeters;
}

function isDepartedFromDestination(
  current: Coordinates,
  destination: Coordinates,
  accuracyMeters: number | null,
) {
  if (isLowTrustLocation(accuracyMeters)) {
    return false;
  }

  return getDistanceMetersPrecise(current, destination) >= departureRangeMeters;
}

function getStableCoordinates(
  previous: Coordinates | null,
  next: Coordinates,
  accuracyMeters: number | null,
) {
  if (!previous) {
    return next;
  }

  if (isLowTrustLocation(accuracyMeters)) {
    return previous;
  }

  const movementMeters = getDistanceMetersPrecise(previous, next);
  const noiseFloorMeters = Math.min(Math.max((accuracyMeters ?? 5) * 0.12, 0.6), 2);

  if (movementMeters < noiseFloorMeters) {
    return previous;
  }

  if (movementMeters < 6) {
    return interpolateCoordinates(previous, next, 0.72);
  }

  return next;
}

function getTrustedRawCoordinates(
  previous: Coordinates | null,
  next: Coordinates,
  accuracyMeters: number | null,
) {
  if (!previous) {
    return next;
  }

  if (isLowTrustLocation(accuracyMeters)) {
    return previous;
  }

  return next;
}

function isLowTrustLocation(accuracyMeters: number | null) {
  return accuracyMeters !== null && accuracyMeters > maximumTrustedAccuracyMeters;
}

function areSameCoordinates(first: Coordinates | null, second: Coordinates | null) {
  if (!first || !second) {
    return first === second;
  }

  return first.latitude === second.latitude && first.longitude === second.longitude;
}

function interpolateCoordinates(from: Coordinates, to: Coordinates, ratio: number) {
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * ratio,
    longitude: from.longitude + (to.longitude - from.longitude) * ratio,
  };
}

function toCoordinates(coords: Location.LocationObjectCoords): Coordinates {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

function getDistanceMeters(from: Coordinates, to: Coordinates) {
  return Math.round(getDistanceMetersPrecise(from, to));
}

function getDistanceMetersPrecise(from: Coordinates, to: Coordinates) {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const halfChordLength =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const angularDistance =
    2 * Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength));

  return earthRadiusMeters * angularDistance;
}

function getBearingDegrees(from: Coordinates, to: Coordinates) {
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);

  const y = Math.sin(longitudeDelta) * Math.cos(toLatitude);
  const x =
    Math.cos(fromLatitude) * Math.sin(toLatitude) -
    Math.sin(fromLatitude) * Math.cos(toLatitude) * Math.cos(longitudeDelta);

  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
}

function normalizeDegrees(degrees: number) {
  return (degrees + 360) % 360;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}
