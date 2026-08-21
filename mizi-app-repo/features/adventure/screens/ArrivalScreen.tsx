import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image as ExpoImage } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopAppBar } from '@/components/ui/TopAppBar';
import { palette } from '@/constants/theme';
import { destinationImage } from '@/features/adventure/theme';
import type { CaptureMode } from '@/features/adventure/types';

const captureOptions: {
  key: CaptureMode;
  title: string;
  description: string;
  recommended?: boolean;
}[] = [
  {
    key: 'free',
    title: '자유롭게 촬영',
    description: '카메라 화면 그대로 원하는 구도로 촬영해요.',
  },
  {
    key: 'overlay',
    title: '오버레이 촬영',
    description: '원본사진을 촬영 프레임에 겹쳐 보며 맞춰 찍어요.',
    recommended: true,
  },
  {
    key: 'original',
    title: '원본사진 사용',
    description: '새로 찍지 않고 원본사진 그대로 기록해요.',
  },
];

export function ArrivalScreen({
  onBack,
  onSelectMode,
}: {
  onBack: () => void;
  onSelectMode: (mode: CaptureMode) => void;
}) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <TopAppBar
        backgroundColor={palette.bg}
        leftAction={{ accessibilityLabel: '뒤로가기', icon: 'chevron-left', onPress: onBack }}
      />
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.arrivalContent}
        showsVerticalScrollIndicator={false}
      >
        <ArrivalLiveSignal />
        <Text style={styles.arrivalTitle}>도착했습니다</Text>
        <Text style={styles.arrivalCopy}>
          이곳이 바로 목적지예요.{'\n'}기록 방식을 선택해주세요.
        </Text>
        <View style={styles.optionList}>
          {captureOptions.map((option) => (
            <CaptureOption
              key={option.key}
              option={option}
              onPress={() => onSelectMode(option.key)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ArrivalLiveSignal() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { duration: 1500, toValue: 1, useNativeDriver: true }),
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
    outputRange: [0.54, 1.34],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.38, 0],
  });
  const outerPulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.62],
  });
  const outerPulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0],
  });
  const iconScale = pulse.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 1.08, 1],
  });

  return (
    <View style={styles.arrivalLiveStage}>
      <View style={styles.arrivalSignalTrack} />
      <Animated.View
        style={[
          styles.arrivalPulseRingOuter,
          {
            opacity: outerPulseOpacity,
            transform: [{ scale: outerPulseScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.arrivalPulseRing,
          {
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          },
        ]}
      />
      <Animated.View style={[styles.arrivalHeroIcon, { transform: [{ scale: iconScale }] }]}>
        <MaterialIcons color="#FFFFFF" name="place" size={26} />
      </Animated.View>
    </View>
  );
}

function CaptureOption({
  option,
  onPress,
}: {
  option: (typeof captureOptions)[number];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.captureOption, pressed && styles.pressed]}
    >
      <ModePhotoPreview mode={option.key} />
      <View style={styles.optionText}>
        <View style={styles.optionTitleRow}>
          <Text style={styles.optionTitle}>{option.title}</Text>
          {option.recommended ? (
            <View style={styles.recommendBadge}>
              <MaterialIcons color="#FFFFFF" name="check" size={11} />
              <Text style={styles.recommendText}>추천</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </View>
    </Pressable>
  );
}

function ModePhotoPreview({ mode }: { mode: CaptureMode }) {
  return (
    <View style={styles.modePreview}>
      {mode === 'original' ? (
        <View style={styles.originalPhotoBack}>
          <ExpoImage contentFit="cover" source={destinationImage} style={StyleSheet.absoluteFill} />
        </View>
      ) : null}
      <View style={[styles.modePhoto, mode === 'original' && styles.originalPhotoFront]}>
        <ExpoImage contentFit="cover" source={destinationImage} style={StyleSheet.absoluteFill} />
        {mode === 'free' ? (
          <>
            <View style={styles.freeTopFocus} />
            <View style={styles.freeBottomFocus} />
            <View style={styles.freeExposureDot} />
          </>
        ) : null}
        {mode === 'overlay' ? (
          <>
            <View style={styles.overlayTint} />
            <ExpoImage
              contentFit="cover"
              source={destinationImage}
              style={[StyleSheet.absoluteFill, styles.overlayGhostPhoto]}
            />
            <View style={styles.overlayGuideFrame} />
            <View style={styles.overlayVerticalLine} />
            <View style={styles.overlayHorizontalLine} />
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  arrivalContent: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 28,
  },
  arrivalCopy: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 21,
    marginTop: 12,
    textAlign: 'center',
  },
  arrivalHeroIcon: {
    alignItems: 'center',
    backgroundColor: palette.green,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    shadowColor: '#0B4C43',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    width: 48,
  },
  arrivalLiveStage: {
    alignItems: 'center',
    height: 88,
    justifyContent: 'center',
    marginTop: 8,
    width: 132,
  },
  arrivalPulseRing: {
    backgroundColor: palette.green,
    borderRadius: 36,
    height: 72,
    position: 'absolute',
    width: 72,
  },
  arrivalPulseRingOuter: {
    backgroundColor: '#BEE8D5',
    borderRadius: 48,
    height: 96,
    position: 'absolute',
    width: 96,
  },
  arrivalSignalTrack: {
    borderColor: '#E4ECE8',
    borderRadius: 44,
    borderWidth: 1,
    height: 88,
    position: 'absolute',
    width: 88,
  },
  arrivalTitle: {
    color: palette.text,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 18,
  },
  captureOption: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: '#EEF1EF',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 0,
    flexDirection: 'row',
    gap: 15,
    minHeight: 116,
    overflow: 'hidden',
    padding: 12,
    shadowColor: '#15221D',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  freeBottomFocus: {
    borderBottomWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRightWidth: 1.5,
    bottom: 12,
    height: 17,
    opacity: 0.92,
    position: 'absolute',
    right: 12,
    width: 17,
  },
  freeExposureDot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    bottom: 12,
    height: 12,
    left: '50%',
    marginLeft: -6,
    opacity: 0.96,
    position: 'absolute',
    width: 12,
  },
  freeTopFocus: {
    borderColor: '#FFFFFF',
    borderLeftWidth: 1.5,
    borderTopWidth: 1.5,
    height: 17,
    left: 12,
    opacity: 0.92,
    position: 'absolute',
    top: 12,
    width: 17,
  },
  modePhoto: {
    backgroundColor: '#E8F0EB',
    borderRadius: 7,
    flex: 1,
    overflow: 'hidden',
  },
  modePreview: {
    backgroundColor: '#F2F6F4',
    borderRadius: 7,
    height: 92,
    overflow: 'hidden',
    width: 106,
  },
  optionDescription: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 17,
    marginTop: 5,
  },
  optionList: {
    gap: 11,
    marginTop: 24,
    width: '100%',
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 2,
  },
  optionTitle: {
    color: palette.text,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
  },
  optionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  originalPhotoBack: {
    backgroundColor: '#E0E9E5',
    borderColor: '#FFFFFF',
    borderRadius: 7,
    borderWidth: 2,
    height: 66,
    left: 30,
    position: 'absolute',
    top: 15,
    transform: [{ rotate: '4deg' }],
    width: 68,
  },
  originalPhotoFront: {
    borderColor: '#FFFFFF',
    borderRadius: 7,
    borderWidth: 2,
    bottom: 12,
    left: 12,
    position: 'absolute',
    right: 22,
    top: 12,
    transform: [{ rotate: '-3deg' }],
  },
  overlayGhostPhoto: {
    opacity: 0.48,
    transform: [{ translateX: -10 }, { translateY: 5 }, { scale: 0.94 }],
  },
  overlayGuideFrame: {
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 6,
    borderWidth: 1,
    bottom: 13,
    left: 20,
    position: 'absolute',
    right: 20,
    top: 13,
  },
  overlayHorizontalLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    height: 1,
    left: 20,
    position: 'absolute',
    right: 20,
    top: 46,
  },
  overlayTint: {
    backgroundColor: 'rgba(20, 40, 35, 0.2)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  overlayVerticalLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    bottom: 13,
    left: '50%',
    marginLeft: -0.5,
    position: 'absolute',
    top: 13,
    width: 1,
  },
  pressed: {
    opacity: 0.72,
  },
  recommendBadge: {
    alignItems: 'center',
    backgroundColor: palette.green,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  recommendText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
  },
  screen: {
    backgroundColor: palette.bg,
    flex: 1,
  },
});
