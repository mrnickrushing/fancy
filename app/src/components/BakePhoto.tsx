import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

type Props = { uri: string | null; size: number; style?: StyleProp<ImageStyle & ViewStyle> };

// A square of a bake. When there is no photograph — a bake written in by hand,
// or one whose picture has not been taken yet — it holds its place as a plain
// square of paper rather than collapsing and shuffling the row.
export function BakePhoto({ uri, size, style }: Props) {
  const box = { width: size, height: size, borderRadius: radius.sm };
  if (!uri) return <View style={[styles.blank, box, style]} />;
  return <Image source={{ uri }} style={[box, style]} resizeMode="cover" accessible={false} />;
}

const styles = StyleSheet.create({
  blank: { backgroundColor: colors.surfaceOffset, borderWidth: 1, borderColor: colors.divider },
});
