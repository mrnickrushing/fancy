// The website's tokens, transcribed. These are the same values that
// design/_build.py writes into public/style.css — when one moves, both move,
// or Amanda's phone stops matching her own shopfront.
export const colors = {
  bg: '#F4EFE2',            // --paper
  surface: '#FBF8EF',       // --paper-2
  surfaceOffset: '#EAE1CB', // --paper-3
  surfaceDynamic: '#DED2B4', // --paper-4
  divider: '#DED2B4',       // --rule-soft
  border: '#CBBB97',        // --rule

  text: '#33190F',          // --ink
  textMuted: '#6E4432',     // --ink-soft
  // App-only. The site never needs a third text weight because it has more
  // room; a phone does, for timestamps and helper lines.
  textFaint: '#A08770',
  textInverse: '#FBF8EF',

  primary: '#8E1B1B',       // --burgundy
  primaryHover: '#711616',  // --burgundy-mid
  primaryActive: '#4A0E0E', // --burgundy-deep
  primaryInk: '#2A0B0B',    // --burgundy-ink
  // App-only tint, for the pressed state behind a focused tab icon.
  primaryHighlight: '#F0DAD6',

  olive: '#4E6023',         // --olive
  oliveDeep: '#33401A',     // --olive-deep
  olivePale: '#E4E7D0',     // --olive-pale

  // --gold is an ornament colour: at 2.9:1 on paper it must never carry text
  // you are meant to read. goldRead is the same hue at 4.9:1.
  gold: '#B8862F',
  goldPale: '#EFE0BE',
  goldRead: '#8A6420',

  crust: '#C98A45',         // --crust

  white: '#FFFFFF',
  overlay: 'rgba(42,11,11,0.5)',
} as const;

// Order status, review status and payment status all render as the same pill,
// so they share one map.
export const statusColors = {
  pending: { bg: '#F6E7C6', text: '#8A6420' },
  accepted: { bg: '#E4E7D0', text: '#33401A' },
  approved: { bg: '#E4E7D0', text: '#33401A' },
  completed: { bg: '#E4E7D0', text: '#33401A' },
  declined: { bg: '#F3DAD6', text: '#8E1B1B' },
  rejected: { bg: '#F3DAD6', text: '#8E1B1B' },
  cancelled: { bg: '#E3DCCD', text: '#6E4432' },

  unpaid: { bg: '#E3DCCD', text: '#6E4432' },
  deposit_paid: { bg: '#F6E7C6', text: '#8A6420' },
  paid: { bg: '#E4E7D0', text: '#33401A' },
  refunded: { bg: '#F3DAD6', text: '#8E1B1B' },
} as const;

export const starColor = '#B8862F';
