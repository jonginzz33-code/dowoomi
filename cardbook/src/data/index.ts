import type { Card, CardSet, EditionData, EditionId, Series, VariantId } from './types';

// 앱에 함께 들어가는 카드 목록. scripts/ 의 수집 스크립트가 이 파일들을 새로 만듭니다.
import ko from './editions/ko.json';
import ja from './editions/ja.json';
import en from './editions/en.json';

const DATA: Record<EditionId, EditionData> = {
  ko: ko as EditionData,
  ja: ja as EditionData,
  en: en as EditionData,
};

export const getEdition = (id: EditionId): EditionData => DATA[id];

export const isEditionId = (v: unknown): v is EditionId => v === 'ko' || v === 'ja' || v === 'en';

export function findSet(edition: EditionId, setId: string): { series: Series; set: CardSet } | null {
  for (const series of DATA[edition].series) {
    const set = series.sets.find((s) => s.id === setId);
    if (set) return { series, set };
  }
  return null;
}

export function findCard(edition: EditionId, cardId: string): { series: Series; set: CardSet; card: Card } | null {
  for (const series of DATA[edition].series) {
    for (const set of series.sets) {
      const card = set.cards.find((c) => c.id === cardId);
      if (card) return { series, set, card };
    }
  }
  return null;
}

export const cardVariants = (card: Card): VariantId[] =>
  card.variants && card.variants.length > 0 ? card.variants : ['normal'];

export function allCards(edition: EditionId): Card[] {
  return DATA[edition].series.flatMap((s) => s.sets.flatMap((set) => set.cards));
}
