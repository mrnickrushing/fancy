import { ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, radius, spacing } from '../theme';

// Everything the order screen can do, without everything it can do being on
// screen at once. Shut by default: the timeline and the one act left are what
// Amanda came for, and the rest is there when she goes looking.
export function Fold({
  title, children, open: initial = false,
}: { title: string; children: ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  // The one act left can send Amanda into a fold that is already on screen —
  // "record a payment" opens the money panel. It only ever opens it: once she
  // is in there, shutting it is hers to do.
  useEffect(() => {
    if (initial) setOpen(true);
  }, [initial]);
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.head}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.title}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s3,
    padding: spacing.s4,
  },
  title: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  body: { padding: spacing.s4, paddingTop: 0 },
});
