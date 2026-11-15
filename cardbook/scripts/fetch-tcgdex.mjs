#!/usr/bin/env node
// TCGdex API(https://tcgdex.dev, 무료·키 없음)에서 카드 목록을 받아
// src/data/editions/{ko,ja,en}.json 을 새로 만듭니다.
//
// 사용법:
//   node scripts/fetch-tcgdex.mjs                 # ko, ja, en 모두
//   node scripts/fetch-tcgdex.mjs ko              # 한국판만
//   node scripts/fetch-tcgdex.mjs en --series=sv  # 영문판 중 특정 시리즈만 (파일이 그 시리즈만으로 바뀜, 시험용)
//   node scripts/fetch-tcgdex.mjs ko --no-details # 레어도·타입·버전 없이 빠르게
//
// 카드 이미지는 받지 않습니다. 앱에는 사용자가 직접 찍은 사진만 들어갑니다.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.tcgdex.net/v2';
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'editions');
const CONCURRENCY = 6;

const args = process.argv.slice(2);
const langs = args.filter((a) => !a.startsWith('--'));
const editions = langs.length ? langs : ['ko', 'ja', 'en'];
const seriesFilter = args
  .find((a) => a.startsWith('--series='))
  ?.split('=')[1]
  ?.split(',');
const withDetails = !args.includes('--no-details');

// 판마다 이름이 현지어로 오므로 앱 내부 값으로 바꿔 줍니다.
const TYPE_MAP = {
  grass: ['Grass', '풀', '草'],
  fire: ['Fire', '불꽃', '炎'],
  water: ['Water', '물', '水'],
  lightning: ['Lightning', '번개', '雷'],
  psychic: ['Psychic', '초', '超'],
  fighting: ['Fighting', '격투', '闘'],
  darkness: ['Darkness', '악', '悪'],
  metal: ['Metal', '강철', '鋼'],
  dragon: ['Dragon', '드래곤', 'ドラゴン'],
  fairy: ['Fairy', '페어리', 'フェアリー'],
  colorless: ['Colorless', '무색', '無色'],
};
const CATEGORY_MAP = {
  pokemon: ['Pokemon', 'Pokémon', '포켓몬', 'ポケモン'],
  trainer: ['Trainer', '트레이너스', '트레이너', 'トレーナーズ', 'トレーナー'],
  energy: ['Energy', '에너지', 'エネルギー'],
};
const lookup = (map, value) =>
  value ? Object.keys(map).find((k) => map[k].some((n) => n.toLowerCase() === String(value).toLowerCase())) : undefined;

async function get(path, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${API}${path}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (e) {
      if (i === tries - 1) throw new Error(`${path}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 800 * 2 ** i));
    }
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

function variantsOf(v) {
  if (!v) return undefined;
  const list = [];
  if (v.firstEdition) list.push('firstEdition');
  if (v.normal) list.push('normal');
  if (v.holo) list.push('holo');
  if (v.reverse) list.push('reverse');
  if (v.wPromo) list.push('promo');
  return list.length > 1 ? list : undefined; // 하나뿐이면 굳이 표시하지 않음
}

async function buildEdition(lang) {
  console.log(`\n[${lang}] 시리즈 목록 받는 중…`);
  let seriesList = (await get(`/${lang}/series`)) ?? [];
  if (seriesFilter) seriesList = seriesList.filter((s) => seriesFilter.includes(s.id));

  const series = [];
  for (const s of seriesList) {
    const detail = await get(`/${lang}/series/${encodeURIComponent(s.id)}`);
    const setBriefs = detail?.sets ?? [];
    const sets = [];
    for (const brief of setBriefs) {
      const set = await get(`/${lang}/sets/${encodeURIComponent(brief.id)}`);
      if (!set?.cards?.length) continue;
      process.stdout.write(`  ${s.name} / ${set.name} (${set.cards.length}장)`);

      const cards = await mapLimit(set.cards, CONCURRENCY, async (c) => {
        const base = { id: c.id, number: c.localId, name: c.name };
        if (!withDetails) return base;
        const full = await get(`/${lang}/cards/${encodeURIComponent(c.id)}`);
        if (!full) return base;
        const card = { ...base };
        const category = lookup(CATEGORY_MAP, full.category);
        if (category) card.category = category;
        const type = lookup(TYPE_MAP, full.types?.[0]);
        if (type) card.type = type;
        if (full.rarity && full.rarity !== 'None') card.rarity = full.rarity;
        const variants = variantsOf(full.variants);
        if (variants) card.variants = variants;
        return card;
      });
      console.log(' ✓');

      sets.push({
        id: set.id,
        name: set.name,
        ...(set.abbreviation?.official ? { code: set.abbreviation.official } : {}),
        ...(set.releaseDate ? { releaseDate: set.releaseDate } : {}),
        ...(set.cardCount?.official ? { officialCount: set.cardCount.official } : {}),
        cards,
      });
    }
    if (sets.length === 0) continue;
    // 최신 세트가 위로
    sets.sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''));
    series.push({ id: s.id, name: s.name, sets });
  }
  // 최신 시리즈가 위로 (각 시리즈의 가장 최근 발매일 기준)
  const latest = (s) => s.sets[0]?.releaseDate ?? '';
  series.sort((a, b) => latest(b).localeCompare(latest(a)));

  const data = {
    edition: lang,
    updatedAt: new Date().toISOString().slice(0, 10),
    source: 'TCGdex (tcgdex.dev)',
    series,
  };
  await mkdir(OUT_DIR, { recursive: true });
  const file = join(OUT_DIR, `${lang}.json`);
  await writeFile(file, JSON.stringify(data) + '\n');
  const total = series.reduce((n, s) => n + s.sets.reduce((m, x) => m + x.cards.length, 0), 0);
  console.log(`[${lang}] 완료: 시리즈 ${series.length}개, 카드 ${total}장 → ${file}`);
}

for (const lang of editions) {
  if (!['ko', 'ja', 'en'].includes(lang)) {
    console.error(`지원하지 않는 판: ${lang} (ko, ja, en 중 하나)`);
    process.exit(1);
  }
  await buildEdition(lang);
}
