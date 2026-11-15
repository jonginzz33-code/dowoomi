// 카드 데이터 구조
// 판(Edition) → 시리즈(Series) → 세트(CardSet) → 카드(Card) → 버전(Variant)

export type EditionId = 'ko' | 'ja' | 'en';

/** 같은 카드라도 인쇄 버전이 다르면 따로 모읍니다. */
export type VariantId =
  | 'normal' // 일반
  | 'holo' // 홀로
  | 'reverse' // 리버스 홀로
  | 'firstEdition' // 1st 에디션
  | 'shadowless' // 섀도리스
  | 'unlimited' // 언리미티드
  | 'pokeball' // 몬스터볼 미러
  | 'masterball' // 마스터볼 미러
  | 'promo'; // 프로모 스탬프

export type EnergyType =
  | 'grass'
  | 'fire'
  | 'water'
  | 'lightning'
  | 'psychic'
  | 'fighting'
  | 'darkness'
  | 'metal'
  | 'dragon'
  | 'fairy'
  | 'colorless';

export type CardCategory = 'pokemon' | 'trainer' | 'energy';

export interface Card {
  /** 판 안에서 겹치지 않는 고유 ID (예: "sv2a-001") */
  id: string;
  /** 카드에 인쇄된 번호 (예: "001") */
  number: string;
  name: string;
  category?: CardCategory;
  type?: EnergyType;
  /** 카드에 인쇄된 레어도 표기 그대로 (C, U, R, RR, SAR …) */
  rarity?: string;
  /** 없으면 ['normal'] 하나로 봅니다. */
  variants?: VariantId[];
}

export interface CardSet {
  id: string;
  name: string;
  /** 세트 코드 (예: "SV2a", "MEW") */
  code?: string;
  /** YYYY-MM-DD */
  releaseDate?: string;
  /** 카드에 인쇄된 공식 장수 (예: 165) — 시크릿 카드는 제외 */
  officialCount?: number;
  cards: Card[];
}

export interface Series {
  id: string;
  name: string;
  /** 최신 세트가 먼저 오도록 정렬된 목록 */
  sets: CardSet[];
}

export interface EditionData {
  edition: EditionId;
  /** 데이터를 만든 날짜 */
  updatedAt: string;
  /** 데이터 출처 설명 */
  source: string;
  /** 샘플 데이터면 true — 화면에 안내를 띄웁니다. */
  sample?: boolean;
  /** 최신 시리즈가 먼저 오도록 정렬된 목록 */
  series: Series[];
}
