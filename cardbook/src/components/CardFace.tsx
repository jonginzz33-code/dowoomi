import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { TYPE_INFO } from '@/data/labels';
import type { Card } from '@/data/types';
import { photoUri } from '@/store/photos';
import { CARD_RATIO, colors } from '@/theme';
import { CardBack } from './CardBack';

/**
 * 카드 한 장의 앞모습.
 * - 사진이 있으면: 내가 찍은 사진
 * - 가지고 있지만 사진이 없으면: 이름이 적힌 카드 틀
 * - 없으면: ? 카드 뒷면
 */
export function CardFace({ card, width, owned, photo }: { card: Card; width: number; owned: boolean; photo?: string }) {
  const height = width * CARD_RATIO;
  const radius = width * 0.055;

  if (photo) {
    return (
      <Image
        source={{ uri: photoUri(photo) }}
        style={{ width, height, borderRadius: radius, backgroundColor: colors.line }}
        contentFit="cover"
        transition={120}
      />
    );
  }

  if (!owned) return <CardBack width={width} />;

  const typeColor = card.type ? TYPE_INFO[card.type].color : colors.accent;
  return (
    <View style={[styles.owned, { width, height, borderRadius: radius, borderColor: typeColor }]}>
      <Text style={[styles.ownedName, { fontSize: Math.max(10, width * 0.11) }]} numberOfLines={2}>
        {card.name}
      </Text>
      <Text style={[styles.ownedHint, { fontSize: Math.max(9, width * 0.08) }]}>📷 사진 없음</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  owned: {
    borderWidth: 3,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 6,
  },
  ownedName: { fontWeight: '700', color: colors.text, textAlign: 'center' },
  ownedHint: { color: colors.sub },
});
