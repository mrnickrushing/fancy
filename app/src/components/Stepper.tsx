import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

type Props = { value: number; onChange: (next: number) => void; size?: number; max?: number };

// Minus in outline, plus filled — the plus is the one Amanda reaches for with
// a customer standing in front of her, so it is the one that is coloured.
export function Stepper({ value, onChange, size = 34, max = 50 }: Props) {
  const box = { width: size, height: size };
  const glyph = size >= 40 ? 22 : 18;
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="One fewer"
        style={[styles.step, styles.minus, box, value === 0 && styles.off]}
      >
        <Text style={[styles.glyph, { fontSize: glyph }, styles.minusGlyph]}>−</Text>
      </Pressable>
      <Text style={[styles.qty, { fontSize: size >= 40 ? 20 : 17 }, value === 0 && styles.qtyZero]}>{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="One more"
        style={[styles.step, styles.plus, box]}
      >
        <Text style={[styles.glyph, { fontSize: glyph }, styles.plusGlyph]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  step: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: radius.sm },
  minus: { borderColor: colors.border, backgroundColor: colors.surface },
  plus: { borderColor: colors.primary, backgroundColor: colors.primary },
  off: { opacity: 0.45 },
  glyph: { fontFamily: fonts.displaySemibold, lineHeight: 26 },
  minusGlyph: { color: colors.primary },
  plusGlyph: { color: colors.textInverse },
  qty: { minWidth: 18, textAlign: 'center', fontFamily: fonts.displaySemibold, color: colors.text },
  qtyZero: { color: colors.textFaint },
});
