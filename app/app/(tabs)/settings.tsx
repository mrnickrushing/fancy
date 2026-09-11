import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { NoticeBanner } from '../../src/components/NoticeBanner';
import { ContentFrame, Screen } from '../../src/components/Screen';
import { SectionTitle } from '../../src/components/SectionTitle';
import { ErrorState, LoadingState } from '../../src/components/States';
import { API_URL, errorMessage } from '../../src/api/client';
import { changePassword } from '../../src/api/auth';
import { useSettings, useSettingsActions } from '../../src/hooks/useResources';
import { useAuthStore } from '../../src/store/auth';
import { colors, fonts, fontSize, spacing } from '../../src/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);

  const { data, isLoading, error, refetch } = useSettings();
  const { save, retryEmails } = useSettingsActions();

  const [notice, setNotice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [instructions, setInstructions] = useState('');
  const [pickup, setPickup] = useState('');
  const [shopStatus, setShopStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwStatus, setPwStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Seeded once the settings arrive; after that the fields are Amanda's.
  useEffect(() => {
    if (!data) return;
    setNotice(data.settings.min_notice_days);
    setDeposit(data.settings.deposit_percent);
    setInstructions(data.settings.payment_instructions);
    setPickup(data.settings.pickup_note);
  }, [data]);

  const saveShop = async () => {
    setShopStatus(null);
    try {
      await save.mutateAsync({
        min_notice_days: notice.trim(),
        deposit_percent: deposit.trim(),
        payment_instructions: instructions.trim(),
        pickup_note: pickup.trim(),
      });
      setShopStatus({ tone: 'success', message: 'Saved. The website says so too.' });
    } catch (err) {
      setShopStatus({ tone: 'error', message: errorMessage(err) });
    }
  };

  const submitPassword = async () => {
    setPwStatus(null);
    if (next.length < 8) return setPwStatus({ tone: 'error', message: 'Use at least eight characters.' });
    if (next !== confirm) return setPwStatus({ tone: 'error', message: 'Those two do not match.' });
    if (!username) return;
    setPwLoading(true);
    try {
      await changePassword(username, current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setPwStatus({ tone: 'success', message: 'Changed — on this phone and on the website both.' });
    } catch (err) {
      setPwStatus({ tone: 'error', message: errorMessage(err) });
    } finally {
      setPwLoading(false);
    }
  };

  const outbox = data?.emailOutbox ?? {};
  const failed = (outbox.failed ?? 0) + (outbox.dead ?? 0);
  const queued = (outbox.pending ?? 0) + (outbox.sending ?? 0);

  return (
    <Screen>
      <ContentFrame narrow>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <SectionTitle eyebrow="The bakery" title="Settings" />

          {isLoading ? (
            <LoadingState message="Reading your settings…" />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={refetch} />
          ) : (
            <>
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>Email</Text>
                {data?.emailConfigured ? (
                  <Text style={styles.body}>
                    {failed
                      ? `${failed} message${failed === 1 ? '' : 's'} could not be sent.`
                      : queued
                        ? `${queued} message${queued === 1 ? '' : 's'} waiting to go out.`
                        : 'Everything sent.'}
                  </Text>
                ) : (
                  <Text style={styles.body}>
                    Email is not switched on, so orders still save but nothing is sent. The Resend key is missing.
                  </Text>
                )}
                {failed ? (
                  <Button
                    label="Try those again"
                    variant="outline"
                    small
                    onPress={() => retryEmails.mutate()}
                    loading={retryEmails.isPending}
                    style={styles.spaced}
                  />
                ) : null}
              </Card>

              <Card style={styles.card}>
                <Text style={styles.cardTitle}>Taking orders</Text>
                {shopStatus ? <NoticeBanner tone={shopStatus.tone} message={shopStatus.message} /> : null}
                <Input
                  label="Days of notice"
                  value={notice}
                  onChangeText={setNotice}
                  keyboardType="number-pad"
                  hint="How far ahead someone has to order."
                />
                <Input
                  label="Deposit percent"
                  value={deposit}
                  onChangeText={setDeposit}
                  keyboardType="number-pad"
                  hint="0 if you do not take deposits."
                />
                <Input label="What you tell people about paying" value={instructions} onChangeText={setInstructions} multiline />
                <Input label="Where and when to collect" value={pickup} onChangeText={setPickup} multiline />
                <Button label="Save" onPress={saveShop} loading={save.isPending} />
              </Card>

              <Card style={styles.card}>
                <Text style={styles.cardTitle}>Your password</Text>
                {pwStatus ? <NoticeBanner tone={pwStatus.tone} message={pwStatus.message} /> : null}
                <Input label="Current password" value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" />
                <Input label="New password" value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none" />
                <Input label="New password again" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" />
                <Button label="Change it" onPress={submitPassword} loading={pwLoading} />
              </Card>

              <Card style={styles.card}>
                <Text style={styles.cardTitle}>This app</Text>
                <Text style={styles.row}>Signed in as {username}</Text>
                <Text style={styles.row}>Talking to {API_URL}</Text>
                <Button label="Check for updates" variant="outline" small onPress={() => router.push('/updates')} style={styles.spaced} />
                <Button
                  label="Sign out"
                  variant="danger"
                  style={styles.spaced}
                  onPress={() =>
                    Alert.alert('Sign out?', 'You will need your password again on this phone.', [
                      { text: 'Stay', style: 'cancel' },
                      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
                    ])
                  }
                />
              </Card>
            </>
          )}
        </ScrollView>
      </ContentFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.s5, paddingBottom: spacing.s16 },
  card: { marginBottom: spacing.s4 },
  cardTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSize.lg, color: colors.text, marginBottom: spacing.s3 },
  body: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 22 },
  row: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.s1 },
  spaced: { marginTop: spacing.s4 },
});
