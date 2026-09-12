import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { NoticeBanner } from '../src/components/NoticeBanner';
import { ContentFrame, Screen } from '../src/components/Screen';
import { SectionTitle } from '../src/components/SectionTitle';
import { LoadingState } from '../src/components/States';
import { errorMessage } from '../src/api/client';
import { useMenu } from '../src/hooks/useMenu';
import { useOrderActions } from '../src/hooks/useOrders';
import { useSettings } from '../src/hooks/useResources';
import { COURSE_LABELS, COURSE_ORDER, type Fulfillment } from '../src/api/types';
import { maskDateInput, toIsoFromMasked } from '../src/utils/dateInput';
import { fmtMoney, toNumber } from '../src/utils/format';
import { colors, fonts, fontSize, radius, spacing } from '../src/theme';

const FULFILLMENTS: { key: Fulfillment; label: string }[] = [
  { key: 'pickup', label: 'Market pickup' },
  { key: 'delivery', label: 'Local delivery' },
  { key: 'shipping', label: 'Shipping' },
];

export default function NewOrderScreen() {
  const router = useRouter();
  const { data: menu, isLoading } = useMenu();
  const { create } = useOrderActions();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup');
  const [neededDate, setNeededDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Amanda can write in anything on the bill of fare, including bakes that
  // are switched off for the website this week.
  const grouped = useMemo(() => {
    const items = menu?.items ?? [];
    return COURSE_ORDER.map((course) => ({ course, items: items.filter((i) => i.course === course) })).filter(
      (g) => g.items.length,
    );
  }, [menu]);

  const chosen = useMemo(
    () => Object.entries(quantities).filter(([, q]) => q > 0).map(([id, q]) => ({ id: Number(id), quantity: q })),
    [quantities],
  );

  const { data: settingsData } = useSettings();

  // Flat, and only on shipping — the same rule the server applies when it
  // snapshots the fee onto the order, so the figure here is the figure it
  // will actually be charged.
  const shippingFee = useMemo(
    () => (fulfillment === 'shipping' ? toNumber(settingsData?.settings.shipping_fee) : 0),
    [fulfillment, settingsData],
  );

  const itemsTotal = useMemo(() => {
    const items = menu?.items ?? [];
    let sum = 0;
    for (const { id, quantity } of chosen) {
      const item = items.find((i) => i.id === id);
      if (item?.price) sum += toNumber(item.price) * quantity;
    }
    return sum;
  }, [chosen, menu]);

  const total = itemsTotal + shippingFee;

  const bump = (id: number, by: number) => {
    setQuantities((q) => {
      const next = Math.max(0, Math.min(50, (q[id] ?? 0) + by));
      return { ...q, [id]: next };
    });
  };

  const submit = async () => {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) return setError('A first and last name, please.');
    if (!email.trim() && !phone.trim()) return setError('An email address or a phone number is required.');
    const iso = toIsoFromMasked(neededDate);
    if (!iso) return setError('That date is not a real day. Use MM/DD/YYYY.');
    if (fulfillment !== 'pickup' && !address.trim()) return setError('Delivery and shipping need an address.');
    if (!chosen.length) return setError('Add at least one bake.');

    try {
      await create.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        fulfillment,
        neededDate: iso,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        items: chosen,
      });
      router.replace({ pathname: '/(tabs)/orders', params: { created: '1' } });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Screen>
      <ContentFrame narrow>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Button label="Back" variant="outline" small onPress={() => router.back()} style={styles.back} />
          <SectionTitle
            eyebrow="Taken in person"
            title="Write an order in"
            subtitle="The same book as the website. Market days are not enforced here — you know what you agreed to."
          />

          {error ? <NoticeBanner tone="error" message={error} /> : null}
          {email.trim() ? (
            <NoticeBanner tone="info" message="Giving an email means they get the thank-you straight away." />
          ) : null}

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Who</Text>
            <Input label="First name" value={firstName} onChangeText={setFirstName} />
            <Input label="Last name" value={lastName} onChangeText={setLastName} />
            <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>When and how</Text>
            <Input
              label="Date wanted"
              value={neededDate}
              onChangeText={(v) => setNeededDate(maskDateInput(v))}
              keyboardType="number-pad"
              placeholder="MM/DD/YYYY"
            />
            <Text style={styles.label}>How</Text>
            <View style={styles.chips}>
              {FULFILLMENTS.map((f) => (
                <Pressable key={f.key} onPress={() => setFulfillment(f.key)} style={[styles.chip, fulfillment === f.key && styles.chipActive]}>
                  <Text style={[styles.chipLabel, fulfillment === f.key && styles.chipLabelActive]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
            {fulfillment !== 'pickup' ? (
              <Input label="Address" value={address} onChangeText={setAddress} multiline />
            ) : null}
            <Input label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Anything they asked for" />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>What they want</Text>
            {isLoading ? (
              <LoadingState message="Reading the bill of fare…" />
            ) : (
              grouped.map((group) => (
                <View key={group.course} style={styles.group}>
                  <Text style={styles.groupTitle}>{COURSE_LABELS[group.course]}</Text>
                  {group.items.map((item) => {
                    const qty = quantities[item.id] ?? 0;
                    return (
                      <View key={item.id} style={styles.pickRow}>
                        <View style={styles.flex}>
                          <Text style={styles.pickName}>{item.name}</Text>
                          <Text style={styles.pickPrice}>
                            {item.price === null ? 'On request' : fmtMoney(item.price)}
                            {item.available ? '' : ' · off the website just now'}
                          </Text>
                        </View>
                        <View style={styles.stepper}>
                          <Pressable onPress={() => bump(item.id, -1)} style={styles.step} hitSlop={6}>
                            <Text style={styles.stepLabel}>−</Text>
                          </Pressable>
                          <Text style={styles.qty}>{qty}</Text>
                          <Pressable onPress={() => bump(item.id, 1)} style={styles.step} hitSlop={6}>
                            <Text style={styles.stepLabel}>+</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
            {chosen.length ? (
              <>
                {shippingFee > 0 ? (
                  <View style={styles.feeRow}>
                    <Text style={styles.pickName}>Shipping</Text>
                    <Text style={styles.pickPrice}>{fmtMoney(shippingFee)}</Text>
                  </View>
                ) : null}
                <Text style={styles.runningTotal}>
                  {chosen.reduce((n, c) => n + c.quantity, 0)} item
                  {chosen.reduce((n, c) => n + c.quantity, 0) === 1 ? '' : 's'} · about {fmtMoney(total)}
                </Text>
              </>
            ) : null}
          </Card>

          <Button label="Put it in the book" onPress={submit} loading={create.isPending} style={styles.submit} />
        </ScrollView>
      </ContentFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.s5, paddingBottom: spacing.s20 },
  back: { alignSelf: 'flex-start', marginBottom: spacing.s4 },
  card: { marginBottom: spacing.s4 },
  cardTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSize.lg, color: colors.text, marginBottom: spacing.s3 },
  label: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.textMuted, marginBottom: spacing.s2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s2, marginBottom: spacing.s4 },
  chip: { paddingVertical: spacing.s2, paddingHorizontal: spacing.s3, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontFamily: fonts.displaySemibold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textMuted },
  chipLabelActive: { color: colors.textInverse },
  group: { marginBottom: spacing.s5 },
  groupTitle: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.olive, marginBottom: spacing.s2 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s3, paddingVertical: spacing.s2, borderBottomWidth: 1, borderBottomColor: colors.divider },
  flex: { flex: 1 },
  pickName: { fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: colors.text },
  pickPrice: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.s3 },
  step: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  stepLabel: { fontFamily: fonts.displaySemibold, fontSize: 18, color: colors.primary, lineHeight: 22 },
  qty: { minWidth: 20, textAlign: 'center', fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s2,
    marginTop: spacing.s2,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  runningTotal: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text, marginTop: spacing.s3 },
  submit: { marginBottom: spacing.s8 },
});
