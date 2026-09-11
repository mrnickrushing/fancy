import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

// The masthead, as the site sets it: the emblem, then "Oh! You Fancy" in
// Italianno over FOCACCIA in wide-tracked Bodoni caps.
export function Logo({ size = 44, showWordmark = true }: { size?: number; showWordmark?: boolean }) {
  return (
    <View style={styles.row}>
      <Image
        source={require('../../assets/logo.webp')}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="Oh! You Fancy Focaccia"
      />
      {showWordmark ? (
        <View style={styles.words}>
          <Text style={[styles.script, { fontSize: size * 0.72 }]}>Oh! You Fancy</Text>
          <Text style={[styles.caps, { fontSize: size * 0.26 }]}>Focaccia</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  words: { justifyContent: 'center' },
  script: { fontFamily: fonts.script, color: colors.primary, lineHeight: 34 },
  caps: {
    fontFamily: fonts.displayBold,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: colors.text,
    marginTop: -2,
  },
});
