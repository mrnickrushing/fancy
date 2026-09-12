import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../theme';
import { useReadOnly } from '../hooks/useSession';
import { Logo } from './Logo';

export const TABLET_BREAKPOINT = 768;
export const CONTENT_MAX_WIDTH = 980;
export const NARROW_MAX_WIDTH = 680;

// Keeps a line of text from running the full width of an iPad. Below the
// breakpoint it constrains nothing, because a phone has no width to spare.
export function ContentFrame({
  children, narrow = false, style,
}: { children: ReactNode; narrow?: boolean; style?: StyleProp<ViewStyle> }) {
  const { width } = useWindowDimensions();
  const max = narrow ? NARROW_MAX_WIDTH : CONTENT_MAX_WIDTH;
  return (
    <View style={[styles.frame, width >= TABLET_BREAKPOINT && { maxWidth: max, alignSelf: 'center', width: '100%' }, style]}>
      {children}
    </View>
  );
}

export function Screen({ children, header = true }: { children: ReactNode; header?: boolean }) {
  const insets = useSafeAreaInsets();
  const readOnly = useReadOnly();
  return (
    <View style={styles.screen}>
      {header ? (
        <View style={[styles.header, { paddingTop: insets.top + spacing.s2 }]}>
          <Logo size={40} />
        </View>
      ) : (
        <View style={{ height: insets.top }} />
      )}
      {readOnly ? (
        <View style={styles.readOnly}>
          <Text style={styles.readOnlyText}>
            App Review account — sample orders, and nothing here can be changed.
          </Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingHorizontal: spacing.s5,
    paddingBottom: spacing.s3,
  },
  frame: { flex: 1 },
  readOnly: {
    backgroundColor: colors.goldPale,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s5,
  },
  readOnlyText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.goldRead,
    textAlign: 'center',
  },
});
