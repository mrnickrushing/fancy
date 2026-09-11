import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { NoticeBanner } from '../../src/components/NoticeBanner';
import { ContentFrame, Screen } from '../../src/components/Screen';
import { SectionTitle } from '../../src/components/SectionTitle';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/States';
import { errorMessage } from '../../src/api/client';
import { useBlockActions, useBlocks } from '../../src/hooks/useResources';
import { fmtDate, toIsoDate } from '../../src/utils/format';
import { colors, fonts, fontSize, spacing } from '../../src/theme';

export default function CalendarScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useBlocks();
  const { create, remove } = useBlockActions();

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pickerField, setPickerField] = useState<'start' | 'end' | null>(null);
  const [draftDate, setDraftDate] = useState<Date>(new Date());

  const openPicker = (field: 'start' | 'end') => {
    setDraftDate((field === 'start' ? startDate : endDate) ?? new Date());
    setPickerField(field);
  };

  const commit = (value: Date) => {
    if (pickerField === 'start') setStartDate(value);
    if (pickerField === 'end') setEndDate(value);
  };

  // Android's picker is a dialog that reports its own dismissal; iOS needs a
  // modal of our own with an explicit Done.
  const onAndroidChange = (event: DateTimePickerEvent, value?: Date) => {
    setPickerField(null);
    if (event.type === 'set' && value) commit(value);
  };

  const submit = async () => {
    setFormError(null);
    setStatus(null);
    if (!startDate || !endDate) {
      setFormError('Choose both a first and a last day.');
      return;
    }
    const startIso = toIsoDate(startDate);
    const endIso = toIsoDate(endDate);
    if (endIso < startIso) {
      setFormError('The last day cannot come before the first.');
      return;
    }
    try {
      await create.mutateAsync({ startDate: startIso, endDate: endIso, reason: reason.trim() || undefined });
      setStartDate(null);
      setEndDate(null);
      setReason('');
      setStatus('Those days are blocked. The order form will not offer them.');
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const confirmRemove = (id: number) => {
    Alert.alert('Open these days back up?', 'Customers will be able to choose them again.', [
      { text: 'Keep blocked', style: 'cancel' },
      { text: 'Open up', onPress: () => remove.mutate(id) },
    ]);
  };

  return (
    <Screen>
      <ContentFrame narrow>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        >
          <SectionTitle
            eyebrow="When you are not baking"
            title="Days off"
            subtitle="A blocked range disappears from the order form, so nobody can ask for a bake you are not there to make."
          />

          <Card style={styles.form}>
            {formError ? <NoticeBanner tone="error" message={formError} /> : null}
            {status ? <NoticeBanner tone="success" message={status} /> : null}

            <Text style={styles.label}>First day off</Text>
            <Pressable onPress={() => openPicker('start')} style={styles.dateField}>
              <Text style={startDate ? styles.dateText : styles.datePlaceholder}>
                {startDate ? fmtDate(startDate) : 'Choose a day'}
              </Text>
            </Pressable>

            <Text style={styles.label}>Last day off</Text>
            <Pressable onPress={() => openPicker('end')} style={styles.dateField}>
              <Text style={endDate ? styles.dateText : styles.datePlaceholder}>
                {endDate ? fmtDate(endDate) : 'Choose a day'}
              </Text>
            </Pressable>

            <Input label="Why (optional)" value={reason} onChangeText={setReason} placeholder="Away, family, rest" />
            <Button label="Block these days" onPress={submit} loading={create.isPending} />
          </Card>

          {isLoading ? (
            <LoadingState message="Looking up the days off…" />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={refetch} />
          ) : (data ?? []).length ? (
            (data ?? []).map((block) => (
              <Card key={block.id} style={styles.block}>
                <Text style={styles.range}>
                  {fmtDate(block.start_date)}
                  {block.end_date !== block.start_date ? ` — ${fmtDate(block.end_date)}` : ''}
                </Text>
                {block.reason ? <Text style={styles.reason}>{block.reason}</Text> : null}
                <Button label="Open back up" variant="outline" small onPress={() => confirmRemove(block.id)} style={styles.blockAction} />
              </Card>
            ))
          ) : (
            <EmptyState title="Every day is open" message="Nothing is blocked, so the order form offers them all." />
          )}
        </ScrollView>
      </ContentFrame>

      {pickerField && Platform.OS === 'android' ? (
        <DateTimePicker value={draftDate} mode="date" display="calendar" onChange={onAndroidChange} />
      ) : null}

      {pickerField && Platform.OS !== 'android' ? (
        <Modal transparent animationType="slide" onRequestClose={() => setPickerField(null)}>
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="spinner"
                onChange={(_e, value) => value && setDraftDate(value)}
              />
              <View style={styles.modalActions}>
                <Button label="Cancel" variant="outline" small onPress={() => setPickerField(null)} style={styles.modalButton} />
                <Button
                  label="Done"
                  small
                  onPress={() => {
                    commit(draftDate);
                    setPickerField(null);
                  }}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.s5, paddingBottom: spacing.s16 },
  form: { marginBottom: spacing.s6 },
  label: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.s2,
  },
  dateField: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    paddingHorizontal: spacing.s4,
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: spacing.s4,
  },
  dateText: { fontFamily: fonts.bodyRegular, fontSize: fontSize.base, color: colors.text },
  datePlaceholder: { fontFamily: fonts.bodyRegular, fontSize: fontSize.base, color: colors.textFaint },
  block: { marginBottom: spacing.s3 },
  range: { fontFamily: fonts.displaySemibold, fontSize: fontSize.base, color: colors.text },
  reason: { fontFamily: fonts.bodyRegular, fontSize: fontSize.sm, color: colors.textMuted, marginTop: 3 },
  blockAction: { marginTop: spacing.s4, alignSelf: 'flex-start' },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modalCard: { backgroundColor: colors.surface, padding: spacing.s5, borderTopWidth: 1, borderTopColor: colors.border },
  modalActions: { flexDirection: 'row', gap: spacing.s3, marginTop: spacing.s3 },
  modalButton: { flex: 1 },
});
