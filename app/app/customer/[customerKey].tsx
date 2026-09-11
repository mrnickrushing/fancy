import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ContentFrame, Screen } from '../../src/components/Screen';
import { SectionTitle } from '../../src/components/SectionTitle';
import { EmptyState, LoadingState } from '../../src/components/States';
import { useOrders } from '../../src/hooks/useOrders';
import { useCustomers } from '../../src/hooks/useResources';
import { FULFILLMENT_SHORT } from '../../src/api/types';
import { itemCount } from '../../src/utils/orders';
import { fmtDate, fmtDateTime, fmtMoney } from '../../src/utils/format';
import { colors, fonts, fontSize, spacing } from '../../src/theme';

export default function CustomerScreen() {
  const router = useRouter();
  // Expo Router hands this back already decoded, so it must not be decoded
  // a second time — a "+" in an email would not survive it.
  const { customerKey } = useLocalSearchParams<{ customerKey: string }>();

  const { data: customers, isLoading: loadingCustomers } = useCustomers();
  const { data: orders, isLoading: loadingOrders } = useOrders();

  const customer = useMemo(
    () => customers?.find((c) => c.customer_key === customerKey),
    [customers, customerKey],
  );

  // Orders carry no customer key of their own, so they are matched on
  // email-or-phone — the same grouping rule the server uses.
  const theirs = useMemo(
    () =>
      (orders ?? [])
        .filter((o) => (o.email || o.phone) === customerKey)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [orders, customerKey],
  );

  if (loadingCustomers || loadingOrders) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!customer) {
    return (
      <Screen>
        <EmptyState title="No such customer" message="They may have been deleted." />
        <Button label="Back" variant="outline" onPress={() => router.back()} style={styles.backAlone} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ContentFrame narrow>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Button label="Back to customers" variant="outline" small onPress={() => router.back()} style={styles.back} />
          <SectionTitle eyebrow="Customer" title={`${customer.first_name} ${customer.last_name}`} />

          <View style={styles.quick}>
            {customer.email ? (
              <Button
                label="Email"
                variant="outline"
                small
                style={styles.quickAction}
                onPress={() => Linking.openURL(`mailto:${customer.email}`)}
              />
            ) : null}
            {customer.phone ? (
              <Button
                label="Call"
                variant="outline"
                small
                style={styles.quickAction}
                onPress={() => Linking.openURL(`tel:${customer.phone}`)}
              />
            ) : null}
          </View>

          <Card style={styles.card}>
            <Text style={styles.total}>{fmtMoney(customer.total_spent)}</Text>
            <Text style={styles.totalLabel}>
              across {customer.order_count} order{customer.order_count === 1 ? '' : 's'}
            </Text>
            {customer.email ? <Text style={styles.meta}>{customer.email}</Text> : null}
            {customer.phone ? <Text style={styles.meta}>{customer.phone}</Text> : null}
            <Text style={styles.meta}>Last ordered {fmtDateTime(customer.last_order_at)}</Text>
          </Card>

          <SectionTitle title="Their orders" />
          {theirs.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => router.push(`/order/${o.id}`)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.rowHead}>
                <Text style={styles.rowDate}>{fmtDate(o.needed_date)}</Text>
                <Badge status={o.status} />
              </View>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {FULFILLMENT_SHORT[o.fulfillment]} · {itemCount(o)} item{itemCount(o) === 1 ? '' : 's'} ·{' '}
                {o.items.map((i) => i.name).join(', ')}
              </Text>
              <Text style={styles.rowMoney}>{fmtMoney(o.amount)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ContentFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.s5, paddingBottom: spacing.s16 },
  back: { alignSelf: 'flex-start', marginBottom: spacing.s4 },
  backAlone: { margin: spacing.s6 },
  quick: { flexDirection: 'row', gap: spacing.s2, marginBottom: spacing.s4 },
  quickAction: { flex: 1 },
  card: { marginBottom: spacing.s6 },
  total: { fontFamily: fonts.displaySemibold, fontSize: fontSize.xxl, color: colors.primary },
  totalLabel: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.s3 },
  meta: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  row: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 3,
    padding: spacing.s4,
    marginBottom: spacing.s3,
  },
  rowPressed: { backgroundColor: colors.surfaceOffset },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.s3 },
  rowDate: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  rowMeta: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 3 },
  rowMoney: { fontFamily: fonts.displaySemibold, fontSize: fontSize.sm, color: colors.text, marginTop: spacing.s2 },
});
