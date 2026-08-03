import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingPanel } from '@/components/auth/onboarding-panel';
import { authColors, onboardingSteps } from '@/constants/auth';

export default function OnboardingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = onboardingSteps[stepIndex];
  const isLastStep = stepIndex === onboardingSteps.length - 1;

  const moveToLogin = () => router.replace('/login');

  const handleNext = () => {
    if (isLastStep) {
      moveToLogin();
      return;
    }

    setStepIndex((previousIndex) => previousIndex + 1);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <OnboardingPanel
        isLastStep={isLastStep}
        onNext={handleNext}
        onSkip={moveToLogin}
        step={currentStep}
        stepIndex={stepIndex}
        totalSteps={onboardingSteps.length}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: authColors.background,
    flex: 1,
  },
});
