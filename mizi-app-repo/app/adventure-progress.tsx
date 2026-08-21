import { Stack } from 'expo-router';

import { AdventureProgressContainer } from '@/features/adventure/AdventureProgressContainer';

export default function AdventureProgressScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AdventureProgressContainer />
    </>
  );
}
