import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { authColors } from '@/constants/auth';
import { AppFonts } from '@/constants/theme';

type AuthButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'primary' | 'kakao';
  style?: StyleProp<ViewStyle>;
};

export function AuthButton({
  label,
  variant = 'primary',
  style,
  disabled,
  onPressIn,
  onPressOut,
  ...pressableProps
}: AuthButtonProps) {
  const isKakao = variant === 'kakao';
  const scale = useRef(new Animated.Value(1)).current;

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      damping: 18,
      mass: 0.65,
      stiffness: 260,
      toValue,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={(event) => {
        animateScale(0.975);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateScale(1);
        onPressOut?.(event);
      }}
      style={[styles.pressable, style]}
      {...pressableProps}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.button,
            isKakao ? styles.kakaoButton : styles.primaryButton,
            pressed && styles.pressed,
            disabled && styles.disabled,
            { transform: [{ scale }] },
          ]}
        >
          {isKakao ? <Ionicons name="chatbubble" size={22} color={authColors.text} /> : null}
          <Text style={[styles.label, isKakao ? styles.kakaoLabel : styles.primaryLabel]}>
            {label}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  button: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 9,
    height: 54,
    justifyContent: 'center',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: authColors.primary,
  },
  kakaoButton: {
    backgroundColor: authColors.kakao,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.48,
  },
  label: {
    fontFamily: AppFonts.bold,
    fontSize: 15,
    includeFontPadding: false,
  },
  primaryLabel: {
    color: authColors.white,
  },
  kakaoLabel: {
    color: authColors.text,
  },
});
