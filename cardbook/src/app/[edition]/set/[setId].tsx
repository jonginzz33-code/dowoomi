import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CardFace } from '@/components/CardFace';
import { ProgressBar } from '@/components/ProgressBar';
import { findSet, isEditionId } from '@/data';
import { useCollection } from '@/store/collection';
import { colors } from '@/theme';

type OwnFilter = 'all' | 'owned' | 'missing';
const OWN_FILTERS: { id: OwnFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'owned', label: '보유' },
  { id: 'missing', label: '미보유' },
];

const COLUMNS = 3;
const PAD = 16;
const GAP = 10;

export default function SetScreen() {
  const { edition, setId } = useLocalSearchParams<{ edition: string; setId: string }>();
  const col = useCollection();
  const { width } = useWindowDimensions();
  const [own, setOwn] = useState<OwnFilter>('all');
  const [rarity, setRarity] = useState<string | null>(null);

  const found = isEditionId(edition) ? findSet(edition, setId) : null;
  if (!found || !isEditionId(edition)) return <Text style={{ padding: 16 }}>세트를 찾을 수 없어요.</Text>;
  const { set } = found;
  const rarities = [...new Set(set.cards.map((c) => c.rarity).filter((r): r is string => !!r))];

  const cards = set.cards.filter((c) => {
    if (rarity && c.rarity !== rarity) return false;
    if (own === 'all') return true;
    const o = col.isOwned(edition, c);
    return own === 'owned' ? o : !o;
  });
  const progress = col.setProgress(edition, set);
  const cardW = (width - PAD * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <>
      <Stack.Screen options={{ title: set.code ? `${set.code} ${set.name}` : set.name }} />
      <FlatList
        data={cards}
        key={COLUMNS}
        numColumns={COLUMNS}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: PAD, paddingTop: 4, gap: GAP }}
        columnWrapperStyle={{ gap: GAP }}
        ListHeaderComponent={
          <View style={styles.header}>
            <ProgressBar owned={progress.owned} total={progress.total} />
            <View style={styles.chips}>
              {OWN_FILTERS.map((f) => (
                <Chip key={f.id} label={f.label} active={own === f.id} onPress={() => setOwn(f.id)} />
              ))}
            </View>
            {rarities.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                <Chip label="모든 레어도" active={rarity === null} onPress={() => setRarity(null)} />
                {rarities.map((r) => (
                  <Chip key={r} label={r} active={rarity === r} onPress={() => setRarity(r)} />
                ))}
              </ScrollView>
            ) : null}
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>조건에 맞는 카드가 없어요.</Text>}
        renderItem={({ item: card }) => {
          const owned = col.isOwned(edition, card);
          return (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/[edition]/card/[cardId]', params: { edition, cardId: card.id } })
              }
              style={({ pressed }) => [{ width: cardW }, pressed && { opacity: 0.7 }]}
            >
              <CardFace card={card} width={cardW} owned={owned} photo={col.coverPhoto(edition, card)} />
              <Text style={[styles.caption, !owned && styles.captionMissing]} numberOfLines={1}>
                {card.number} {card.name}
              </Text>
            </Pressable>
          );
        }}
      />
    </>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10, marginBottom: 4 },
  chips: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  caption: { fontSize: 11, color: colors.text, marginTop: 4, fontWeight: '600' },
  captionMissing: { color: colors.sub, fontWeight: '400' },
  empty: { textAlign: 'center', color: colors.sub, marginTop: 40 },
});
