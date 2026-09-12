import { useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../../src/components/Badge';
import { BakePhoto } from '../../src/components/BakePhoto';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Logo } from '../../src/components/Logo';
import { Screen } from '../../src/components/Screen';
import { Scrim } from '../../src/components/Scrim';
import { SectionTitle } from '../../src/components/SectionTitle';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/States';
import { errorMessage } from '../../src/api/client';
import { useMenu } from '../../src/hooks/useMenu';
import { useOrders } from '../../src/hooks/useOrders';
import { FULFILLMENT_SHORT } from '../../src/api/types';
import type { Order } from '../../src/api/types';
import { itemCount } from '../../src/utils/orders';
import { balanceDue } from '../../src/utils/payment';
import { itemPhoto, photoUrl } from '../../src/utils/photos';
import { benchBake, spellCount } from '../../src/utils/today';
import { fmtDate, fmtMoney, toIsoDate, toNumber } from '../../src/utils/format';
import { colors, fonts, fontSize, radius, spacing } from '../../src/theme';

const HERO_HEIGHT = 330;
// Shown only before the first order is in the book, so the screen still opens
// on a photograph rather than a hole.
const HERO_FALLBACK = require('../../assets/logo.webp');

function daysUntil(iso: string, today: string): number {
  const a = new Date(`${today}T12:00:00`).getTime();
  const b = new Date(`${iso.slice(0, 10)}T12:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

function Figure({ label, value, last = false }: { label: string; value: string | number; last?: boolean }) {
  return (
    <View style={[styles.figure, !last && styles.figureRule]}>
      <Text style={styles.figureValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.figureLabel}>{label}</Text>
    </View>
  );
}

function NeedsRow({
  order, photo, owed, onPress,
}: { order: Order; photo: string | null; owed: number | null; onPress: () => void }) {
  const n = itemCount(order);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.needsRow, pressed && styles.pressed]}>
      <BakePhoto uri={photo} size={62} />
      <View style={styles.needsBody}>
        <Text style={styles.needsName} numberOfLines={1}>
          {order.first_name} {order.last_name}
        </Text>
        {owed !== null && owed > 0 && order.status !== 'pending' ? (
          <Text style={styles.needsOwed}>{fmtMoney(owed)} still owed</Text>
        ) : (
          <Text style={styles.needsMeta}>
            {fmtDate(order.needed_date)} · {FULFILLMENT_SHORT[order.fulfillment]}
            {'\n'}
            {order.items.map((i) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ') ||
              `${n} item${n === 1 ? '' : 's'}`}
          </Text>
        )}
      </View>
      {order.status === 'pending' ? <Badge status="pending" /> : null}
    </Pressable>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch, isRefetching } = useOrders();
  const menu = useMenu();
  const [refreshing, setRefreshing] = useState(false);

  const view = useMemo(() => {
    const orders = data ?? [];
    const today = toIsoDate(new Date());
    const pending = orders.filter((o) => o.status === 'pending');
    const dueToday = orders.filter(
      (o) => o.needed_date.slice(0, 10) === today && o.status !== 'cancelled' && o.status !== 'declined',
    );

    // What is actually outstanding, across every order Amanda has agreed to
    // bake. An unpriced order contributes nothing rather than reading as free.
    const accepted = orders.filter((o) => o.status === 'accepted');
    const owed = accepted.reduce((sum, o) => sum + (balanceDue(o.paid_amount, o.amount, o.payment_status) ?? 0), 0);

    const attention = [
      ...pending,
      ...accepted.filter((o) => (balanceDue(o.paid_amount, o.amount, o.payment_status) ?? 0) > 0),
    ].slice(0, 6);

    const upcoming = accepted
      .filter((o) => {
        const d = daysUntil(o.needed_date, today);
        return d >= 0 && d <= 30;
      })
      .sort((a, b) => a.needed_date.localeCompare(b.needed_date));

    return { today, orders, pending, accepted, dueToday, owed, attention, upcoming, bench: benchBake(orders, today) };
  }, [data]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const items = menu.data?.items;
  const bench = view.bench;
  const heroUri = bench ? itemPhoto(bench.item, items) : null;
  // Found the same way the photograph is: by id, then by name, because a bake
  // taken off the menu still has orders pointing at it.
  const benchItem = bench
    ? items?.find((m) => m.id === bench.item.menu_item_id) ?? items?.find((m) => m.name === bench.item.name)
    : undefined;
  const eyebrow = !bench
    ? 'The order book'
    : bench.isToday
      ? 'On the bench today'
      : `Next on the bench · ${fmtDate(bench.date)}`;
  const headline = bench
    ? `${bench.item.name}, ${spellCount(bench.quantity)} to ${benchItem?.course === 'art' ? 'paint' : 'bake'}`
    : 'Nothing in the book yet';

  return (
    <Screen header={false} bleed>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing || isRefetching} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.hero}>
          <Image
            source={heroUri ? { uri: heroUri } : HERO_FALLBACK}
            style={[StyleSheet.absoluteFill, !heroUri && styles.heroFallback]}
            resizeMode={heroUri ? 'cover' : 'contain'}
            accessibilityLabel={bench ? bench.item.name : 'Oh! You Fancy Focaccia'}
          />
          <Scrim />
          <View style={[styles.heroHead, { top: insets.top + spacing.s3 }]}>
            <Logo size={32} inverse />
            <Pressable
              onPress={() => router.push('/(tabs)/more')}
              accessibilityRole="button"
              accessibilityLabel="Notifications and the rest of the app"
              hitSlop={12}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.bg} />
            </Pressable>
          </View>
          <View style={styles.heroFoot}>
            <Text style={styles.heroEyebrow}>{eyebrow}</Text>
            <Text style={styles.heroTitle}>{headline}</Text>
          </View>
        </View>

        <View style={styles.figures}>
          <Figure label="Awaiting" value={view.pending.length} />
          <Figure label="Today" value={view.dueToday.length} />
          <Figure label="Owed" value={fmtMoney(view.owed)} last />
        </View>

        <View style={styles.body}>
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={refetch} />
          ) : (
            <>
              <Button label="Take an order" onPress={() => router.push('/new-order')} />

              <Text style={styles.heading}>Needs you</Text>
              {view.attention.length ? (
                view.attention.map((o) => (
                  <NeedsRow
                    key={o.id}
                    order={o}
                    photo={o.items[0] ? itemPhoto(o.items[0], items) : null}
                    owed={balanceDue(o.paid_amount, o.amount, o.payment_status)}
                    onPress={() => router.push(`/order/${o.id}`)}
                  />
                ))
              ) : (
                <EmptyState title="Nothing is waiting" message="Every request has an answer and every total is settled." />
              )}

              <Text style={styles.heading}>The next thirty days</Text>
              {view.upcoming.length ? (
                <Card style={styles.list}>
                  {view.upcoming.map((o) => {
                    const d = daysUntil(o.needed_date, view.today);
                    return (
                      <Pressable
                        key={o.id}
                        onPress={() => router.push(`/order/${o.id}`)}
                        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                      >
                        <View style={styles.rowHead}>
                          <Text style={styles.rowName} numberOfLines={1}>
                            {o.first_name} {o.last_name}
                          </Text>
                          <Text style={styles.countdown}>{d === 0 ? 'Today' : `In ${d} day${d === 1 ? '' : 's'}`}</Text>
                        </View>
                        <Text style={styles.rowMeta}>
                          {fmtDate(o.needed_date)} · {itemCount(o)} item{itemCount(o) === 1 ? '' : 's'} ·{' '}
                          {fmtMoney(o.amount ?? toNumber(o.amount))}
                        </Text>
                      </Pressable>
                    );
                  })}
                </Card>
              ) : (
                <EmptyState title="The month ahead is clear" />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.s16 },

  hero: { height: HERO_HEIGHT, backgroundColor: colors.primaryInk },
  heroFallback: { opacity: 0.35 },
  heroHead: {
    position: 'absolute',
    left: spacing.s5,
    right: spacing.s5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s3,
  },
  heroFoot: { position: 'absolute', left: spacing.s5, right: spacing.s5, bottom: 18 },
  heroEyebrow: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.goldPale,
  },
  heroTitle: { fontFamily: fonts.displaySemibold, fontSize: 30, lineHeight: 34, color: '#FBF8EF', marginTop: 3 },

  figures: { flexDirection: 'row', backgroundColor: colors.primaryActive, paddingVertical: 14 },
  figure: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.s1 },
  figureRule: { borderRightWidth: 1, borderRightColor: 'rgba(244,239,226,0.22)' },
  figureValue: { fontFamily: fonts.displaySemibold, fontSize: 24, color: colors.goldPale },
  figureLabel: {
    fontFamily: fonts.displaySemibold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(244,239,226,0.75)',
  },

  body: { padding: spacing.s5, paddingTop: 18, gap: 14 },
  heading: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.olive,
    marginTop: spacing.s2,
  },

  needsRow: {
    flexDirection: 'row',
    gap: spacing.s3,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.s3,
  },
  needsBody: { flex: 1 },
  needsName: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  needsMeta: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, lineHeight: 19, color: colors.textMuted },
  needsOwed: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, lineHeight: 19, color: colors.primary },

  list: { padding: 0, overflow: 'hidden' },
  row: { paddingVertical: spacing.s4, paddingHorizontal: spacing.s5, borderBottomWidth: 1, borderBottomColor: colors.divider },
  pressed: { backgroundColor: colors.surfaceOffset },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.s3 },
  rowName: { flex: 1, fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  rowMeta: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 3 },
  countdown: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.olive },
});
