import { VideoView, useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo';
import { useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const loadingVideo = require('@/assets/images/loading.mov');
const loadingBackgroundColor = '#F7F7F7';

export function LoadingScreen() {
  // TODO: Drive this screen from the proof submission status and leave when the result is ready.
  const player = useVideoPlayer(loadingVideo, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  useEffect(() => {
    player.loop = true;
    player.muted = true;
    player.play();

    return () => {
      player.pause();
    };
  }, [player]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        player.play();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') {
      player.play();
    }
  });

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.videoStage}>
          <VideoView
            allowsVideoFrameAnalysis={false}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            contentFit="cover"
            nativeControls={false}
            player={player}
            style={styles.loadingVideo}
            useExoShutter={false}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  loadingVideo: {
    height: '100%',
    width: '100%',
  },
  screen: {
    backgroundColor: loadingBackgroundColor,
    flex: 1,
  },
  videoStage: {
    alignItems: 'center',
    backgroundColor: loadingBackgroundColor,
    height: 120,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 210,
  },
});
