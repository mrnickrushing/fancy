import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

type Props = { label: string; value: string | number; accent?: string; style?: StyleProp<ViewStyle> };

export function StatCard({ label, value, accent = colors.primary, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <Text style={[styles.value, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.s4,
    paddingHorizontal: spacing.s3,
    alignItems: 'center',
  },
  value: { fontFamily: fonts.displaySemibold, fontSize: 30 },
  label: {
    fontFamily: fonts.displaySemibold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginTop: spacing.s1,
    textAlign: 'center',
  },
});
