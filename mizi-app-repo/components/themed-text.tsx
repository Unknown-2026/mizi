import { StyleSheet, Text, type TextProps } from 'react-native';

import { AppFonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: AppFonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontFamily: AppFonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: AppFonts.bold,
    fontSize: 32,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: AppFonts.bold,
    fontSize: 20,
  },
  link: {
    fontFamily: AppFonts.semiBold,
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
