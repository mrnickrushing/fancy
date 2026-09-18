import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

// The masthead, as the site sets it: the emblem, then "Oh! You Fancy" in
// Italianno over FOCACCIA in wide-tracked Bodoni caps.
export function Logo({ size = 44, showWordmark = true, inverse = false }: { size?: number; showWordmark?: boolean; inverse?: boolean }) {
  return (
    <View style={styles.row}>
      {/* The emblem is full-colour artwork and stays that way on a dark
          ground. A tint replaces every opaque pixel with one colour, and on
          a round badge that leaves a flat disc where the logo was. Only the
          wordmark inverts. */}
      <Image
        source={require('../../assets/logo.webp')}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="Oh! You Fancy Focaccia"
      />
      {showWordmark ? (
        <View style={styles.words}>
          <Text style={[styles.script, { fontSize: size * 0.72, lineHeight: size * 0.77 }, inverse && styles.scriptInverse]}>
            Oh! You Fancy
          </Text>
          <Text style={[styles.caps, { fontSize: size * 0.26 }, inverse && styles.capsInverse]}>Focaccia</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  words: { justifyContent: 'center' },
  script: { fontFamily: fonts.script, color: colors.primary },
  scriptInverse: { color: colors.bg },
  caps: {
    fontFamily: fonts.displayBold,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: colors.text,
    marginTop: -2,
  },
  capsInverse: { color: 'rgba(244,239,226,0.8)' },
});
