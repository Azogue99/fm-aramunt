import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';
import { Modal } from './Modal';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
}

interface FeedbackValue {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (request: ConfirmRequest) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackValue | null>(null);

/** Substitueix `alert()` i `confirm()`, que bloquejaven el fil i no es podien estilar. */
// eslint-disable-next-line react-refresh/only-export-components
export function useFeedback(): FeedbackValue {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error('useFeedback ha d\'estar dins de <FeedbackProvider>');
  return value;
}

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'bg-emerald-800',
  error: 'bg-red-800',
  info: 'bg-ink',
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<ConfirmRequest | null>(null);
  const resolver = useRef<((result: boolean) => void) | null>(null);
  const nextId = useRef(0);

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 4000);
  }, []);

  const confirm = useCallback((request: ConfirmRequest) => {
    setPending(request);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setPending(null);
  }, []);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4">
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.output
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={`pointer-events-auto max-w-sm rounded px-4 py-3 text-sm font-medium text-white ${TONE_CLASSES[item.tone]}`}
            >
              {item.message}
            </motion.output>
          ))}
        </AnimatePresence>
      </div>

      <Modal
        open={pending !== null}
        title={pending?.title ?? ''}
        onClose={() => settle(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => settle(false)}>
              Cancel·lar
            </Button>
            <Button variant={pending?.destructive ? 'danger' : 'primary'} onClick={() => settle(true)}>
              {pending?.confirmLabel ?? 'Confirmar'}
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-muted">{pending?.message}</p>
      </Modal>
    </FeedbackContext.Provider>
  );
};
