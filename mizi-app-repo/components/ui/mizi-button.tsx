import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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

type MiziButtonVariant = 'primary' | 'dark' | 'ghost';
type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

type MiziButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: MiziButtonVariant;
  leftIcon?: MaterialIconName;
  rightIcon?: MaterialIconName;
  style?: StyleProp<ViewStyle>;
};

const variantColors: Record<MiziButtonVariant, { background: string; color: string }> = {
  primary: {
    background: '#2F9B6F',
    color: '#FFFFFF',
  },
  dark: {
    background: 'rgba(255, 255, 255, 0.12)',
    color: '#FFFFFF',
  },
  ghost: {
    background: '#FFFFFF',
    color: '#2F9B6F',
  },
};

export function MiziButton({
  disabled,
  label,
  leftIcon,
  onPressIn,
  onPressOut,
  rightIcon,
  style,
  variant = 'primary',
  ...pressableProps
}: MiziButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const colors = variantColors[variant];

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
            { backgroundColor: colors.background },
            pressed && styles.pressed,
            disabled && styles.disabled,
            { transform: [{ scale }] },
          ]}
        >
          {leftIcon ? <MaterialIcons color={colors.color} name={leftIcon} size={22} /> : null}
          <Text style={[styles.label, { color: colors.color }]}>{label}</Text>
          {rightIcon ? <MaterialIcons color={colors.color} name={rightIcon} size={22} /> : null}
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 9,
    height: 54,
    justifyContent: 'center',
    width: '100%',
  },
  disabled: {
    opacity: 0.48,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    includeFontPadding: false,
    letterSpacing: 0,
  },
  pressable: {
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
  },
});
