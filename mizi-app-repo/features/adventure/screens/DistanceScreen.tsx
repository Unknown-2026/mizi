import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef } from 'react';
import { Alert, Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MiziButton } from '@/components/ui/mizi-button';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { palette } from '@/constants/theme';
import { InfoNotice } from '@/features/adventure/components/InfoNotice';
import { formatDistance, getDistanceMessage } from '@/features/adventure/distanceUtils';
import { arrivalRangeMeters } from '@/features/adventure/hooks/useDestinationTracking';
import { compassSize } from '@/features/adventure/theme';
import type { AdventureLocationStatus } from '@/features/adventure/types';

export function DistanceScreen({
  bearingDegrees,
  distanceMeters,
  errorMessage,
  onBack,
  onRequestLocation,
  status,
}: {
  bearingDegrees: number | null;
  distanceMeters: number | null;
  errorMessage: string | null;
  onBack: () => void;
  onRequestLocation: () => void;
  status: AdventureLocationStatus;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  const needleRotation = useSmoothedNeedleRotation(bearingDegrees);
  const message = getNavigationMessage(status, distanceMeters, errorMessage);
  const needsLocationPermission = status === 'permission-needed';
  const distanceLabel = distanceMeters === null ? '위치 확인중' : formatDistance(distanceMeters);
  const actionLabel = needsLocationPermission ? '위치 권한 허용' : '목적지 정보 보기';
  const handleDestinationDetailPress = () => {
    // TODO: Connect to the destination detail page for the active adventure.
    Alert.alert('목적지 정보 화면으로 이동합니다', '이 화면은 곧 연결될 예정이에요.');
  };

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { duration: 1800, toValue: 1, useNativeDriver: true }),
        Animated.timing(pulse, { duration: 1, toValue: 0, useNativeDriver: true }),
      ]),
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulse]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 4.1],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.42, 0],
  });
  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <TopAppBar
        backgroundColor={palette.bg}
        leftAction={{ accessibilityLabel: '뒤로가기', icon: 'chevron-left', onPress: onBack }}
      />
      <View style={styles.distanceContent}>
        <Text style={styles.caption}>목적지까지</Text>
        <Text style={styles.distanceValue}>{distanceLabel}</Text>
        <Text style={styles.distanceHint}>{message.short}</Text>
      </View>
      <View style={styles.radarWrap}>
        <View style={styles.radar}>
          <Animated.View
            style={[
              styles.radarPulse,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
          <View style={[styles.radarRing, styles.radarRingOuter]} />
          <View style={[styles.radarRing, styles.radarRingMiddle]} />
          <View style={[styles.radarRing, styles.radarRingInner]} />
          <View style={styles.destinationAxis}>
            <View style={styles.destinationSignal}>
              <MaterialIcons color={palette.green} name="place" size={62} />
            </View>
          </View>
          <Animated.View
            style={[styles.radarNeedleAxis, { transform: [{ rotate: needleRotation }] }]}
          >
            <View style={styles.radarNeedle}>
              <MaterialIcons color={palette.green} name="navigation" size={38} />
            </View>
          </Animated.View>
        </View>
      </View>
      <View style={styles.bottomArea}>
        <InfoNotice icon="explore" subtitle={message.detail} title={message.title} />
        <MiziButton
          label={actionLabel}
          onPress={needsLocationPermission ? onRequestLocation : handleDestinationDetailPress}
          rightIcon={needsLocationPermission ? 'my-location' : 'info-outline'}
        />
      </View>
    </SafeAreaView>
  );
}

function useSmoothedNeedleRotation(targetDegrees: number | null) {
  const animatedDegrees = useRef(new Animated.Value(0)).current;
  const renderedDegreesRef = useRef(0);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (targetDegrees === null) {
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      renderedDegreesRef.current = targetDegrees;
      animatedDegrees.setValue(targetDegrees);
      return;
    }

    const diff = getShortestDegreeDifference(renderedDegreesRef.current, targetDegrees);

    if (Math.abs(diff) < 2) {
      return;
    }

    const nextRenderedDegrees = renderedDegreesRef.current + diff;
    renderedDegreesRef.current = nextRenderedDegrees;

    Animated.timing(animatedDegrees, {
      duration: 260,
      toValue: nextRenderedDegrees,
      useNativeDriver: true,
    }).start();
  }, [animatedDegrees, targetDegrees]);

  return animatedDegrees.interpolate({
    inputRange: [-1080, 1080],
    outputRange: ['-1080deg', '1080deg'],
  });
}

function getShortestDegreeDifference(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

function getNavigationMessage(
  status: AdventureLocationStatus,
  distanceMeters: number | null,
  errorMessage: string | null,
) {
  if (status === 'no-destination') {
    return {
      detail: '진행 중인 모험의 목적지가 아직 정해지지 않았어요.',
      short: '목적지가 필요해요.',
      title: '진행 중인 모험이 없어요',
    };
  }

  if (status === 'permission-needed') {
    return {
      detail: '현재 위치를 알아야 목적지 방향과 거리를 계산할 수 있어요.',
      short: '위치 권한을 허용해주세요.',
      title: '위치 권한이 필요해요',
    };
  }

  if (status === 'error') {
    return {
      detail: errorMessage ?? '위치 정보를 불러오지 못했어요.',
      short: '위치를 다시 확인해주세요.',
      title: '위치 확인이 필요해요',
    };
  }

  if (status === 'checking' || status === 'locating' || distanceMeters === null) {
    return {
      detail: `목적지까지의 거리와 방향을 계산하고 있어요.`,
      short: '현재 위치를 찾고 있어요.',
      title: '목적지 신호를 맞추는 중',
    };
  }

  return getDistanceMessage(distanceMeters, arrivalRangeMeters);
}

const styles = StyleSheet.create({
  bottomArea: {
    gap: 18,
    marginTop: 'auto',
    paddingBottom: 24,
    paddingHorizontal: 28,
    width: '100%',
  },
  caption: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0,
  },
  distanceContent: {
    alignItems: 'center',
    marginTop: 18,
  },
  distanceHint: {
    color: '#7B8381',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
    marginTop: 14,
  },
  distanceValue: {
    color: palette.green,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 10,
  },
  destinationAxis: {
    alignItems: 'center',
    height: compassSize,
    justifyContent: 'flex-start',
    position: 'absolute',
    width: compassSize,
  },
  destinationSignal: {
    alignItems: 'center',
    height: 68,
    justifyContent: 'center',
    position: 'absolute',
    top: -42,
    width: 68,
  },
  radar: {
    alignItems: 'center',
    backgroundColor: '#F8FBF9',
    borderColor: '#E3E8E6',
    borderRadius: compassSize / 2,
    borderWidth: 1,
    height: compassSize,
    justifyContent: 'center',
    overflow: 'visible',
    width: compassSize,
  },
  radarNeedle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E6EFEB',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 1,
    height: 48,
    justifyContent: 'center',
    shadowColor: '#0B4C43',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    width: 48,
  },
  radarNeedleAxis: {
    alignItems: 'center',
    height: compassSize,
    justifyContent: 'center',
    position: 'absolute',
    width: compassSize,
  },
  radarPulse: {
    backgroundColor: '#84D2AE',
    borderRadius: (compassSize * 0.18) / 2,
    height: compassSize * 0.18,
    position: 'absolute',
    width: compassSize * 0.18,
  },
  radarRing: {
    borderColor: 'rgba(47, 155, 111, 0.24)',
    borderRadius: compassSize / 2,
    borderWidth: 1,
    position: 'absolute',
  },
  radarRingInner: {
    height: compassSize * 0.28,
    width: compassSize * 0.28,
  },
  radarRingMiddle: {
    height: compassSize * 0.54,
    width: compassSize * 0.54,
  },
  radarRingOuter: {
    height: compassSize * 0.82,
    width: compassSize * 0.82,
  },
  radarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 78,
  },
  screen: {
    backgroundColor: palette.bg,
    flex: 1,
  },
});
