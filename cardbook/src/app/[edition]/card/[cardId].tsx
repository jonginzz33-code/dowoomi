import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CardFace } from '@/components/CardFace';
import { cardVariants, findCard, isEditionId } from '@/data';
import { editionLabel, TYPE_INFO, VARIANT_LABELS } from '@/data/labels';
import type { VariantId } from '@/data/types';
import { useCollection } from '@/store/collection';
import { pickAndSavePhoto, type PhotoSource } from '@/store/photos';
import { colors } from '@/theme';

export default function CardScreen() {
  const { edition, cardId } = useLocalSearchParams<{ edition: string; cardId: string }>();
  const col = useCollection();
  const { width } = useWindowDimensions();
  const [variant, setVariant] = useState<VariantId | null>(null);
  const [busy, setBusy] = useState(false);

  const found = isEditionId(edition) ? findCard(edition, cardId) : null;
  if (!found || !isEditionId(edition)) return <Text style={{ padding: 16 }}>카드를 찾을 수 없어요.</Text>;
  const { series, set, card } = found;

  const variants = cardVariants(card);
  // 처음 열 때는 가지고 있는 버전을 먼저 보여줍니다.
  const firstOwned = variants.find((vid) => (col.get(edition, card.id, vid)?.count ?? 0) > 0);
  const v = variant && variants.includes(variant) ? variant : (firstOwned ?? variants[0]);
  const entry = col.get(edition, card.id, v);
  const count = entry?.count ?? 0;
  const cardW = Math.min(width * 0.62, 280);

  const addPhoto = async (source: PhotoSource) => {
    if (busy) return;
    setBusy(true);
    try {
      const file = await pickAndSavePhoto(source, `${edition}_${card.id}_${v}`);
      if (file) col.setPhoto(edition, card.id, v, file);
    } catch (e) {
      Alert.alert('사진을 저장하지 못했어요', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = () =>
    Alert.alert('사진 삭제', '이 카드 사진을 지울까요? 보유 수량은 그대로 남아요.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => col.setPhoto(edition, card.id, v, undefined) },
    ]);

  const info: [string, string][] = [
    ['판', editionLabel(edition)],
    ['시리즈', series.name],
    ['세트', set.code ? `${set.code} · ${set.name}` : set.name],
    ['번호', set.officialCount ? `${card.number} / ${set.officialCount}` : card.number],
  ];
  if (card.rarity) info.push(['레어도', card.rarity]);
  if (card.type) info.push(['타입', TYPE_INFO[card.type].label]);

  return (
    <>
      <Stack.Screen options={{ title: card.name }} />
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.center}>
          <CardFace card={card} width={cardW} owned={count > 0} photo={entry?.photo} />
        </View>

        {variants.length > 1 ? (
          <View style={styles.section}>
            <Text style={styles.label}>버전</Text>
            <View style={styles.variants}>
              {variants.map((vid) => {
                const has = (col.get(edition, card.id, vid)?.count ?? 0) > 0;
                const active = vid === v;
                return (
                  <Pressable
                    key={vid}
                    onPress={() => setVariant(vid)}
                    style={[styles.variant, active && styles.variantActive]}
                  >
                    <Text style={[styles.variantText, active && { color: '#fff' }]}>
                      {has ? '● ' : ''}
                      {VARIANT_LABELS[vid]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>{variants.length > 1 ? `${VARIANT_LABELS[v]} 사진` : '내 카드 사진'}</Text>
          <View style={styles.row}>
            <Btn label="📷 사진 찍기" primary onPress={() => addPhoto('camera')} disabled={busy} />
            <Btn label="🖼️ 앨범에서" onPress={() => addPhoto('library')} disabled={busy} />
          </View>
          {entry?.photo ? <Btn label="사진 삭제" danger onPress={removePhoto} /> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>보유 수량</Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => col.setCount(edition, card.id, v, count - 1)}
              disabled={count === 0}
            >
              <Text style={[styles.stepText, count === 0 && { color: colors.line }]}>−</Text>
            </Pressable>
            <Text style={styles.count}>{count}장</Text>
            <Pressable style={styles.stepBtn} onPress={() => col.setCount(edition, card.id, v, count + 1)}>
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.section, styles.infoBox]}>
          {info.map(([k, val]) => (
            <View key={k} style={styles.infoRow}>
              <Text style={styles.infoKey}>{k}</Text>
              <Text style={styles.infoVal}>{val}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

function Btn({
  label,
  onPress,
  primary,
  danger,
  disabled,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        primary && { backgroundColor: colors.accent, borderColor: colors.accent },
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.btnText, primary && { color: '#fff' }, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 18, paddingBottom: 40 },
  center: { alignItems: 'center' },
  section: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: colors.sub },
  row: { flexDirection: 'row', gap: 8 },
  variants: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  variant: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  variantActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  variantText: { fontSize: 13, fontWeight: '600', color: colors.text },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: colors.text },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  stepBtn: { paddingHorizontal: 20, paddingVertical: 8 },
  stepText: { fontSize: 24, fontWeight: '600', color: colors.accent },
  count: { fontSize: 17, fontWeight: '700', minWidth: 50, textAlign: 'center', color: colors.text },
  infoBox: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, gap: 10 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoKey: { width: 56, fontSize: 13, color: colors.sub },
  infoVal: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600' },
});
