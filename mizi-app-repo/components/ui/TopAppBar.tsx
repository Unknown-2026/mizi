import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TopAppBarIconName = keyof typeof MaterialIcons.glyphMap;

export type TopAppBarAction = {
  icon: TopAppBarIconName;
  accessibilityLabel: string;
  color?: string;
  disabled?: boolean;
  onPress?: () => void;
  size?: number;
};

type TopAppBarVariant = 'light' | 'dark' | 'transparent';

export type TopAppBarProps = {
  title?: string;
  leftAction?: TopAppBarAction;
  rightAction?: TopAppBarAction;
  titleAlign?: 'center' | 'left' | 'right';
  variant?: TopAppBarVariant;
  backgroundColor?: string;
  contentColor?: string;
  safeArea?: boolean;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
};

const variantColors: Record<TopAppBarVariant, { backgroundColor: string; contentColor: string }> = {
  dark: {
    backgroundColor: 'transparent',
    contentColor: '#FFFFFF',
  },
  light: {
    backgroundColor: '#FFFFFF',
    contentColor: '#202326',
  },
  transparent: {
    backgroundColor: 'transparent',
    contentColor: '#202326',
  },
};

export function TopAppBar({
  backgroundColor,
  contentColor,
  title,
  leftAction,
  rightAction,
  safeArea = true,
  titleAlign = 'center',
  titleStyle,
  variant = 'light',
  style,
}: TopAppBarProps) {
  const insets = useSafeAreaInsets();
  const colors = variantColors[variant];
  const resolvedBackgroundColor = backgroundColor ?? colors.backgroundColor;
  const resolvedContentColor = contentColor ?? colors.contentColor;
  const topInset = safeArea ? insets.top : 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: resolvedBackgroundColor,
          height: topInset + 56,
          paddingTop: topInset,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <TopAppBarButton action={leftAction} color={resolvedContentColor} />
        <View style={styles.titleSlot}>
          {title ? (
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                { color: resolvedContentColor, textAlign: titleAlign },
                titleStyle,
              ]}
            >
              {title}
            </Text>
          ) : null}
        </View>
        <TopAppBarButton action={rightAction} color={resolvedContentColor} />
      </View>
    </View>
  );
}

function TopAppBarButton({ action, color }: { action?: TopAppBarAction; color: string }) {
  if (!action) {
    return <View style={styles.iconSlot} />;
  }

  return (
    <Pressable
      accessibilityLabel={action.accessibilityLabel}
      accessibilityRole="button"
      disabled={action.disabled}
      hitSlop={12}
      onPress={action.onPress}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.pressed,
        action.disabled && styles.disabled,
      ]}
    >
      <MaterialIcons color={action.color ?? color} name={action.icon} size={action.size ?? 28} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: 20,
    width: '100%',
  },
  disabled: {
    opacity: 0.35,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconSlot: {
    height: 44,
    width: 44,
  },
  pressed: {
    opacity: 0.58,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    includeFontPadding: false,
    letterSpacing: 0,
  },
  titleSlot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});
