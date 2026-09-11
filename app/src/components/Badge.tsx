import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, statusColors } from '../theme';

type Props = { status: string; label?: string };

// One pill for order status, review status and payment status alike.
export function Badge({ status, label }: Props) {
  const tone = statusColors[status as keyof typeof statusColors] ?? {
    bg: colors.surfaceOffset,
    text: colors.textMuted,
  };
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <Text style={[styles.label, { color: tone.text }]}>
        {(label ?? status).replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: spacing.s2,
    borderRadius: radius.sm,
  },
  label: {
    fontFamily: fonts.displaySemibold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
