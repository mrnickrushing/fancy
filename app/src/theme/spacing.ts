// --s1 … --s20 from the website, in points.
export const spacing = {
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24,
  s8: 32, s10: 40, s12: 48, s16: 64, s20: 80,
} as const;

// The site is almost square-cornered — 2px to 4px — and the app keeps that
// rather than drifting to the rounded look every other phone app has.
export const radius = { sm: 2, md: 3, lg: 4, pill: 9999 } as const;

export const shadow = {
  sm: { shadowColor: '#2A0B0B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#2A0B0B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.13, shadowRadius: 22, elevation: 3 },
  lg: { shadowColor: '#2A0B0B', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.18, shadowRadius: 52, elevation: 8 },
} as const;
