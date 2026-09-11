import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

type Variant = 'primary' | 'olive' | 'outline' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  small?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// The website's buttons: square, wide-tracked small caps in the display face,
// and they letterspace a little further on press rather than changing colour.
export function Button({
  label, onPress, variant = 'primary', small = false, loading = false, disabled = false, style,
}: Props) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        styles[variant],
        pressed && !off && styles.pressed,
        off && styles.off,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? colors.primary : colors.textInverse} />
      ) : (
        <Text style={[styles.label, small && styles.labelSmall, variant === 'outline' && styles.labelOutline]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { minHeight: 40, paddingVertical: spacing.s2, paddingHorizontal: spacing.s4 },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  olive: { backgroundColor: colors.olive, borderColor: colors.olive },
  outline: { backgroundColor: 'transparent', borderColor: colors.border },
  danger: { backgroundColor: colors.primaryActive, borderColor: colors.primaryActive },
  pressed: { opacity: 0.88 },
  off: { opacity: 0.5 },
  label: {
    fontFamily: fonts.displaySemibold,
    fontSize: 12,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.textInverse,
    textAlign: 'center',
  },
  labelSmall: { fontSize: 11, letterSpacing: 1.6 },
  labelOutline: { color: colors.text },
});
