import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';

export function InfoNotice({
  icon,
  subtitle,
  title,
  tone = 'default',
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  subtitle: string;
  title: string;
  tone?: 'default' | 'light';
}) {
  const light = tone === 'light';

  return (
    <View style={[styles.notice, light && styles.lightNotice]}>
      <View style={[styles.noticeIcon, light && styles.lightNoticeIcon]}>
        <MaterialIcons color={light ? palette.muted : palette.green} name={icon} size={22} />
      </View>
      <View style={styles.noticeTextWrap}>
        <Text style={[styles.noticeTitle, light && styles.lightNoticeTitle]}>{title}</Text>
        <Text style={styles.noticeSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lightNotice: {
    backgroundColor: '#FFFFFF',
  },
  lightNoticeIcon: {
    backgroundColor: '#EEF0F0',
  },
  lightNoticeTitle: {
    color: palette.black,
  },
  notice: {
    alignItems: 'center',
    backgroundColor: '#F6FBF8',
    borderColor: '#E2EEE8',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 0,
    flexDirection: 'row',
    gap: 13,
    minHeight: 66,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#10231C',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    width: '100%',
  },
  noticeIcon: {
    alignItems: 'center',
    backgroundColor: '#E4F5EC',
    borderColor: '#CFECDD',
    borderRadius: 21,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  noticeSubtitle: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 17,
    marginTop: 3,
  },
  noticeTextWrap: {
    flex: 1,
  },
  noticeTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
