import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '../../src/components/Badge';
import { Card } from '../../src/components/Card';
import { ContentFrame, Screen, TABLET_BREAKPOINT } from '../../src/components/Screen';
import { SectionTitle } from '../../src/components/SectionTitle';
import { StatCard } from '../../src/components/StatCard';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/States';
import { errorMessage } from '../../src/api/client';
import { useOrders } from '../../src/hooks/useOrders';
import { FULFILLMENT_SHORT } from '../../src/api/types';
import type { Order } from '../../src/api/types';
import { itemCount } from '../../src/utils/orders';
import { balanceDue } from '../../src/utils/payment';
import { fmtDate, fmtMoney, toNumber } from '../../src/utils/format';
import { colors, fonts, fontSize, spacing } from '../../src/theme';

function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function daysUntil(iso: string): number {
  const a = new Date(`${todayIso()}T12:00:00`).getTime();
  const b = new Date(`${iso.slice(0, 10)}T12:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const owed = balanceDue(order.paid_amount, order.amount, order.payment_status);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowHead}>
        <Text style={styles.rowName} numberOfLines={1}>
          {order.first_name} {order.last_name}
        </Text>
        <Badge status={order.status} />
      </View>
      <Text style={styles.rowMeta}>
        {fmtDate(order.needed_date)} · {FULFILLMENT_SHORT[order.fulfillment]} · {itemCount(order)} item
        {itemCount(order) === 1 ? '' : 's'}
      </Text>
      {owed !== null && owed > 0 ? (
        <Text style={styles.rowOwed}>{fmtMoney(owed)} still owed</Text>
      ) : null}
    </Pressable>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useOrders();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);

  const view = useMemo(() => {
    const orders = data ?? [];
    const today = todayIso();
    const pending = orders.filter((o) => o.status === 'pending');
    const accepted = orders.filter((o) => o.status === 'accepted');
    const dueToday = orders.filter(
      (o) => o.needed_date.slice(0, 10) === today && o.status !== 'cancelled' && o.status !== 'declined',
    );

    // What is actually outstanding, across every order Amanda has agreed to
    // bake. An unpriced order contributes nothing rather than reading as free.
    const owed = accepted.reduce((sum, o) => sum + (balanceDue(o.paid_amount, o.amount, o.payment_status) ?? 0), 0);

    const attention = [
      ...pending,
      ...accepted.filter((o) => (balanceDue(o.paid_amount, o.amount, o.payment_status) ?? 0) > 0),
    ].slice(0, 6);

    const upcoming = accepted
      .filter((o) => {
        const d = daysUntil(o.needed_date);
        return d >= 0 && d <= 30;
      })
      .sort((a, b) => a.needed_date.localeCompare(b.needed_date));

    return { orders, pending, accepted, dueToday, owed, attention, upcoming };
  }, [data]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const statWidth = width >= TABLET_BREAKPOINT ? '25%' : '50%';

  return (
    <Screen>
      <ContentFrame>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing || isRefetching} onRefresh={refresh} tintColor={colors.primary} />}
        >
          <SectionTitle eyebrow="Oh! You Fancy Focaccia" title="Today at the bakery" />

          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={refetch} />
          ) : (
            <>
              <View style={styles.stats}>
                <View style={{ width: statWidth, padding: spacing.s1 }}>
                  <StatCard label="Awaiting you" value={view.pending.length} accent={colors.gold} />
                </View>
                <View style={{ width: statWidth, padding: spacing.s1 }}>
                  <StatCard label="Wanted today" value={view.dueToday.length} accent={colors.olive} />
                </View>
                <View style={{ width: statWidth, padding: spacing.s1 }}>
                  <StatCard label="Accepted" value={view.accepted.length} accent={colors.olive} />
                </View>
                <View style={{ width: statWidth, padding: spacing.s1 }}>
                  <StatCard label="Still owed" value={fmtMoney(view.owed)} accent={colors.primary} />
                </View>
              </View>

              <SectionTitle title="Needs you" subtitle="New requests, and orders with money still outstanding." />
              {view.attention.length ? (
                <Card style={styles.list}>
                  {view.attention.map((o) => (
                    <OrderRow key={o.id} order={o} onPress={() => router.push(`/order/${o.id}`)} />
                  ))}
                </Card>
              ) : (
                <EmptyState title="Nothing is waiting" message="Every request has an answer and every total is settled." />
              )}

              <SectionTitle title="The next thirty days" />
              {view.upcoming.length ? (
                <Card style={styles.list}>
                  {view.upcoming.map((o) => {
                    const d = daysUntil(o.needed_date);
                    return (
                      <Pressable
                        key={o.id}
                        onPress={() => router.push(`/order/${o.id}`)}
                        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
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
        </ScrollView>
      </ContentFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.s5, paddingBottom: spacing.s16 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.s1, marginBottom: spacing.s6 },
  list: { padding: 0, overflow: 'hidden' },
  row: { paddingVertical: spacing.s4, paddingHorizontal: spacing.s5, borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowPressed: { backgroundColor: colors.surfaceOffset },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.s3 },
  rowName: { flex: 1, fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  rowMeta: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 3 },
  rowOwed: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.primary, marginTop: 3 },
  countdown: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.olive },
});
