import { useEffect, useState } from 'react';
import { onSnapshot, type Query } from 'firebase/firestore';
import type { WithId } from '../types';

export interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

interface Snapshot<T> {
  key: string;
  data: T[];
  error: Error | null;
}

const EMPTY: Snapshot<never> = { key: '', data: [], error: null };

/**
 * Subscripció tipada a una consulta de Firestore.
 *
 * `query` es reconstrueix a cada render, així que la identitat real de la
 * subscripció són els `deps` (els paràmetres que la componen). Passar-hi `null`
 * la desactiva, cosa útil mentre encara falta un id.
 *
 * `loading` es dedueix comparant la clau del darrer snapshot amb la clau
 * actual, en comptes d'escriure l'estat dins de l'efecte: així no hi ha cap
 * render extra ni cap risc d'encadenar actualitzacions.
 */
export function useCollection<T extends WithId>(
  query: Query | null,
  deps: unknown[],
): CollectionState<T> {
  const key = JSON.stringify(deps);
  const [snapshot, setSnapshot] = useState<Snapshot<T>>(EMPTY as Snapshot<T>);

  useEffect(() => {
    if (!query) return;

    return onSnapshot(
      query,
      (result) => {
        setSnapshot({
          key,
          data: result.docs.map((document) => ({ id: document.id, ...document.data() }) as T),
          error: null,
        });
      },
      (error) => {
        console.error('Firestore collection error', error);
        setSnapshot({ key, data: [], error });
      },
    );
    // `query` es recrea a cada render; la dependència real és `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!query) return { data: [], loading: false, error: null };

  return {
    data: snapshot.data,
    loading: snapshot.key !== key,
    error: snapshot.error,
  };
}
