import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Linking,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { authColors, authImages, loginCopy } from '@/constants/auth';
import { AppFonts } from '@/constants/theme';

const loginColors = {
  background: '#F6F7F9',
  ink: '#171A1C',
  muted: '#6B747B',
  accent: '#246C73',
  white: '#FFFFFF',
};

export default function LoginScreen() {
  const { height } = useWindowDimensions();
  const copyProgress = useRef(new Animated.Value(0)).current;
  const imageProgress = useRef(new Animated.Value(0)).current;
  const footerProgress = useRef(new Animated.Value(0)).current;
  const floatProgress = useRef(new Animated.Value(0)).current;
  const isCompact = height < 720;

  useEffect(() => {
    const animationConfig = {
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    };

    Animated.stagger(130, [
      Animated.timing(copyProgress, {
        ...animationConfig,
        toValue: 1,
      }),
      Animated.timing(imageProgress, {
        ...animationConfig,
        toValue: 1,
      }),
      Animated.timing(footerProgress, {
        ...animationConfig,
        toValue: 1,
      }),
    ]).start();

    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatProgress, {
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(floatProgress, {
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    floatingAnimation.start();

    return () => {
      floatingAnimation.stop();
    };
  }, [copyProgress, footerProgress, floatProgress, imageProgress]);

  const handleKakaoLogin = () => {
    Haptics.selectionAsync().catch(() => undefined);
    Alert.alert('카카오 로그인', '백엔드 OAuth 연동 후 카카오 로그인을 연결할 예정입니다.');
  };

  const openTerms = () => {
    Linking.openURL('https://www.kakao.com/policy/terms');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://www.kakao.com/policy/privacy');
  };

  return (
    <SafeAreaView style={[styles.screen, isCompact && styles.screenCompact]}>
      <StatusBar style="dark" />

      <Animated.View
        style={[
          styles.brand,
          {
            opacity: copyProgress,
            transform: [
              {
                translateY: copyProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.logoPill}>
          <Image
            contentFit="contain"
            source={require('@/assets/images/auth/mizi-logo-white.png')}
            style={styles.logo}
          />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.imageFrame,
          isCompact && styles.imageFrameCompact,
          {
            opacity: imageProgress,
            transform: [
              {
                translateY: imageProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
              {
                scale: imageProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.imageCard,
            {
              transform: [
                {
                  translateY: floatProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            contentFit="contain"
            source={authImages.loginHeroCard}
            style={[styles.image, isCompact && styles.imageCompact]}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          styles.copy,
          isCompact && styles.copyCompact,
          {
            opacity: footerProgress,
            transform: [
              {
                translateY: footerProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.headline}>
          {loginCopy.headline.prefix}
          <Text style={styles.highlight}>{loginCopy.headline.highlight}</Text>
          {loginCopy.headline.suffix}
        </Text>
        <Text style={styles.description}>{loginCopy.description}</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.footer,
          isCompact && styles.footerCompact,
          {
            opacity: footerProgress,
            transform: [
              {
                translateY: footerProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <AuthButton label={loginCopy.kakaoButton} onPress={handleKakaoLogin} variant="kakao" />
        <Text style={styles.terms}>
          계속하면{' '}
          <Text accessibilityRole="link" onPress={openTerms} style={styles.termsLink}>
            이용약관
          </Text>{' '}
          및{' '}
          <Text accessibilityRole="link" onPress={openPrivacyPolicy} style={styles.termsLink}>
            개인정보처리방침
          </Text>
          에 동의하게 됩니다
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: loginColors.background,
    flex: 1,
    overflow: 'hidden',
    paddingBottom: 26,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  screenCompact: {
    paddingBottom: 18,
    paddingTop: 18,
  },
  brand: {
    alignItems: 'center',
  },
  logoPill: {
    alignItems: 'center',
    backgroundColor: authColors.brand,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 17,
    shadowColor: '#0D1111',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  copy: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 2,
  },
  copyCompact: {
    paddingTop: 0,
  },
  logo: {
    height: 22,
    width: 58,
  },
  headline: {
    color: loginColors.ink,
    fontFamily: AppFonts.bold,
    fontSize: 22,
    lineHeight: 29,
    textAlign: 'center',
  },
  highlight: {
    color: loginColors.accent,
  },
  description: {
    color: loginColors.muted,
    fontFamily: AppFonts.medium,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
    textAlign: 'center',
  },
  imageFrame: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 330,
    paddingHorizontal: 0,
    paddingVertical: 16,
  },
  imageFrameCompact: {
    minHeight: 272,
    paddingVertical: 6,
  },
  imageCard: {
    alignItems: 'center',
    shadowColor: '#1B2528',
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
    width: '100%',
  },
  image: {
    aspectRatio: 270 / 369,
    maxHeight: 390,
    width: '74%',
  },
  imageCompact: {
    maxHeight: 300,
    width: '62%',
  },
  footer: {
    marginTop: 18,
  },
  footerCompact: {
    marginTop: 12,
  },
  terms: {
    color: loginColors.muted,
    fontFamily: AppFonts.semiBold,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  termsLink: {
    color: loginColors.accent,
    fontFamily: AppFonts.bold,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
});
