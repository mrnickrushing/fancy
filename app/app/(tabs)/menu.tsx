import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { NoticeBanner } from '../../src/components/NoticeBanner';
import { ContentFrame, Screen } from '../../src/components/Screen';
import { SectionTitle } from '../../src/components/SectionTitle';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/States';
import { errorMessage } from '../../src/api/client';
import { useMenu, useMenuActions } from '../../src/hooks/useMenu';
import { COURSE_LABELS, COURSE_ORDER, type Course, type MenuItem } from '../../src/api/types';
import { fmtMoney } from '../../src/utils/format';
import { colors, fonts, fontSize, radius, spacing } from '../../src/theme';

type Draft = { name: string; description: string; price: string; course: Course };

const EMPTY: Draft = { name: '', description: '', price: '', course: 'savory' };

function CourseChips({ value, onChange }: { value: Course; onChange: (c: Course) => void }) {
  return (
    <View style={styles.chips}>
      {COURSE_ORDER.map((c) => (
        <Pressable key={c} onPress={() => onChange(c)} style={[styles.chip, value === c && styles.chipActive]}>
          <Text style={[styles.chipLabel, value === c && styles.chipLabelActive]}>{COURSE_LABELS[c]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function MenuScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useMenu();
  const { create, update, remove } = useMenuActions();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [edit, setEdit] = useState<Draft>(EMPTY);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const grouped = useMemo(() => {
    const items = data?.items ?? [];
    return COURSE_ORDER.map((course) => ({
      course,
      items: items.filter((i) => i.course === course),
    })).filter((g) => g.items.length);
  }, [data]);

  // An empty price is a real state, not a mistake: a quote-on-request bake has
  // no price until Amanda gives one.
  const parsePrice = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number(trimmed.replace(/^\$/, ''));
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  };

  const saveNew = async () => {
    const price = parsePrice(draft.price);
    if (!draft.name.trim()) return setStatus({ tone: 'error', message: 'Give the bake a name.' });
    if (Number.isNaN(price)) return setStatus({ tone: 'error', message: 'That price is not a number.' });
    try {
      await create.mutateAsync({
        course: draft.course,
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        price,
      });
      setDraft(EMPTY);
      setAdding(false);
      setStatus({ tone: 'success', message: 'Added to the bill of fare.' });
    } catch (err) {
      setStatus({ tone: 'error', message: errorMessage(err) });
    }
  };

  const beginEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEdit({
      name: item.name,
      description: item.description ?? '',
      price: item.price ?? '',
      course: item.course,
    });
  };

  const saveEdit = async (id: number) => {
    const price = parsePrice(edit.price);
    if (!edit.name.trim()) return setStatus({ tone: 'error', message: 'Give the bake a name.' });
    if (Number.isNaN(price)) return setStatus({ tone: 'error', message: 'That price is not a number.' });
    try {
      await update.mutateAsync({
        id,
        patch: {
          course: edit.course,
          name: edit.name.trim(),
          description: edit.description.trim(),
          price,
        },
      });
      setEditingId(null);
      setStatus({ tone: 'success', message: 'Saved.' });
    } catch (err) {
      setStatus({ tone: 'error', message: errorMessage(err) });
    }
  };

  const confirmRemove = (item: MenuItem) => {
    Alert.alert(`Take ${item.name} off?`, 'Past orders keep their own copy of the name and price.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Take it off', style: 'destructive', onPress: () => remove.mutate(item.id) },
    ]);
  };

  return (
    <Screen>
      <ContentFrame>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        >
          <SectionTitle
            eyebrow="What you are selling"
            title="Bill of fare"
            subtitle="Turning a bake off hides it from the order form without deleting it."
          />

          {status ? <NoticeBanner tone={status.tone} message={status.message} /> : null}

          {adding ? (
            <Card style={styles.form}>
              <Input label="Name" value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} />
              <Input
                label="Description"
                value={draft.description}
                onChangeText={(v) => setDraft({ ...draft, description: v })}
                multiline
              />
              <Input
                label="Price"
                value={draft.price}
                onChangeText={(v) => setDraft({ ...draft, price: v })}
                keyboardType="decimal-pad"
                hint="Leave it empty for quote on request."
              />
              <Text style={styles.label}>Course</Text>
              <CourseChips value={draft.course} onChange={(c) => setDraft({ ...draft, course: c })} />
              <View style={styles.formActions}>
                <Button label="Cancel" variant="outline" small onPress={() => setAdding(false)} style={styles.flex} />
                <Button label="Add it" small onPress={saveNew} loading={create.isPending} style={styles.flex} />
              </View>
            </Card>
          ) : (
            <Button label="Add a bake" variant="olive" onPress={() => setAdding(true)} style={styles.addButton} />
          )}

          {isLoading ? (
            <LoadingState message="Reading the bill of fare…" />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={refetch} />
          ) : grouped.length ? (
            grouped.map((group) => (
              <View key={group.course} style={styles.group}>
                <Text style={styles.groupTitle}>{COURSE_LABELS[group.course]}</Text>
                {group.items.map((item) => (
                  <Card key={item.id} style={[styles.item, !item.available && styles.itemOff]}>
                    {editingId === item.id ? (
                      <>
                        <Input label="Name" value={edit.name} onChangeText={(v) => setEdit({ ...edit, name: v })} />
                        <Input
                          label="Description"
                          value={edit.description}
                          onChangeText={(v) => setEdit({ ...edit, description: v })}
                          multiline
                        />
                        <Input
                          label="Price"
                          value={edit.price}
                          onChangeText={(v) => setEdit({ ...edit, price: v })}
                          keyboardType="decimal-pad"
                          hint="Leave it empty for quote on request."
                        />
                        <Text style={styles.label}>Course</Text>
                        <CourseChips value={edit.course} onChange={(c) => setEdit({ ...edit, course: c })} />
                        <View style={styles.formActions}>
                          <Button label="Cancel" variant="outline" small onPress={() => setEditingId(null)} style={styles.flex} />
                          <Button label="Save" small onPress={() => saveEdit(item.id)} loading={update.isPending} style={styles.flex} />
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.itemHead}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemPrice}>{item.price === null ? 'On request' : fmtMoney(item.price)}</Text>
                        </View>
                        {item.description ? <Text style={styles.itemDescription}>{item.description}</Text> : null}
                        {!item.available ? <Text style={styles.off}>Not offered right now</Text> : null}
                        <View style={styles.itemActions}>
                          <Button
                            label={item.available ? 'Turn off' : 'Turn on'}
                            variant="outline"
                            small
                            onPress={() => update.mutate({ id: item.id, patch: { available: !item.available } })}
                            style={styles.flex}
                          />
                          <Button label="Edit" variant="outline" small onPress={() => beginEdit(item)} style={styles.flex} />
                          <Button label="Remove" variant="danger" small onPress={() => confirmRemove(item)} style={styles.flex} />
                        </View>
                      </>
                    )}
                  </Card>
                ))}
              </View>
            ))
          ) : (
            <EmptyState title="The bill of fare is empty" message="Add the first bake and it appears on the website." />
          )}
        </ScrollView>
      </ContentFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.s5, paddingBottom: spacing.s16 },
  addButton: { marginBottom: spacing.s5 },
  form: { marginBottom: spacing.s5 },
  formActions: { flexDirection: 'row', gap: spacing.s2, marginTop: spacing.s2 },
  flex: { flex: 1 },
  label: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.s2,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s2, marginBottom: spacing.s4 },
  chip: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.olive, borderColor: colors.olive },
  chipLabel: { fontFamily: fonts.displaySemibold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textMuted },
  chipLabelActive: { color: colors.textInverse },
  group: { marginBottom: spacing.s6 },
  groupTitle: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.olive,
    marginBottom: spacing.s3,
  },
  item: { marginBottom: spacing.s3 },
  itemOff: { opacity: 0.6 },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.s3 },
  itemName: { flex: 1, fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  itemPrice: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.goldRead },
  itemDescription: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.textMuted, marginTop: 3, lineHeight: 21 },
  off: { fontFamily: fonts.bodyMedium, fontSize: fontSize.xs, color: colors.primary, marginTop: spacing.s2 },
  itemActions: { flexDirection: 'row', gap: spacing.s2, marginTop: spacing.s4 },
});
