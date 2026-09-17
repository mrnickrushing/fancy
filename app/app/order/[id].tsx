import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ordersApi from '../../src/api/orders';
import { Badge } from '../../src/components/Badge';
import { BakePhoto } from '../../src/components/BakePhoto';
import { Button } from '../../src/components/Button';
import { Fold } from '../../src/components/Fold';
import { Input } from '../../src/components/Input';
import { NoticeBanner } from '../../src/components/NoticeBanner';
import { Screen } from '../../src/components/Screen';
import { EmptyState, LoadingState } from '../../src/components/States';
import { errorMessage } from '../../src/api/client';
import { useMenu } from '../../src/hooks/useMenu';
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
import { itemPhoto } from '../../src/utils/photos';
import { balanceDue } from '../../src/utils/payment';
import { nextAct, orderTimeline, type Step, type StepState } from '../../src/utils/timeline';
import { fmtDate, fmtDateTime, fmtMoney, fmtNumericDate, toNumber } from '../../src/utils/format';
import { maskDateInput, toIsoFromMasked } from '../../src/utils/dateInput';
import { colors, fonts, fontSize, radius, spacing } from '../../src/theme';

const FULFILLMENTS: Fulfillment[] = ['pickup', 'delivery', 'shipping'];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'deposit_paid', 'paid', 'refunded'];

const DOT: Record<StepState, { bg: string; border: string; tick: boolean; muted: boolean }> = {
  done: { bg: colors.olive, border: colors.olive, tick: true, muted: false },
  part: { bg: colors.gold, border: colors.gold, tick: false, muted: false },
  todo: { bg: colors.bg, border: colors.border, tick: false, muted: true },
  off: { bg: colors.primary, border: colors.primary, tick: false, muted: false },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function Timeline({ steps }: { steps: Step[] }) {
  return (
    <View style={styles.timeline}>
      <View style={styles.rail} />
      <View style={styles.steps}>
        {steps.map((step) => {
          const dot = DOT[step.state];
          return (
            <View key={step.key} style={styles.step}>
              <View style={[styles.dot, { backgroundColor: dot.bg, borderColor: dot.border }]}>
                {dot.tick ? <Ionicons name="checkmark" size={13} color={colors.surface} /> : null}
              </View>
              <View style={styles.flex}>
                <Text style={[styles.stepTitle, dot.muted && styles.faint]}>{step.title}</Text>
                <Text
                  style={[
                    styles.stepDetail,
                    dot.muted && styles.faint,
                    (step.state === 'part' || step.state === 'off') && styles.owed,
                  ]}
                >
                  {step.detail}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const { data: order, isLoading, isFetching } = useOrder(orderId);
  const { data: menu } = useMenu();
  const actions = useOrderActions();
  const readOnly = useReadOnly();

  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<OrderEditInput & { neededDate?: string }>({});
  const [amount, setAmount] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // An order taken just now lands here while the list is still refetching, so
  // "not here" has to wait until the refetch says so — otherwise the screen
  // Amanda is sent to after writing an order in opens on a missing order.
  if (isLoading || (!order && isFetching)) {
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
  const act = nextAct(order);

  const READ_ONLY_NOTE = 'The App Review account can look, but not change anything.';

  const run = async (fn: () => Promise<unknown>, message: string, retry?: () => Promise<unknown>) => {
    setStatus(null);
    if (readOnly) return setStatus({ tone: 'error', message: READ_ONLY_NOTE });
    try {
      await fn();
      setStatus({ tone: 'success', message });
    } catch (err) {
      // A gift order refuses to email the address on it. Offer the override
      // rather than showing her a wall she cannot get past at the market.
      if (retry && ordersApi.isGiftRefusal(err)) {
        Alert.alert('This order is a gift', `${errorMessage(err)}\n\nSend it anyway?`, [
          { text: 'Keep the surprise', style: 'cancel' },
          {
            text: 'Send anyway',
            style: 'destructive',
            onPress: async () => {
              try {
                await retry();
                setStatus({ tone: 'success', message });
              } catch (e) {
                setStatus({ tone: 'error', message: errorMessage(e) });
              }
            },
          },
        ]);
        return;
      }
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
    setPayOpen(false);
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

  // The rest of the money panel is a fold below; the one act just opens it and
  // points at the field, so there is a single place a payment is recorded.
  const doAct = () => {
    if (act === 'accept') {
      return run(() => actions.respond.mutateAsync({ id: orderId, action: 'accept' }), 'Accepted.');
    }
    if (act === 'payment') {
      setPayOpen(true);
      // Owed in full is the usual case, so the field opens already filled in.
      if (!payAmount && owed !== null && owed > 0) setPayAmount(owed.toFixed(2));
      return undefined;
    }
    if (act === 'handover') {
      return run(() => actions.setStatus.mutateAsync({ id: orderId, status: 'completed' }), 'Marked handed over.');
    }
    return undefined;
  };

  const ACT_LABEL: Record<'accept' | 'payment' | 'handover', string> = {
    accept: 'Accept this order',
    payment: 'Record a payment',
    handover: 'Mark handed over',
  };

  return (
    <Screen header={false} bleed>
      <View style={[styles.bar, { paddingTop: insets.top + spacing.s3 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>Order #{order.id}</Text>
          <Text style={styles.barTitle} numberOfLines={1}>
            {order.first_name} {order.last_name}
          </Text>
        </View>
        <Badge status={order.status} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {status ? <NoticeBanner tone={status.tone} message={status.message} /> : null}

        {order.is_gift ? (
          <View style={styles.gift}>
            <Text style={styles.giftTitle}>A gift</Text>
            <Text style={styles.giftText}>
              Nothing has been emailed to {order.email || 'the address on this order'} — it may
              belong to whoever the bread is for. Talk to the buyer instead.
            </Text>
            <Button
              label="No longer a surprise"
              variant="outline"
              small
              onPress={() => run(
                () => actions.update.mutateAsync({ id: orderId, patch: { isGift: false } }),
                'Emails go out as usual now.',
              )}
            />
          </View>
        ) : null}

        <Timeline steps={orderTimeline(order)} />

        <View>
          <Text style={styles.heading}>The order</Text>
          <View style={styles.panel}>
            {order.items.map((item) => (
              <View key={item.id} style={styles.item}>
                <BakePhoto uri={itemPhoto(item, menu?.items)} size={48} />
                <View style={styles.flex}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} ×{' '}
                    {item.unit_price === null ? 'on request' : fmtMoney(item.unit_price)}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  {item.unit_price === null ? '—' : fmtMoney(toNumber(item.unit_price) * item.quantity)}
                </Text>
              </View>
            ))}
            {shipping > 0 ? (
              <View style={styles.item}>
                <View style={styles.shippingMark}>
                  <Ionicons name="cube-outline" size={20} color={colors.textMuted} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.itemName}>Shipping</Text>
                </View>
                <Text style={styles.itemPrice}>{fmtMoney(shipping)}</Text>
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{fmtMoney(order.amount)}</Text>
            </View>
          </View>
          {subtotal !== null && !autoTotal ? (
            <Text style={styles.aside}>
              The bill of fare{shipping > 0 ? ' and shipping come' : ' adds up'} to {fmtMoney(subtotal + shipping)}.
            </Text>
          ) : null}
        </View>

        {act ? (
          <View style={styles.acts}>
            <Button
              label={ACT_LABEL[act]}
              variant="olive"
              onPress={doAct}
              loading={actions.respond.isPending || actions.setStatus.isPending}
            />
            <View style={styles.actRow}>
              {act === 'accept' ? (
                <Button
                  label="Decline"
                  variant="outline"
                  small
                  style={styles.flex}
                  onPress={() =>
                    Alert.alert('Decline this order?', 'They are told, and it stays in the book.', [
                      { text: 'Keep it', style: 'cancel' },
                      {
                        text: 'Decline',
                        style: 'destructive',
                        onPress: () => run(() => actions.respond.mutateAsync({ id: orderId, action: 'decline' }), 'Declined.'),
                      },
                    ])
                  }
                />
              ) : (
                <Button
                  label="Send a receipt"
                  variant="outline"
                  small
                  style={styles.flex}
                  onPress={() => run(
                    () => actions.sendReceipt.mutateAsync({ id: orderId }),
                    'Receipt sent.',
                    () => actions.sendReceipt.mutateAsync({ id: orderId, sendAnyway: true }),
                  )}
                />
              )}
              {act === 'payment' ? (
                <Button
                  label="Mark handed over"
                  variant="outline"
                  small
                  style={styles.flex}
                  onPress={() => run(() => actions.setStatus.mutateAsync({ id: orderId, status: 'completed' }), 'Marked handed over.')}
                />
              ) : (
                <Button label="Edit the order" variant="outline" small style={styles.flex} onPress={beginEdit} />
              )}
            </View>
          </View>
        ) : null}

        {/* Reaching the customer is the thing Amanda does most after the act
            above, so it stays in the open. */}
        {order.email || order.phone ? (
          <View style={styles.actRow}>
            {order.email ? (
              <Button label="Email" variant="outline" small style={styles.flex} onPress={() => Linking.openURL(`mailto:${order.email}`)} />
            ) : null}
            {order.phone ? (
              <>
                <Button label="Call" variant="outline" small style={styles.flex} onPress={() => Linking.openURL(`tel:${order.phone}`)} />
                <Button label="Text" variant="outline" small style={styles.flex} onPress={() => Linking.openURL(`sms:${order.phone}`)} />
              </>
            ) : null}
          </View>
        ) : null}

        <Fold title="Money" open={payOpen}>
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
        </Fold>

        <Fold title="Send them something">
          <View style={styles.actRow}>
            <Button
              label="Confirmation"
              variant="outline"
              small
              style={styles.flex}
              onPress={() => run(
                () => actions.sendConfirmation.mutateAsync({ id: orderId }),
                'Confirmation sent.',
                () => actions.sendConfirmation.mutateAsync({ id: orderId, sendAnyway: true }),
              )}
            />
            <Button
              label="Receipt"
              variant="outline"
              small
              style={styles.flex}
              onPress={() => run(
                () => actions.sendReceipt.mutateAsync({ id: orderId }),
                'Receipt sent.',
                () => actions.sendReceipt.mutateAsync({ id: orderId, sendAnyway: true }),
              )}
            />
            <Button
              label={emailOpen ? 'Close' : 'Write one'}
              variant="outline"
              small
              style={styles.flex}
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
        </Fold>

        <Fold title="Details" open={editing}>
          <Row label="Wanted" value={fmtDate(order.needed_date)} />
          <Row label="How" value={FULFILLMENT_LABELS[order.fulfillment]} />
          {order.address ? <Row label="Address" value={order.address} /> : null}
          {order.email ? <Row label="Email" value={order.email} /> : null}
          {order.phone ? <Row label="Phone" value={order.phone} /> : null}
          <Row label="Came in" value={fmtDateTime(order.created_at)} />
          <Row label="From" value={order.source === 'manual' ? 'Written in by you' : 'The website'} />
          {order.notes ? <Row label="Notes" value={order.notes} /> : null}

          {editing ? (
            <View style={styles.spaced}>
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
              <View style={styles.actRow}>
                <Button label="Cancel" variant="outline" small style={styles.flex} onPress={() => setEditing(false)} />
                <Button label="Save" small style={styles.flex} onPress={saveEdit} loading={actions.update.isPending} />
              </View>
            </View>
          ) : (
            <Button label="Edit the details" variant="outline" small onPress={beginEdit} style={styles.spaced} />
          )}
        </Fold>

        <Fold title="This order">
          {order.status === 'pending' ? (
            <View style={styles.actRow}>
              <Button
                label="Accept"
                variant="olive"
                small
                style={styles.flex}
                onPress={() => run(() => actions.respond.mutateAsync({ id: orderId, action: 'accept' }), 'Accepted.')}
              />
              <Button
                label="Decline"
                variant="outline"
                small
                style={styles.flex}
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
        </Fold>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.s5, paddingBottom: spacing.s20, gap: 18 },
  backAlone: { margin: spacing.s6 },

  bar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingHorizontal: spacing.s5,
    paddingBottom: spacing.s3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  eyebrow: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.olive },
  barTitle: { fontFamily: fonts.displaySemibold, fontSize: 22, color: colors.text },

  timeline: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 18,
    gap: 14,
  },
  rail: { width: 2, backgroundColor: colors.divider, marginVertical: 6 },
  steps: { flex: 1, gap: 18 },
  step: { flexDirection: 'row', gap: spacing.s3, marginLeft: -21 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontFamily: fonts.displaySemibold, fontSize: 16, color: colors.text },
  stepDetail: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textMuted },
  faint: { color: colors.textFaint },
  owed: { color: colors.primary },

  gift: {
    backgroundColor: colors.olivePale,
    borderWidth: 1,
    borderColor: colors.olive,
    borderRadius: radius.md,
    padding: 18,
    gap: spacing.s3,
    alignItems: 'flex-start',
  },
  giftTitle: { fontFamily: fonts.displaySemibold, fontSize: 18, color: colors.oliveDeep },
  giftText: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 21, color: colors.oliveDeep },

  heading: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.olive,
    marginBottom: spacing.s2,
  },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    padding: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  shippingMark: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceOffset,
    borderRadius: radius.sm,
  },
  itemName: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, lineHeight: 20, color: colors.text },
  itemMeta: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted },
  itemPrice: { fontFamily: fonts.displaySemibold, fontSize: fontSize.sm, color: colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.s3,
    backgroundColor: colors.surfaceOffset,
  },
  totalLabel: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.textMuted },
  totalValue: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  aside: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.s2, fontStyle: 'italic' },

  acts: { gap: spacing.s2 },
  actRow: { flexDirection: 'row', gap: spacing.s2 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.s4, paddingVertical: spacing.s2, borderBottomWidth: 1, borderBottomColor: colors.divider },
  detailLabel: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textMuted },
  detailValue: { flex: 1, fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.text, textAlign: 'right' },
  badgeRow: { marginVertical: spacing.s3 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.s5 },
  payment: { flexDirection: 'row', alignItems: 'center', gap: spacing.s3, paddingVertical: spacing.s2 },
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
