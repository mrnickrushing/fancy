import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '../theme';

type Tone = 'success' | 'error' | 'info';

const tones: Record<Tone, { bg: string; border: string; text: string }> = {
  success: { bg: '#F1F4E6', border: '#C3CDA6', text: colors.oliveDeep },
  error: { bg: '#FDF3F2', border: '#E2B7B2', text: colors.primaryActive },
  info: { bg: '#FBF6EC', border: colors.border, text: colors.text },
};

export function NoticeBanner({ tone = 'info', message }: { tone?: Tone; message: string }) {
  const t = tones[tone];
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[styles.text, { color: t.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s4,
    marginBottom: spacing.s4,
  },
  text: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, lineHeight: 21 },
});
