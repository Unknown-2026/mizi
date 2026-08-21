import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { MiziButton } from '@/components/ui/mizi-button';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      {/* TODO: Route to adventure start/select when there is no active destination. */}
      <MiziButton label="모험 진행하기" onPress={() => router.push('/adventure-progress')} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
});
