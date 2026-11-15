import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { getEdition, isEditionId } from '@/data';
import { editionLabel } from '@/data/labels';
import { useCollection } from '@/store/collection';
import { colors } from '@/theme';

export default function EditionScreen() {
  const { edition } = useLocalSearchParams<{ edition: string }>();
  const col = useCollection();
  if (!isEditionId(edition)) return <Text style={{ padding: 16 }}>알 수 없는 판이에요.</Text>;

  const data = getEdition(edition);
  const sections = data.series.map((s) => ({ key: s.id, title: s.name, data: s.sets }));

  return (
    <>
      <Stack.Screen options={{ title: editionLabel(edition) }} />
      <SectionList
        sections={sections}
        keyExtractor={(set) => set.id}
        contentContainerStyle={styles.wrap}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          data.sample ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>⚠️ {data.source}</Text>
            </View>
          ) : undefined
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.series}>
            {section.title} <Text style={styles.seriesCount}>· 세트 {section.data.length}개</Text>
          </Text>
        )}
        renderItem={({ item: set }) => {
          const p = col.setProgress(edition, set);
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/[edition]/set/[setId]', params: { edition, setId: set.id } })}
              style={({ pressed }) => [styles.set, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.setHead}>
                {set.code ? <Text style={styles.code}>{set.code}</Text> : null}
                <Text style={styles.setName} numberOfLines={2}>
                  {set.name}
                </Text>
              </View>
              <Text style={styles.meta}>
                {[
                  set.releaseDate ? `${set.releaseDate} 발매` : null,
                  set.officialCount ? `공식 ${set.officialCount}장` : null,
                  `수록 ${set.cards.length}장`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <ProgressBar owned={p.owned} total={p.total} compact />
            </Pressable>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingTop: 4, gap: 10 },
  notice: { backgroundColor: '#FFF4D6', borderRadius: 10, padding: 12, marginBottom: 4 },
  noticeText: { fontSize: 12, color: '#7A5B00', lineHeight: 18 },
  series: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 14, marginBottom: 2 },
  seriesCount: { fontSize: 13, fontWeight: '500', color: colors.sub },
  set: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, gap: 8 },
  setHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  setName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.sub },
});
