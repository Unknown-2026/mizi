import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image as RNImage } from 'react-native';

import { useAdventureTracking } from '@/features/adventure/providers/AdventureTrackingProvider';
import { ArrivalScreen } from '@/features/adventure/screens/ArrivalScreen';
import { CameraScreen } from '@/features/adventure/screens/CameraScreen';
import { DistanceScreen } from '@/features/adventure/screens/DistanceScreen';
import { LoadingScreen } from '@/features/adventure/screens/LoadingScreen';
import type { CaptureMode, CapturedPhoto, FlowStep } from '@/features/adventure/types';

const demoOriginalPhotoUri = RNImage.resolveAssetSource(
  // TODO: Replace with the original destination photo URL from the active adventure.
  require('@/assets/images/adventure/landscape.jpg'),
).uri;

export function AdventureProgressContainer() {
  const router = useRouter();
  const navigation = useAdventureTracking();
  const { setAdventureScreenActive } = navigation;
  const [step, setStep] = useState<FlowStep>(() =>
    navigation.isWithinArrivalRange ? 'arrival' : 'distance',
  );
  const [mode, setMode] = useState<CaptureMode | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);

  useEffect(() => {
    setAdventureScreenActive(true);

    return () => {
      setAdventureScreenActive(false);
    };
  }, [setAdventureScreenActive]);

  useEffect(() => {
    if (step === 'distance' && navigation.isWithinArrivalRange) {
      setStep('arrival');
      return;
    }

    if (step === 'arrival' && !navigation.isWithinArrivalRange) {
      setMode(null);
      setCapturedPhoto(null);
      setStep('distance');
    }
  }, [navigation.isWithinArrivalRange, step]);

  const handleExitFlow = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/explore' as Href);
  }, [router]);

  if (step === 'arrival') {
    return (
      <ArrivalScreen
        onBack={handleExitFlow}
        onSelectMode={(nextMode) => {
          setMode(nextMode);
          if (nextMode === 'original') {
            setStep('loading');
            return;
          }
          setCapturedPhoto(null);
          setStep('camera');
        }}
      />
    );
  }

  if (step === 'camera') {
    return (
      <CameraScreen
        capturedPhoto={capturedPhoto}
        mode={mode ?? 'free'}
        onBackToModes={() => {
          setCapturedPhoto(null);
          setStep(navigation.isWithinArrivalRange ? 'arrival' : 'distance');
        }}
        onCapture={setCapturedPhoto}
        onRetake={() => setCapturedPhoto(null)}
        // TODO: Submit the selected/captured proof photo, then route to the result screen.
        onSubmit={() => setStep('loading')}
        originalPhotoUri={demoOriginalPhotoUri}
      />
    );
  }

  if (step === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <DistanceScreen
      bearingDegrees={navigation.bearingDegrees}
      distanceMeters={navigation.distanceMeters}
      errorMessage={navigation.errorMessage}
      onBack={handleExitFlow}
      onRequestLocation={() => {
        void navigation.requestPermission();
      }}
      status={navigation.status}
    />
  );
}
