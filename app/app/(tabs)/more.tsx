import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ContentFrame, Screen } from '../../src/components/Screen';
import { SectionTitle } from '../../src/components/SectionTitle';
import { colors, fonts, fontSize, radius, spacing } from '../../src/theme';

type Row = { icon: keyof typeof Ionicons.glyphMap; title: string; description: string; href: string };

const ROWS: Row[] = [
  {
    icon: 'restaurant-outline',
    title: 'Bill of fare',
    description: 'Prices, descriptions, and what is available this week',
    href: '/menu',
  },
  {
    icon: 'star-outline',
    title: 'Reviews',
    description: 'Approve what appears on the website',
    href: '/reviews',
  },
  {
    icon: 'settings-outline',
    title: 'Settings',
    description: 'Notice period, payment wording, your password',
    href: '/settings',
  },
  {
    icon: 'cloud-download-outline',
    title: 'App updates',
    description: 'Check for a newer version of this app',
    href: '/updates',
  },
];

export default function MoreScreen() {
  const router = useRouter();
  return (
    <Screen>
      <ContentFrame narrow>
        <ScrollView contentContainerStyle={styles.scroll}>
          <SectionTitle eyebrow="Everything else" title="More" />
          {ROWS.map((row) => (
            <Pressable
              key={row.href}
              onPress={() => router.push(row.href)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Ionicons name={row.icon} size={22} color={colors.primary} />
              <View style={styles.text}>
                <Text style={styles.title}>{row.title}</Text>
                <Text style={styles.description}>{row.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          ))}
        </ScrollView>
      </ContentFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.s5, paddingBottom: spacing.s16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.s4,
    marginBottom: spacing.s3,
  },
  rowPressed: { backgroundColor: colors.surfaceOffset },
  text: { flex: 1 },
  title: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  description: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});
