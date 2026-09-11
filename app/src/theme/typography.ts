// The website's three faces: Bodoni Moda for anything that announces itself,
// EB Garamond for reading, Italianno for the wordmark alone.
export const fonts = {
  displayRegular: 'BodoniModa_400Regular',
  displaySemibold: 'BodoniModa_600SemiBold',
  displayBold: 'BodoniModa_700Bold',
  bodyRegular: 'EBGaramond_400Regular',
  bodyMedium: 'EBGaramond_500Medium',
  bodySemibold: 'EBGaramond_600SemiBold',
  script: 'Italianno_400Regular',
} as const;

export const fontSize = { xs: 13, sm: 15, base: 17, lg: 20, xl: 28, xxl: 34 } as const;

// The site sets small uppercase labels in the display face with wide tracking
// (.caps). Repeated here because it appears on nearly every screen.
export const caps = {
  fontFamily: fonts.displaySemibold,
  fontSize: 11,
  letterSpacing: 1.6,
  textTransform: 'uppercase',
} as const;
