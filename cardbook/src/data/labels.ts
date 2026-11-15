import type { EditionId, EnergyType, VariantId } from './types';

export const EDITIONS: { id: EditionId; label: string; sub: string; flag: string }[] = [
  { id: 'ko', label: '한국판', sub: '포켓몬코리아 정식 발매', flag: '🇰🇷' },
  { id: 'ja', label: '일본판', sub: '일본 정식 발매', flag: '🇯🇵' },
  { id: 'en', label: '영문판', sub: '북미·유럽 정식 발매', flag: '🇺🇸' },
];

export const editionLabel = (id: EditionId) => EDITIONS.find((e) => e.id === id)?.label ?? id;

export const VARIANT_LABELS: Record<VariantId, string> = {
  normal: '일반',
  holo: '홀로',
  reverse: '리버스 홀로',
  firstEdition: '1st 에디션',
  shadowless: '섀도리스',
  unlimited: '언리미티드',
  pokeball: '몬스터볼 미러',
  masterball: '마스터볼 미러',
  promo: '프로모',
};

export const TYPE_INFO: Record<EnergyType, { label: string; color: string }> = {
  grass: { label: '풀', color: '#5DAE4A' },
  fire: { label: '불꽃', color: '#E5533D' },
  water: { label: '물', color: '#3D8FE5' },
  lightning: { label: '번개', color: '#E8B923' },
  psychic: { label: '초', color: '#9B5BC9' },
  fighting: { label: '격투', color: '#B5682E' },
  darkness: { label: '악', color: '#3E3A4F' },
  metal: { label: '강철', color: '#8A97A6' },
  dragon: { label: '드래곤', color: '#B08A2E' },
  fairy: { label: '페어리', color: '#E27BB0' },
  colorless: { label: '무색', color: '#A8A29A' },
};
