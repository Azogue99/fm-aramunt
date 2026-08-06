import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface DocumentState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/** Subscripció tipada a un únic document. `path` a null desactiva la subscripció. */
export function useDocument<T>(collectionName: string, docId: string | null): DocumentState<T> {
  const [state, setState] = useState<DocumentState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!docId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    return onSnapshot(
      doc(db, collectionName, docId),
      (snapshot) => {
        const data = snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null;
        setState({ data, loading: false, error: null });
      },
      (error) => {
        console.error('Firestore document error', error);
        setState({ data: null, loading: false, error });
      },
    );
  }, [collectionName, docId]);

  return state;
}
