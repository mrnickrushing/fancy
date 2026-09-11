import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '../theme';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  containerStyle?: ViewStyle;
};

export function Input({ label, hint, containerStyle, style, ...rest }: Props) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[styles.field, rest.multiline && styles.multiline, style]}
        {...rest}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.s4 },
  label: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.s2,
  },
  field: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    minHeight: 48,
    fontFamily: fonts.bodyRegular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top', paddingTop: spacing.s3 },
  hint: {
    fontFamily: fonts.bodyRegular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.s1,
  },
});
