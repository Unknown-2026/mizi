import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { authColors, type OnboardingStep } from '@/constants/auth';
import { AppFonts } from '@/constants/theme';

type OnboardingPanelProps = {
  step: OnboardingStep;
  stepIndex: number;
  totalSteps: number;
  isLastStep: boolean;
  onNext: () => void;
  onSkip: () => void;
};

export function OnboardingPanel({
  step,
  stepIndex,
  totalSteps,
  isLastStep,
  onNext,
  onSkip,
}: OnboardingPanelProps) {
  const transitionProgress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    transitionProgress.setValue(0);
    Animated.timing(transitionProgress, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [step.id, transitionProgress]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressDots}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[styles.progressDot, index === stepIndex && styles.progressDotActive]}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={onSkip}
          style={styles.skipButton}
        >
          <Text style={styles.skipLabel}>SKIP</Text>
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.imagePanel,
          {
            opacity: transitionProgress,
            transform: [
              {
                translateY: transitionProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
              {
                scale: transitionProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.98, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Image contentFit="contain" source={step.image} style={styles.image} />
      </Animated.View>

      <Animated.View
        style={[
          styles.copy,
          {
            opacity: transitionProgress,
            transform: [
              {
                translateY: transitionProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.title}>
          {step.title.map((part, index) => (
            <Text key={`${part.text}-${index}`} style={part.color ? { color: part.color } : null}>
              {part.text}
            </Text>
          ))}
        </Text>
        <Text style={styles.description}>{step.description}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <AuthButton label={isLastStep ? '시작하기' : '다음'} onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 34,
  },
  progressDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  progressDot: {
    backgroundColor: '#D8E7DF',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  progressDotActive: {
    backgroundColor: authColors.brand,
    width: 22,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  skipLabel: {
    color: authColors.muted,
    fontFamily: AppFonts.bold,
    fontSize: 15,
  },
  imagePanel: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 330,
  },
  copy: {
    marginTop: 30,
    paddingHorizontal: 10,
  },
  title: {
    color: authColors.text,
    fontFamily: AppFonts.bold,
    fontSize: 24,
    lineHeight: 33,
  },
  description: {
    color: authColors.text,
    fontFamily: AppFonts.medium,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 18,
  },
  image: {
    aspectRatio: 4 / 3,
    width: '112%',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
});
