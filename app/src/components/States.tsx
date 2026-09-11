import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../theme';
import { Button } from './Button';

export function LoadingState({ message = 'Bringing up the order book…' }: { message?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.body}>{message}</Text>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.body}>{message}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>That did not come out right</Text>
      <Text style={styles.body}>{message}</Text>
      {onRetry ? <Button label="Try again" variant="outline" small onPress={onRetry} style={styles.retry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.s12, paddingHorizontal: spacing.s6, gap: spacing.s2 },
  title: { fontFamily: fonts.displaySemibold, fontSize: fontSize.lg, color: colors.text, textAlign: 'center' },
  body: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  retry: { marginTop: spacing.s3 },
});
