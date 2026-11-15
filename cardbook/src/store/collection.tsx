import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { cardVariants } from '@/data';
import type { Card, CardSet, EditionId, VariantId } from '@/data/types';
import { deletePhoto } from './photos';

/** 내가 가진 카드 한 버전에 대한 기록 */
export interface OwnedEntry {
  count: number;
  /** 앱 폴더에 저장된 사진 파일 이름 */
  photo?: string;
  updatedAt: number;
}

type Collection = Record<string, OwnedEntry>;

const STORAGE_KEY = 'cardbook.collection.v1';

export const entryKey = (edition: EditionId, cardId: string, variant: VariantId) => `${edition}|${cardId}|${variant}`;

interface CollectionApi {
  ready: boolean;
  get: (edition: EditionId, cardId: string, variant: VariantId) => OwnedEntry | undefined;
  /** 이 카드의 버전 중 하나라도 가지고 있는지 */
  isOwned: (edition: EditionId, card: Card) => boolean;
  /** 그리드에 보여줄 사진 (사진이 있는 첫 번째 버전) */
  coverPhoto: (edition: EditionId, card: Card) => string | undefined;
  setCount: (edition: EditionId, cardId: string, variant: VariantId, count: number) => void;
  setPhoto: (edition: EditionId, cardId: string, variant: VariantId, photo: string | undefined) => void;
  /** 세트 수집률: 버전 상관없이 카드 종류 기준 */
  setProgress: (edition: EditionId, set: CardSet) => { owned: number; total: number };
}

const Ctx = createContext<CollectionApi | null>(null);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Collection>({});
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setData(JSON.parse(raw) as Collection);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // 변경이 몰려도 저장은 잠깐 모아서 한 번에
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    }, 300);
  }, [data, ready]);

  const update = useCallback((key: string, fn: (prev: OwnedEntry | undefined) => OwnedEntry | undefined) => {
    setData((prev) => {
      const next = { ...prev };
      const value = fn(prev[key]);
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }, []);

  const api = useMemo<CollectionApi>(() => {
    const get: CollectionApi['get'] = (e, id, v) => data[entryKey(e, id, v)];
    const isOwned: CollectionApi['isOwned'] = (e, card) =>
      cardVariants(card).some((v) => (data[entryKey(e, card.id, v)]?.count ?? 0) > 0);
    return {
      ready,
      get,
      isOwned,
      coverPhoto: (e, card) => {
        for (const v of cardVariants(card)) {
          const p = data[entryKey(e, card.id, v)]?.photo;
          if (p) return p;
        }
        return undefined;
      },
      setCount: (e, id, v, count) =>
        update(entryKey(e, id, v), (prev) => {
          const c = Math.max(0, Math.min(999, Math.round(count)));
          if (c === 0 && !prev?.photo) return undefined;
          return { ...prev, count: c, updatedAt: Date.now() };
        }),
      setPhoto: (e, id, v, photo) => {
        const key = entryKey(e, id, v);
        const old = data[key]?.photo;
        if (old && old !== photo) deletePhoto(old);
        update(key, (prev) => {
          if (!photo && (prev?.count ?? 0) === 0) return undefined;
          // 사진을 올리면 최소 1장 가진 것으로 봅니다.
          return { count: Math.max(prev?.count ?? 0, photo ? 1 : 0), photo, updatedAt: Date.now() };
        });
      },
      setProgress: (e, set) => ({
        owned: set.cards.filter((c) => isOwned(e, c)).length,
        total: set.cards.length,
      }),
    };
  }, [data, ready, update]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCollection() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCollection must be used inside CollectionProvider');
  return v;
}
