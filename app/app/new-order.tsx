import { useMemo, useState } from 'react';
import {
  Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BakePhoto } from '../src/components/BakePhoto';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { NoticeBanner } from '../src/components/NoticeBanner';
import { Screen } from '../src/components/Screen';
import { Stepper } from '../src/components/Stepper';
import { LoadingState } from '../src/components/States';
import { errorMessage } from '../src/api/client';
import { useMenu } from '../src/hooks/useMenu';
import { useOrderActions } from '../src/hooks/useOrders';
import { useBlocks, useCustomers, useSettings } from '../src/hooks/useResources';
import { COURSE_LABELS, COURSE_ORDER, type Course, type Customer, type Fulfillment, type MenuItem } from '../src/api/types';
import { earliestDate, nextMarketDays } from '../src/utils/marketDays';
import { spellCount } from '../src/utils/today';
import { photoUrl } from '../src/utils/photos';
import { fmtDate, fmtMoney, toIsoDate, toNumber } from '../src/utils/format';
import { colors, fonts, fontSize, radius, shadow, spacing } from '../src/theme';

const FULFILLMENTS: { key: Fulfillment; label: string }[] = [
  { key: 'pickup', label: 'Market pickup' },
  { key: 'delivery', label: 'Local delivery' },
  { key: 'shipping', label: 'Shipping' },
];

// The tab bar's five labels have to fit, so the fare's own chips abbreviate
// the one course whose name is a sentence.
const COURSE_CHIP: Partial<Record<Course, string>> = { small: 'Muffins', art: 'Art' };

type Step = 'fare' | 'who';

export default function NewOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: menu, isLoading } = useMenu();
  const { data: settingsData } = useSettings();
  const { data: blocks } = useBlocks();
  const { data: customers } = useCustomers();
  const { create } = useOrderActions();

  const [step, setStep] = useState<Step>('fare');
  const [course, setCourse] = useState<Course | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [picked, setPicked] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [writeIn, setWriteIn] = useState(false);

  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup');
  const [neededDate, setNeededDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = toIsoDate(new Date());
  const items = menu?.items ?? [];
  const minNotice = Math.max(0, Math.round(toNumber(settingsData?.settings.min_notice_days)));

  // Amanda can write in anything on the bill of fare, including bakes that
  // are switched off for the website this week.
  const courses = useMemo(
    () => COURSE_ORDER.filter((c) => items.some((i) => i.course === c)),
    [items],
  );
  const activeCourse = course && courses.includes(course) ? course : courses[0];
  const shown = useMemo(() => items.filter((i) => i.course === activeCourse), [items, activeCourse]);

  const chosen = useMemo(
    () => Object.entries(quantities).filter(([, q]) => q > 0).map(([id, q]) => ({ id: Number(id), quantity: q })),
    [quantities],
  );
  const basketCount = chosen.reduce((n, c) => n + c.quantity, 0);

  // Flat, and only on shipping — the same rule the server applies when it
  // snapshots the fee onto the order, so the figure here is the figure it
  // will actually be charged.
  const shippingFee = fulfillment === 'shipping' ? toNumber(settingsData?.settings.shipping_fee) : 0;
  const itemsTotal = useMemo(() => {
    let sum = 0;
    for (const { id, quantity } of chosen) {
      const item = items.find((i) => i.id === id);
      if (item?.price) sum += toNumber(item.price) * quantity;
    }
    return sum;
  }, [chosen, items]);
  const total = itemsTotal + shippingFee;

  const marketDays = useMemo(
    () => nextMarketDays(today, minNotice, blocks ?? []),
    [today, minNotice, blocks],
  );

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || picked) return [];
    return (customers ?? [])
      .filter((c) =>
        `${c.first_name} ${c.last_name} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase().includes(q),
      )
      .slice(0, 4);
  }, [customers, search, picked]);

  const setQty = (id: number, next: number) => setQuantities((q) => ({ ...q, [id]: next }));

  const choose = (customer: Customer) => {
    setPicked(customer);
    setFirstName(customer.first_name);
    setLastName(customer.last_name);
    setEmail(customer.email ?? '');
    setPhone(customer.phone ?? '');
    setWriteIn(false);
    setSearch('');
  };

  const startOver = () => {
    setPicked(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
  };

  const onPickDate = (event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (value) setNeededDate(toIsoDate(value));
  };

  const submit = async () => {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) return setError('A first and last name, please.');
    if (!email.trim() && !phone.trim()) return setError('An email address or a phone number is required.');
    if (!neededDate) return setError('Which day do they want it?');
    if (fulfillment !== 'pickup' && !address.trim()) return setError('Delivery and shipping need an address.');
    if (!chosen.length) return setError('Add at least one bake.');

    try {
      const order = await create.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        fulfillment,
        neededDate,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        items: chosen,
      });
      // Step three is the order itself. The reviewer account never gets one
      // back, so it lands on the book instead of on a page that is not there.
      if (order?.id) router.replace(`/order/${order.id}`);
      else router.replace({ pathname: '/(tabs)/orders', params: { created: '1' } });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const back = () => (step === 'who' ? setStep('fare') : router.back());

  return (
    <Screen header={false} bleed>
      <View style={[styles.bar, { paddingTop: insets.top + spacing.s3 }]}>
        <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>Taken in person · step {step === 'fare' ? 1 : 2} of 3</Text>
          <Text style={styles.barTitle}>{step === 'fare' ? 'What they want' : 'Who and when'}</Text>
        </View>
      </View>

      {step === 'fare' ? (
        <>
          <View style={styles.chipBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {courses.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCourse(c)}
                  style={[styles.chip, c === activeCourse && styles.chipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: c === activeCourse }}
                >
                  <Text style={[styles.chipLabel, c === activeCourse && styles.chipLabelOn]}>
                    {COURSE_CHIP[c] ?? COURSE_LABELS[c]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.fare}>
            {isLoading ? <LoadingState message="Reading the bill of fare…" /> : null}
            {shown.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSheetItem(item)}
                style={({ pressed }) => [styles.fareRow, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, what is in it`}
              >
                <BakePhoto uri={photoUrl(item.image)} size={74} />
                <View style={styles.flex}>
                  <Text style={styles.fareName}>{item.name}</Text>
                  {item.available ? (
                    item.description ? <Text style={styles.fareDesc} numberOfLines={2}>{item.description}</Text> : null
                  ) : (
                    <Text style={styles.fareOff}>Off the website just now — you can still write it in.</Text>
                  )}
                  <Text style={styles.farePrice}>{item.price === null ? 'On request' : fmtMoney(item.price)}</Text>
                </View>
                <Stepper value={quantities[item.id] ?? 0} onChange={(n) => setQty(item.id, n)} />
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {error ? <NoticeBanner tone="error" message={error} /> : null}

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Who</Text>
            {picked ? (
              <Pressable onPress={startOver} style={styles.chosen} accessibilityRole="button" accessibilityLabel="Choose somebody else">
                <View style={styles.flex}>
                  <Text style={styles.chosenName}>{picked.first_name} {picked.last_name}</Text>
                  <Text style={styles.chosenMeta}>
                    {picked.order_count} order{picked.order_count === 1 ? '' : 's'} · last one{' '}
                    {fmtDate(picked.last_order_at)}
                    {picked.email ? ` · ${picked.email}` : ''}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={colors.oliveDeep} />
              </Pressable>
            ) : (
              <>
                <Input
                  placeholder="Search a name she has served before"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="words"
                  containerStyle={styles.tight}
                />
                {matches.map((c) => (
                  <Pressable key={c.customer_key} onPress={() => choose(c)} style={styles.match} accessibilityRole="button">
                    <View style={styles.flex}>
                      <Text style={styles.matchName}>{c.first_name} {c.last_name}</Text>
                      <Text style={styles.matchMeta}>
                        {c.order_count} order{c.order_count === 1 ? '' : 's'}
                        {c.email ? ` · ${c.email}` : c.phone ? ` · ${c.phone}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                  </Pressable>
                ))}
              </>
            )}

            {!picked && !writeIn ? (
              <Text style={styles.aside}>
                Or{' '}
                <Text style={styles.link} onPress={() => setWriteIn(true)}>
                  write in someone new
                </Text>
                .
              </Text>
            ) : null}

            {writeIn || picked ? (
              <View style={styles.writeIn}>
                <Input label="First name" value={firstName} onChangeText={setFirstName} />
                <Input label="Last name" value={lastName} onChangeText={setLastName} />
                <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" containerStyle={styles.tight} />
                {email.trim() ? (
                  <Text style={styles.aside}>They get the thank-you straight away.</Text>
                ) : (
                  <Text style={styles.aside}>Without an email there is nothing to send them — a phone number is enough for the book.</Text>
                )}
              </View>
            ) : null}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>How</Text>
            <View style={styles.howRow}>
              {FULFILLMENTS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFulfillment(f.key)}
                  style={[styles.how, fulfillment === f.key && styles.howOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: fulfillment === f.key }}
                >
                  <Text style={[styles.howLabel, fulfillment === f.key && styles.howLabelOn]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>

            {fulfillment === 'pickup' ? (
              <View style={styles.note}>
                <Ionicons name="location-outline" size={20} color={colors.olive} />
                <View style={styles.flex}>
                  <Text style={styles.noteTitle}>Brookings-Harbor Farmers Market</Text>
                  <Text style={styles.noteBody}>
                    {settingsData?.settings.pickup_note?.trim() || 'Come Wednesday. Come Saturday. Come early.'}
                  </Text>
                </View>
              </View>
            ) : (
              <Input label="Address" value={address} onChangeText={setAddress} multiline />
            )}
            {shippingFee > 0 ? (
              <Text style={styles.aside}>Shipping adds a flat {fmtMoney(shippingFee)} to the total.</Text>
            ) : null}

            <Text style={styles.label}>Date wanted</Text>
            <View style={styles.dateRow}>
              {marketDays.map((d) => {
                const on = neededDate === d;
                const when = new Date(`${d}T12:00:00`);
                return (
                  <Pressable
                    key={d}
                    onPress={() => setNeededDate(d)}
                    style={[styles.date, on && styles.dateOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.dateDay, on && styles.dateOnText]}>
                      {when.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text style={[styles.dateNum, on && styles.dateOnText]}>
                      {when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setShowPicker(true)}
                style={[styles.date, !!neededDate && !marketDays.includes(neededDate) && styles.dateOn]}
                accessibilityRole="button"
                accessibilityLabel="Pick another day"
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={neededDate && !marketDays.includes(neededDate) ? colors.primaryActive : colors.textMuted}
                />
                <Text style={[styles.dateDay, !!neededDate && !marketDays.includes(neededDate) && styles.dateOnText]}>
                  {neededDate && !marketDays.includes(neededDate)
                    ? new Date(`${neededDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Pick'}
                </Text>
              </Pressable>
            </View>
            {showPicker ? (
              <DateTimePicker
                value={new Date(`${neededDate || earliestDate(today, minNotice)}T12:00:00`)}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                onChange={onPickDate}
              />
            ) : null}
            {showPicker && Platform.OS === 'ios' ? (
              <Button label="Done" variant="outline" small onPress={() => setShowPicker(false)} style={styles.pickerDone} />
            ) : null}

            <Text style={styles.label}>Notes</Text>
            <Input value={notes} onChangeText={setNotes} multiline placeholder="Anything they asked for" containerStyle={styles.tight} />
          </View>

          <NoticeBanner message="Market days are not enforced here — you know what you agreed to." />
        </ScrollView>
      )}

      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, spacing.s5) }]}>
        <View style={styles.dockLine}>
          <Text style={styles.dockCount}>
            {step === 'who' && (firstName.trim() || lastName.trim())
              ? `${basketCount} item${basketCount === 1 ? '' : 's'} · ${firstName} ${lastName}`.trim()
              : `${basketCount} item${basketCount === 1 ? '' : 's'} in the basket`}
          </Text>
          <Text style={styles.dockTotal}>{fmtMoney(total)}</Text>
        </View>
        {step === 'fare' ? (
          <Button label="Who and when" onPress={() => setStep('who')} disabled={!basketCount} />
        ) : (
          <Button label="Put it in the book" onPress={submit} loading={create.isPending} />
        )}
      </View>

      <ItemSheet
        item={sheetItem}
        quantity={sheetItem ? quantities[sheetItem.id] ?? 0 : 0}
        minNotice={minNotice}
        today={today}
        onChange={(n) => sheetItem && setQty(sheetItem.id, n)}
        onClose={() => setSheetItem(null)}
      />
    </Screen>
  );
}

function ItemSheet({
  item, quantity, minNotice, today, onChange, onClose,
}: {
  item: MenuItem | null;
  quantity: number;
  minNotice: number;
  today: string;
  onChange: (next: number) => void;
  onClose: () => void;
}) {
  const price = item?.price === null || item?.price === undefined ? null : toNumber(item.price);
  const line = price === null ? null : price * Math.max(quantity, 1);
  return (
    <Modal visible={!!item} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={sheet.backdrop} onPress={onClose} accessibilityLabel="Close" />
      {item ? (
        <View style={sheet.panel}>
          <View style={sheet.photoWrap}>
            {item.image ? (
              <Image source={{ uri: photoUrl(item.image) as string }} style={sheet.photo} resizeMode="cover" />
            ) : (
              <View style={[sheet.photo, sheet.photoBlank]} />
            )}
            <Pressable onPress={onClose} style={sheet.close} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={colors.surface} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={sheet.body}>
            <Text style={sheet.course}>{COURSE_LABELS[item.course]}</Text>
            <Text style={sheet.name}>{item.name}</Text>
            {item.description ? <Text style={sheet.desc}>{item.description}</Text> : null}

            <View style={sheet.priceRow}>
              <View>
                <Text style={sheet.priceLabel}>Price</Text>
                <Text style={sheet.price}>{price === null ? 'On request' : fmtMoney(price)}</Text>
              </View>
              <Stepper value={quantity} onChange={onChange} size={40} />
            </View>

            {minNotice > 0 ? (
              <View style={sheet.notice}>
                <Text style={sheet.noticeText}>
                  {spellCount(minNotice)} day{minNotice === 1 ? '' : 's'}' notice, so the earliest you can promise this
                  is <Text style={sheet.noticeStrong}>{fmtDate(earliestDate(today, minNotice))}</Text>.
                </Text>
              </View>
            ) : null}

            <Button
              label={quantity > 0 ? `In the order${line === null ? '' : ` · ${fmtMoney(line)}`}` : `Add to the order${price === null ? '' : ` · ${fmtMoney(price)}`}`}
              onPress={() => {
                if (quantity === 0) onChange(1);
                onClose();
              }}
            />
            {!item.available ? (
              <View style={sheet.off}>
                <Text style={sheet.offText}>Off the website this week</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { backgroundColor: colors.surfaceOffset },
  tight: { marginBottom: 0 },

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

  chipBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
  chips: { paddingHorizontal: spacing.s5, paddingBottom: spacing.s3, gap: spacing.s2 },
  chip: { paddingVertical: 7, paddingHorizontal: 11, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontFamily: fonts.displaySemibold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textMuted },
  chipLabelOn: { color: colors.textInverse },

  fare: { padding: spacing.s4, paddingHorizontal: spacing.s5, gap: spacing.s3 },
  fareRow: {
    flexDirection: 'row',
    gap: spacing.s3,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.s3,
  },
  fareName: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, lineHeight: 21, color: colors.text },
  fareDesc: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, lineHeight: 18, color: colors.textMuted },
  fareOff: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, lineHeight: 18, color: colors.primary },
  farePrice: { fontFamily: fonts.displaySemibold, fontSize: fontSize.sm, color: colors.goldRead, marginTop: 3 },

  form: { padding: spacing.s5, gap: 18, paddingBottom: spacing.s6 },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.s4,
    gap: spacing.s3,
  },
  panelTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSize.lg, color: colors.text },
  label: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.textMuted },
  aside: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  writeIn: { marginTop: spacing.s1 },

  chosen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    borderWidth: 1,
    borderColor: colors.olive,
    backgroundColor: colors.olivePale,
    borderRadius: radius.sm,
    padding: spacing.s3,
  },
  chosenName: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.oliveDeep },
  chosenMeta: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.olive },
  match: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.s3,
  },
  matchName: { fontFamily: fonts.displaySemibold, fontSize: fontSize.sm, color: colors.text },
  matchMeta: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted },

  howRow: { flexDirection: 'row', gap: spacing.s2 },
  how: { flex: 1, paddingVertical: 11, paddingHorizontal: spacing.s2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, alignItems: 'center' },
  howOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  howLabel: { fontFamily: fonts.displaySemibold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.textMuted, textAlign: 'center' },
  howLabelOn: { color: colors.textInverse },

  note: {
    flexDirection: 'row',
    gap: spacing.s3,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceOffset,
    borderRadius: radius.sm,
    padding: 14,
  },
  noteTitle: { fontFamily: fonts.displaySemibold, fontSize: fontSize.sm, color: colors.text },
  noteBody: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 20, color: colors.textMuted },

  dateRow: { flexDirection: 'row', gap: spacing.s2 },
  date: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.s2,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  dateOn: { borderColor: colors.primary, backgroundColor: colors.primaryHighlight },
  dateDay: { fontFamily: fonts.displaySemibold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textMuted },
  dateNum: { fontFamily: fonts.displaySemibold, fontSize: fontSize.lg, color: colors.text },
  dateOnText: { color: colors.primaryActive },
  pickerDone: { alignSelf: 'flex-end' },

  dock: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    paddingHorizontal: spacing.s5,
    ...shadow.md,
  },
  dockLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: spacing.s3 },
  dockCount: { flex: 1, fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.textMuted },
  dockTotal: { fontFamily: fonts.displaySemibold, fontSize: fontSize.lg, color: colors.text },
});

const sheet = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  panel: {
    marginTop: 'auto',
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  photoWrap: { height: 270 },
  photo: { width: '100%', height: '100%' },
  photoBlank: { backgroundColor: colors.surfaceOffset },
  close: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(42,11,11,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.s5, gap: spacing.s4, paddingBottom: spacing.s10 },
  course: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.olive },
  name: { fontFamily: fonts.displaySemibold, fontSize: 28, lineHeight: 32, color: colors.text, marginTop: -spacing.s3 },
  desc: { fontFamily: fonts.bodyRegular, fontSize: fontSize.base, lineHeight: 26, color: colors.textMuted, marginTop: -spacing.s3 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 14,
  },
  priceLabel: { fontFamily: fonts.displaySemibold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.textMuted },
  price: { fontFamily: fonts.displaySemibold, fontSize: 24, color: colors.text },
  notice: { backgroundColor: colors.goldPale, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 14 },
  noticeText: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, lineHeight: 21, color: colors.text },
  noticeStrong: { fontFamily: fonts.bodySemibold },
  off: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  offText: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.textMuted },
});
