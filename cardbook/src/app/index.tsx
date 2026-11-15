import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { getEdition } from '@/data';
import { EDITIONS } from '@/data/labels';
import { useCollection } from '@/store/collection';
import { colors } from '@/theme';

export default function Home() {
  const col = useCollection();

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.lead}>어떤 판을 모으고 있나요?</Text>

      {EDITIONS.map((ed) => {
        const data = getEdition(ed.id);
        const sets = data.series.flatMap((s) => s.sets);
        let owned = 0;
        let total = 0;
        for (const set of sets) {
          const p = col.setProgress(ed.id, set);
          owned += p.owned;
          total += p.total;
        }
        return (
          <Pressable
            key={ed.id}
            onPress={() => router.push({ pathname: '/[edition]', params: { edition: ed.id } })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardHead}>
              <Text style={styles.flag}>{ed.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{ed.label}</Text>
                <Text style={styles.sub}>
                  {ed.sub} · 시리즈 {data.series.length}개 · 세트 {sets.length}개
                </Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </View>
            <ProgressBar owned={owned} total={total} />
          </Pressable>
        );
      })}

      <Text style={styles.disclaimer}>
        이 앱은 개인 수집 기록용 비공식 팬 앱이며, 포켓몬 카드 게임의 제작사·유통사와 관련이 없습니다. 카드 사진은 직접
        찍은 사진만 이 폰에 저장됩니다.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  lead: { fontSize: 15, color: colors.sub, marginBottom: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 12 },
  pressed: { opacity: 0.7 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flag: { fontSize: 30 },
  title: { fontSize: 19, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.sub, marginTop: 2 },
  chev: { fontSize: 28, color: colors.sub },
  disclaimer: { fontSize: 12, color: colors.sub, lineHeight: 18, marginTop: 12 },
});
