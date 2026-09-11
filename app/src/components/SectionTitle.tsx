import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../theme';

type Props = { eyebrow?: string; title: string; subtitle?: string };

export function SectionTitle({ eyebrow, title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.s4 },
  eyebrow: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.olive,
    marginBottom: spacing.s1,
  },
  title: { fontFamily: fonts.displaySemibold, fontSize: fontSize.xl, color: colors.text },
  subtitle: {
    fontFamily: fonts.bodyRegular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.s1,
    lineHeight: 22,
  },
});
