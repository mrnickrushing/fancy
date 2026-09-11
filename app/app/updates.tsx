import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { NoticeBanner } from '../src/components/NoticeBanner';
import { ContentFrame, Screen } from '../src/components/Screen';
import { SectionTitle } from '../src/components/SectionTitle';
import { colors, fonts, fontSize, spacing } from '../src/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function UpdatesScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);

  const check = async () => {
    setStatus(null);
    setChecking(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setStatus({ tone: 'info', message: 'This is the newest version.' });
        return;
      }
      setStatus({ tone: 'info', message: 'Fetching the update…' });
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'That check did not work.' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Screen>
      <ContentFrame narrow>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Button label="Back" variant="outline" small onPress={() => router.back()} style={styles.back} />
          <SectionTitle eyebrow="This app" title="Updates" />

          {status ? <NoticeBanner tone={status.tone} message={status.message} /> : null}

          <Card>
            <Row label="Version" value={Constants.expoConfig?.version ?? 'unknown'} />
            <Row label="Updates" value={Updates.isEnabled ? 'On' : 'Not set up yet'} />
            {Updates.isEnabled ? (
              <>
                <Row label="Channel" value={Updates.channel ?? '—'} />
                <Row label="Runtime" value={Updates.runtimeVersion ?? '—'} />
                <Row label="This build" value={Updates.updateId ? Updates.updateId.slice(0, 8) : 'the original'} />
              </>
            ) : null}
          </Card>

          {Updates.isEnabled ? (
            <Button label="Check for an update" onPress={check} loading={checking} style={styles.check} />
          ) : (
            <Text style={styles.note}>
              Over-the-air updates switch on once this app has been through `eas init` and a build carrying an
              update channel. Until then it only changes when a new build is installed.
            </Text>
          )}
        </ScrollView>
      </ContentFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.s5, paddingBottom: spacing.s16 },
  back: { alignSelf: 'flex-start', marginBottom: spacing.s4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.s4, paddingVertical: spacing.s2, borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textMuted },
  value: { flex: 1, fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.text, textAlign: 'right' },
  check: { marginTop: spacing.s5 },
  note: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.s5, lineHeight: 22 },
});
