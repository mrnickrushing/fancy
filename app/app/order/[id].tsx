import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { NoticeBanner } from '../../src/components/NoticeBanner';
import { ContentFrame, Screen } from '../../src/components/Screen';
import { SectionTitle } from '../../src/components/SectionTitle';
import { EmptyState, LoadingState } from '../../src/components/States';
import { errorMessage } from '../../src/api/client';
import { useOrder, useOrderActions } from '../../src/hooks/useOrders';
import { useReadOnly } from '../../src/hooks/useSession';
import {
  FULFILLMENT_LABELS,
  PAYMENT_STATUS_LABELS,
  type Fulfillment,
  type OrderEditInput,
  type PaymentStatus,
} from '../../src/api/types';
import { itemsSubtotal } from '../../src/utils/orders';
import { balanceDue } from '../../src/utils/payment';
import { fmtDate, fmtDateTime, fmtMoney, fmtNumericDate, toNumber } from '../../src/utils/format';
import { maskDateInput, toIsoFromMasked } from '../../src/utils/dateInput';
import { colors, fonts, fontSize, radius, spacing } from '../../src/theme';

const FULFILLMENTS: Fulfillment[] = ['pickup', 'delivery', 'shipping'];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'deposit_paid', 'paid', 'refunded'];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const { data: order, isLoading } = useOrder(orderId);
  const actions = useOrderActions();
  const readOnly = useReadOnly();

  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<OrderEditInput & { neededDate?: string }>({});
  const [amount, setAmount] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <EmptyState title="That order is not here" message="It may have been deleted." />
        <Button label="Back" variant="outline" onPress={() => router.back()} style={styles.backAlone} />
      </Screen>
    );
  }

  const owed = balanceDue(order.paid_amount, order.amount, order.payment_status);
  const subtotal = itemsSubtotal(order);
  const shipping = toNumber(order.shipping_fee);
  // Whether the figure on the order is still the one the server worked out, or
  // one Amanda typed over it. Worth saying, so she knows which she is looking at.
  const autoTotal = subtotal !== null && order.amount !== null && toNumber(order.amount) === subtotal + shipping;

  const READ_ONLY_NOTE = 'The App Review account can look, but not change anything.';

  const run = async (fn: () => Promise<unknown>, message: string) => {
    setStatus(null);
    if (readOnly) return setStatus({ tone: 'error', message: READ_ONLY_NOTE });
    try {
      await fn();
      setStatus({ tone: 'success', message });
    } catch (err) {
      setStatus({ tone: 'error', message: errorMessage(err) });
    }
  };

  const beginEdit = () => {
    setForm({
      firstName: order.first_name,
      lastName: order.last_name,
      email: order.email ?? '',
      phone: order.phone ?? '',
      fulfillment: order.fulfillment,
      neededDate: fmtNumericDate(order.needed_date),
      address: order.address ?? '',
      notes: order.notes ?? '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    const iso = toIsoFromMasked(form.neededDate ?? '');
    if (!iso) {
      setStatus({ tone: 'error', message: 'That date is not a real day. Use MM/DD/YYYY.' });
      return;
    }
    await run(
      () => actions.update.mutateAsync({ id: orderId, patch: { ...form, neededDate: iso } }),
      'Saved.',
    );
    setEditing(false);
  };

  const saveAmount = async () => {
    const trimmed = amount.trim();
    const value = trimmed === '' ? null : Number(trimmed.replace(/^\$/, ''));
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      setStatus({ tone: 'error', message: 'The total must be a number, zero or more.' });
      return;
    }
    await run(() => actions.setAmount.mutateAsync({ id: orderId, amount: value }), 'Total set.');
    setAmount('');
  };

  const addPayment = async () => {
    const value = Number(payAmount.trim().replace(/^\$/, ''));
    if (!Number.isFinite(value) || value <= 0) {
      setStatus({ tone: 'error', message: 'Enter what you were paid.' });
      return;
    }
    await run(
      () => actions.addPayment.mutateAsync({ id: orderId, amount: value, note: payNote.trim() || undefined }),
      'Payment recorded.',
    );
    setPayAmount('');
    setPayNote('');
  };

  const sendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      setStatus({ tone: 'error', message: 'A subject and a message, please.' });
      return;
    }
    await run(
      () => actions.sendEmail.mutateAsync({ id: orderId, subject: subject.trim(), message: message.trim() }),
      'Sent.',
    );
    setSubject('');
    setMessage('');
    setEmailOpen(false);
  };

  return (
    <Screen>
      <ContentFrame narrow>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Button label="Back to orders" variant="outline" small onPress={() => router.back()} style={styles.back} />

          <View style={styles.titleRow}>
            <SectionTitle eyebrow={`Order #${order.id}`} title={`${order.first_name} ${order.last_name}`} />
            <Badge status={order.status} />
          </View>

          {status ? <NoticeBanner tone={status.tone} message={status.message} /> : null}

          {/* Reaching the customer is the thing Amanda does most, so it sits
              above everything else. */}
          <View style={styles.quick}>
            {order.email ? (
              <Button
                label="Email"
                variant="outline"
                small
                style={styles.quickAction}
                onPress={() => Linking.openURL(`mailto:${order.email}`)}
              />
            ) : null}
            {order.phone ? (
              <>
                <Button
                  label="Call"
                  variant="outline"
                  small
                  style={styles.quickAction}
                  onPress={() => Linking.openURL(`tel:${order.phone}`)}
                />
                <Button
                  label="Text"
                  variant="outline"
                  small
                  style={styles.quickAction}
                  onPress={() => Linking.openURL(`sms:${order.phone}`)}
                />
              </>
            ) : null}
          </View>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>The order</Text>
            <Row label="Wanted" value={fmtDate(order.needed_date)} />
            <Row label="How" value={FULFILLMENT_LABELS[order.fulfillment]} />
            {order.address ? <Row label="Address" value={order.address} /> : null}
            {order.email ? <Row label="Email" value={order.email} /> : null}
            {order.phone ? <Row label="Phone" value={order.phone} /> : null}
            <Row label="Came in" value={fmtDateTime(order.created_at)} />
            <Row label="From" value={order.source === 'manual' ? 'Written in by you' : 'The website'} />
            {order.notes ? <Row label="Notes" value={order.notes} /> : null}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>What they asked for</Text>
            {order.items.map((item) => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.itemName}>
                  {item.quantity} × {item.name}
                </Text>
                <Text style={styles.itemPrice}>
                  {item.unit_price === null ? 'On request' : fmtMoney(toNumber(item.unit_price) * item.quantity)}
                </Text>
              </View>
            ))}
            {shipping > 0 ? (
              <View style={styles.item}>
                <Text style={styles.itemName}>Shipping</Text>
                <Text style={styles.itemPrice}>{fmtMoney(shipping)}</Text>
              </View>
            ) : null}
            {subtotal !== null ? (
              <Text style={styles.subtotal}>
                Bill of fare{shipping > 0 ? ' and shipping come' : ' adds up'} to {fmtMoney(subtotal + shipping)}
              </Text>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Money</Text>
            <Row label="Total" value={fmtMoney(order.amount)} />
            {shipping > 0 ? <Row label="Of which shipping" value={fmtMoney(shipping)} /> : null}
            <Row label="Paid so far" value={fmtMoney(order.paid_amount)} />
            {owed !== null ? <Row label="Still owed" value={fmtMoney(owed)} /> : null}
            <View style={styles.badgeRow}>
              <Badge status={order.payment_status} label={PAYMENT_STATUS_LABELS[order.payment_status]} />
            </View>

            <Input
              label="Set the total"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder={order.amount ?? 'Not set yet'}
              hint={
                autoTotal
                  ? `Worked out from the bill of fare${shipping > 0 ? ' plus shipping' : ''}. Change it only if you need to.`
                  : order.amount === null
                    ? 'Something here is quoted on request, so this one is yours to set.'
                    : 'Leave it empty and save to go back to the worked-out total.'
              }
            />
            <Button label="Save the total" small onPress={saveAmount} loading={actions.setAmount.isPending} />

            <View style={styles.divider} />

            {order.payments.length ? (
              order.payments.map((p) => (
                <View key={p.id} style={styles.payment}>
                  <View style={styles.flex}>
                    <Text style={styles.paymentAmount}>{fmtMoney(p.amount)}</Text>
                    <Text style={styles.paymentMeta}>
                      {fmtDateTime(p.received_at)}
                      {p.note ? ` · ${p.note}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Remove this payment?', 'The totals go back to what they were.', [
                        { text: 'Keep', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => run(() => actions.removePayment.mutateAsync(p.id), 'Payment removed.'),
                        },
                      ])
                    }
                  >
                    <Text style={styles.remove}>Remove</Text>
                  </Pressable>
                </View>
              ))
            ) : (
              <Text style={styles.none}>Nothing paid yet.</Text>
            )}

            <Input label="Record a payment" value={payAmount} onChangeText={setPayAmount} keyboardType="decimal-pad" placeholder="0.00" />
            <Input label="Note (optional)" value={payNote} onChangeText={setPayNote} placeholder="Deposit, cash at the market" />
            <Button label="Record it" small variant="olive" onPress={addPayment} loading={actions.addPayment.isPending} />

            <View style={styles.divider} />
            {/* The status follows the money on its own. This is for the
                exceptions — a refund, mostly. */}
            <Text style={styles.label}>Set the status by hand</Text>
            <View style={styles.chips}>
              {PAYMENT_STATUSES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => run(() => actions.setPaymentStatus.mutateAsync({ id: orderId, paymentStatus: s }), 'Updated.')}
                  style={[styles.chip, order.payment_status === s && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, order.payment_status === s && styles.chipLabelActive]}>
                    {PAYMENT_STATUS_LABELS[s]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Send them something</Text>
            <View style={styles.quick}>
              <Button
                label="Confirmation"
                variant="outline"
                small
                style={styles.quickAction}
                onPress={() => run(() => actions.sendConfirmation.mutateAsync(orderId), 'Confirmation sent.')}
              />
              <Button
                label="Receipt"
                variant="outline"
                small
                style={styles.quickAction}
                onPress={() => run(() => actions.sendReceipt.mutateAsync({ id: orderId }), 'Receipt sent.')}
              />
              <Button
                label={emailOpen ? 'Close' : 'Write one'}
                variant="outline"
                small
                style={styles.quickAction}
                onPress={() => setEmailOpen((v) => !v)}
              />
            </View>
            {emailOpen ? (
              <View style={styles.spaced}>
                <Input label="Subject" value={subject} onChangeText={setSubject} />
                <Input label="Message" value={message} onChangeText={setMessage} multiline />
                <Button label="Send" small onPress={sendEmail} loading={actions.sendEmail.isPending} />
              </View>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Details</Text>
            {editing ? (
              <>
                <Input label="First name" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
                <Input label="Last name" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
                <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} autoCapitalize="none" keyboardType="email-address" />
                <Input label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
                <Input
                  label="Date wanted"
                  value={form.neededDate}
                  onChangeText={(v) => setForm({ ...form, neededDate: maskDateInput(v) })}
                  keyboardType="number-pad"
                  placeholder="MM/DD/YYYY"
                />
                <Text style={styles.label}>How</Text>
                <View style={styles.chips}>
                  {FULFILLMENTS.map((f) => (
                    <Pressable key={f} onPress={() => setForm({ ...form, fulfillment: f })} style={[styles.chip, form.fulfillment === f && styles.chipActive]}>
                      <Text style={[styles.chipLabel, form.fulfillment === f && styles.chipLabelActive]}>{f}</Text>
                    </Pressable>
                  ))}
                </View>
                <Input label="Address" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} multiline />
                <Input label="Notes" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />
                <View style={styles.quick}>
                  <Button label="Cancel" variant="outline" small style={styles.quickAction} onPress={() => setEditing(false)} />
                  <Button label="Save" small style={styles.quickAction} onPress={saveEdit} loading={actions.update.isPending} />
                </View>
              </>
            ) : (
              <Button label="Edit the details" variant="outline" small onPress={beginEdit} />
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>This order</Text>
            {order.status === 'pending' ? (
              <View style={styles.quick}>
                <Button
                  label="Accept"
                  variant="olive"
                  small
                  style={styles.quickAction}
                  onPress={() => run(() => actions.respond.mutateAsync({ id: orderId, action: 'accept' }), 'Accepted.')}
                />
                <Button
                  label="Decline"
                  variant="outline"
                  small
                  style={styles.quickAction}
                  onPress={() => run(() => actions.respond.mutateAsync({ id: orderId, action: 'decline' }), 'Declined.')}
                />
              </View>
            ) : null}
            {order.status === 'accepted' ? (
              <Button
                label="Mark it finished"
                variant="olive"
                small
                style={styles.spaced}
                onPress={() => run(() => actions.setStatus.mutateAsync({ id: orderId, status: 'completed' }), 'Marked finished.')}
              />
            ) : null}
            {order.status !== 'cancelled' && order.status !== 'completed' ? (
              <Button
                label="Cancel the order"
                variant="outline"
                small
                style={styles.spaced}
                onPress={() =>
                  Alert.alert('Cancel this order?', 'It stays in the book, marked cancelled.', [
                    { text: 'Keep it', style: 'cancel' },
                    {
                      text: 'Cancel it',
                      style: 'destructive',
                      onPress: () => run(() => actions.setStatus.mutateAsync({ id: orderId, status: 'cancelled' }), 'Cancelled.'),
                    },
                  ])
                }
              />
            ) : null}
            <Button
              label="Delete it entirely"
              variant="danger"
              small
              style={styles.spaced}
              onPress={() =>
                Alert.alert('Delete this order?', 'It goes for good, payments and all.', [
                  { text: 'Keep it', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      if (readOnly) return setStatus({ tone: 'error', message: READ_ONLY_NOTE });
                      try {
                        await actions.remove.mutateAsync(orderId);
                        router.back();
                      } catch (err) {
                        setStatus({ tone: 'error', message: errorMessage(err) });
                      }
                    },
                  },
                ])
              }
            />
          </Card>
        </ScrollView>
      </ContentFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.s5, paddingBottom: spacing.s20 },
  back: { alignSelf: 'flex-start', marginBottom: spacing.s4 },
  backAlone: { margin: spacing.s6 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.s3 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s2 },
  quickAction: { flex: 1, minWidth: 96 },
  card: { marginTop: spacing.s4 },
  cardTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSize.lg, color: colors.text, marginBottom: spacing.s3 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.s4, paddingVertical: spacing.s2, borderBottomWidth: 1, borderBottomColor: colors.divider },
  detailLabel: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textMuted },
  detailValue: { flex: 1, fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.text, textAlign: 'right' },
  item: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.s3, paddingVertical: spacing.s2 },
  itemName: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: fontSize.base, color: colors.text },
  itemPrice: { fontFamily: fonts.displaySemibold, fontSize: fontSize.sm, color: colors.goldRead },
  subtotal: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.s2, fontStyle: 'italic' },
  badgeRow: { marginVertical: spacing.s3 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.s5 },
  payment: { flexDirection: 'row', alignItems: 'center', gap: spacing.s3, paddingVertical: spacing.s2 },
  flex: { flex: 1 },
  paymentAmount: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  paymentMeta: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted },
  remove: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.primary },
  none: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.s4 },
  label: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.textMuted, marginBottom: spacing.s2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s2, marginBottom: spacing.s4 },
  chip: { paddingVertical: spacing.s2, paddingHorizontal: spacing.s3, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontFamily: fonts.displaySemibold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textMuted },
  chipLabelActive: { color: colors.textInverse },
  spaced: { marginTop: spacing.s4 },
});
