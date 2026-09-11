import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { NoticeBanner } from '../../src/components/NoticeBanner';
import { ContentFrame, Screen } from '../../src/components/Screen';
import { SectionTitle } from '../../src/components/SectionTitle';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/States';
import { errorMessage } from '../../src/api/client';
import { useReviewActions, useReviews } from '../../src/hooks/useResources';
import { fmtDateTime, fmtStars } from '../../src/utils/format';
import { colors, fonts, fontSize, radius, spacing, starColor } from '../../src/theme';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Waiting' },
  { key: 'approved', label: 'On the site' },
  { key: 'rejected', label: 'Hidden' },
  { key: 'all', label: 'All' },
];

export default function ReviewsScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useReviews();
  const { approve, reject, remove } = useReviewActions();
  // Waiting first: this screen exists to clear that queue.
  const [filter, setFilter] = useState<Filter>('pending');
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const rows = useMemo(
    () => (data ?? []).filter((r) => filter === 'all' || r.status === filter),
    [data, filter],
  );

  const act = async (fn: () => Promise<unknown>, message: string) => {
    try {
      await fn();
      setStatus({ tone: 'success', message });
    } catch (err) {
      setStatus({ tone: 'error', message: errorMessage(err) });
    }
  };

  return (
    <Screen>
      <ContentFrame narrow>
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View>
              <SectionTitle
                eyebrow="What people are saying"
                title="Reviews"
                subtitle="Nothing appears on the website until you approve it."
              />
              {status ? <NoticeBanner tone={status.tone} message={status.message} /> : null}
              <View style={styles.chips}>
                {FILTERS.map((f) => (
                  <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, filter === f.key && styles.chipActive]}>
                    <Text style={[styles.chipLabel, filter === f.key && styles.chipLabelActive]}>{f.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <LoadingState message="Fetching the reviews…" />
            ) : error ? (
              <ErrorState message={errorMessage(error)} onRetry={refetch} />
            ) : (
              <EmptyState
                title={filter === 'pending' ? 'Nothing is waiting' : 'Nothing here'}
                message={filter === 'pending' ? 'Every review has been answered one way or the other.' : undefined}
              />
            )
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.name}>{item.name}</Text>
                <Badge status={item.status} />
              </View>
              <Text style={styles.stars}>{fmtStars(item.rating)}</Text>
              <Text style={styles.body}>{item.review}</Text>
              <Text style={styles.when}>{fmtDateTime(item.created_at)}</Text>
              <View style={styles.actions}>
                {item.status !== 'approved' ? (
                  <Button
                    label="Approve"
                    variant="olive"
                    small
                    style={styles.action}
                    onPress={() => act(() => approve.mutateAsync(item.id), 'That review is on the website now.')}
                  />
                ) : null}
                {item.status !== 'rejected' ? (
                  <Button
                    label="Hide"
                    variant="outline"
                    small
                    style={styles.action}
                    onPress={() => act(() => reject.mutateAsync(item.id), 'Hidden from the website.')}
                  />
                ) : null}
                <Button
                  label="Delete"
                  variant="danger"
                  small
                  style={styles.action}
                  onPress={() =>
                    Alert.alert('Delete this review?', 'It cannot be brought back.', [
                      { text: 'Keep', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => act(() => remove.mutateAsync(item.id), 'Deleted.'),
                      },
                    ])
                  }
                />
              </View>
            </Card>
          )}
        />
      </ContentFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.s5, paddingBottom: spacing.s16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s2, marginBottom: spacing.s4 },
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
  card: { marginBottom: spacing.s3 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.s3 },
  name: { flex: 1, fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  stars: { color: starColor, fontSize: fontSize.base, marginTop: spacing.s1, letterSpacing: 2 },
  body: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.text, marginTop: spacing.s2, lineHeight: 22 },
  when: { fontFamily: fonts.bodyRegular, fontSize: fontSize.xs, color: colors.textFaint, marginTop: spacing.s2 },
  actions: { flexDirection: 'row', gap: spacing.s2, marginTop: spacing.s4 },
  action: { flex: 1 },
});
