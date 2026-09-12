import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { NoticeBanner } from '../../src/components/NoticeBanner';
import { ContentFrame, Screen } from '../../src/components/Screen';
import { SectionTitle } from '../../src/components/SectionTitle';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/States';
import { errorMessage } from '../../src/api/client';
import { useOrders } from '../../src/hooks/useOrders';
import { useReadOnly } from '../../src/hooks/useSession';
import { useDebouncedValue } from '../../src/hooks/useDebouncedValue';
import { FULFILLMENT_SHORT } from '../../src/api/types';
import { filterAndSortOrders, itemCount, type OrderFilter, type OrderSort } from '../../src/utils/orders';
import { balanceDue } from '../../src/utils/payment';
import { fmtDate, fmtMoney } from '../../src/utils/format';
import { colors, fonts, fontSize, radius, spacing } from '../../src/theme';

const FILTERS: { key: OrderFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
  { key: 'declined', label: 'Declined' },
  { key: 'cancelled', label: 'Cancelled' },
];

const SORTS: { key: OrderSort; label: string }[] = [
  { key: 'needed', label: 'By date wanted' },
  { key: 'recent', label: 'Newest first' },
  { key: 'name', label: 'By name' },
];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ created?: string }>();
  const { data, isLoading, error, refetch, isRefetching } = useOrders();
  const readOnly = useReadOnly();

  const [filter, setFilter] = useState<OrderFilter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<OrderSort>('needed');
  const debounced = useDebouncedValue(query);

  const rows = useMemo(
    () => filterAndSortOrders(data ?? [], filter, debounced, sort),
    [data, filter, debounced, sort],
  );

  return (
    <Screen>
      <ContentFrame>
        <FlatList
          data={rows}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View>
              <SectionTitle eyebrow="The order book" title="Orders" />
              {params.created ? <NoticeBanner tone="success" message="That order is in the book." /> : null}
              {readOnly ? null : (
                <Button label="Write an order in" variant="olive" onPress={() => router.push('/new-order')} />
              )}
              <Input
                placeholder="Search a name, a bake, a note"
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                containerStyle={styles.search}
              />
              <View style={styles.chips}>
                {FILTERS.map((f) => (
                  <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
                ))}
              </View>
              <View style={styles.chips}>
                {SORTS.map((s) => (
                  <Chip key={s.key} label={s.label} active={sort === s.key} onPress={() => setSort(s.key)} />
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={errorMessage(error)} onRetry={refetch} />
            ) : (
              <EmptyState
                title={query ? 'Nothing matches that' : 'No orders here yet'}
                message={query ? 'Try a shorter search.' : 'Orders from the website land here the moment they arrive.'}
              />
            )
          }
          renderItem={({ item }) => {
            const owed = balanceDue(item.paid_amount, item.amount, item.payment_status);
            return (
              <Pressable
                onPress={() => router.push(`/order/${item.id}`)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={styles.head}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.first_name} {item.last_name}
                  </Text>
                  <Badge status={item.status} />
                </View>
                <Text style={styles.meta}>
                  {fmtDate(item.needed_date)} · {FULFILLMENT_SHORT[item.fulfillment]}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {itemCount(item)} item{itemCount(item) === 1 ? '' : 's'} ·{' '}
                  {item.items.map((i) => i.name).join(', ')}
                </Text>
                <View style={styles.foot}>
                  <Text style={styles.money}>{fmtMoney(item.amount)}</Text>
                  <Badge status={item.payment_status} />
                </View>
                {owed !== null && owed > 0 ? <Text style={styles.owed}>{fmtMoney(owed)} still owed</Text> : null}
              </Pressable>
            );
          }}
        />
      </ContentFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.s5, paddingBottom: spacing.s16 },
  search: { marginTop: spacing.s4, marginBottom: spacing.s2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s2, marginBottom: spacing.s3 },
  chip: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontFamily: fonts.displaySemibold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textMuted },
  chipLabelActive: { color: colors.textInverse },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.s4,
    marginBottom: spacing.s3,
  },
  cardPressed: { backgroundColor: colors.surfaceOffset },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.s3 },
  name: { flex: 1, fontFamily: fonts.displaySemibold, fontSize: fontSize.lg, color: colors.text },
  meta: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 3 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.s3 },
  money: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  owed: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.primary, marginTop: spacing.s2 },
});
