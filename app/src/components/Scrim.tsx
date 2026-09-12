import { StyleSheet, View } from 'react-native';

// The design darkens the photograph twice — hard at the top so the wordmark
// reads, again at the foot so the caption does, and barely at all across the
// middle where the bake itself is. A real gradient would mean a native
// dependency and so a new build; this is the same three stops stepped through
// enough slices that the seams do not show.
const STOPS: [number, number][] = [
  [0, 0.55],
  [0.42, 0.05],
  [1, 0.82],
];
const SLICES = 18;

export function alphaAt(t: number): number {
  for (let i = 1; i < STOPS.length; i += 1) {
    const [at, a] = STOPS[i];
    const [prevAt, prevA] = STOPS[i - 1];
    if (t <= at) {
      const span = at - prevAt;
      const k = span === 0 ? 0 : (t - prevAt) / span;
      return prevA + (a - prevA) * k;
    }
  }
  return STOPS[STOPS.length - 1][1];
}

export function Scrim() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: SLICES }, (_, i) => (
        <View
          key={i}
          style={{ flex: 1, backgroundColor: `rgba(42,11,11,${alphaAt((i + 0.5) / SLICES).toFixed(3)})` }}
        />
      ))}
    </View>
  );
}
