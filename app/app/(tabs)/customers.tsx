import { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/Button';
import { NoticeBanner } from '../../src/components/NoticeBanner';
import { ContentFrame, Screen } from '../../src/components/Screen';
import { SectionTitle } from '../../src/components/SectionTitle';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/States';
import { errorMessage } from '../../src/api/client';
import { useCustomerActions, useCustomers } from '../../src/hooks/useResources';
import { fmtDateTime, fmtMoney } from '../../src/utils/format';
import { colors, fonts, fontSize, radius, spacing } from '../../src/theme';

export default function CustomersScreen() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useCustomers();
  const { remove } = useCustomerActions();
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const confirmDelete = (key: string, name: string) => {
    Alert.alert(
      `Delete ${name}?`,
      'This deletes their orders too. A customer is only a grouping of orders, so there is nothing left afterwards.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove.mutateAsync(key);
              setStatus({ tone: 'success', message: `${name} and their orders are gone.` });
            } catch (err) {
              setStatus({ tone: 'error', message: errorMessage(err) });
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <ContentFrame>
        <FlatList
          data={data ?? []}
          keyExtractor={(c) => c.customer_key}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View>
              <SectionTitle
                eyebrow="Who keeps coming back"
                title="Customers"
                subtitle="Gathered from the orders themselves, by email or phone."
              />
              {status ? <NoticeBanner tone={status.tone} message={status.message} /> : null}
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={errorMessage(error)} onRetry={refetch} />
            ) : (
              <EmptyState title="No customers yet" message="They appear here as soon as the first order arrives." />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable onPress={() => router.push(`/customer/${encodeURIComponent(item.customer_key)}`)}>
                <Text style={styles.name}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={styles.spent}>{fmtMoney(item.total_spent)} across {item.order_count} order{item.order_count === 1 ? '' : 's'}</Text>
                {item.email ? <Text style={styles.meta}>{item.email}</Text> : null}
                {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
                <Text style={styles.meta}>Last ordered {fmtDateTime(item.last_order_at)}</Text>
              </Pressable>
              <View style={styles.actions}>
                <Button
                  label="History"
                  variant="outline"
                  small
                  onPress={() => router.push(`/customer/${encodeURIComponent(item.customer_key)}`)}
                  style={styles.action}
                />
                <Button
                  label="Delete"
                  variant="danger"
                  small
                  onPress={() => confirmDelete(item.customer_key, `${item.first_name} ${item.last_name}`)}
                  style={styles.action}
                />
              </View>
            </View>
          )}
        />
      </ContentFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.s5, paddingBottom: spacing.s16 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.s4,
    marginBottom: spacing.s3,
  },
  name: { fontFamily: fonts.displaySemibold, fontSize: fontSize.lg, color: colors.text },
  spent: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.primary, marginTop: 2 },
  meta: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 3 },
  actions: { flexDirection: 'row', gap: spacing.s2, marginTop: spacing.s4 },
  action: { flex: 1 },
});
