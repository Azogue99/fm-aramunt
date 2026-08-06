import React, { useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, X } from 'lucide-react';
import { useCollection } from '../../hooks/useCollection';
import { barProductsQuery } from '../../services/barProducts';
import { formatPrice } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { BarProduct } from '../../types';

interface CartItem {
  product: BarProduct;
  quantity: number;
}

interface PosState {
  cart: CartItem[];
  cash: number;
}

type PosAction =
  | { type: 'add'; product: BarProduct }
  | { type: 'remove'; productId: string }
  | { type: 'cash'; amount: number }
  | { type: 'resetCash' }
  | { type: 'clear' };

function posReducer(state: PosState, action: PosAction): PosState {
  switch (action.type) {
    case 'add': {
      const existing = state.cart.find((item) => item.product.id === action.product.id);
      const cart = existing
        ? state.cart.map((item) =>
            item.product.id === action.product.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...state.cart, { product: action.product, quantity: 1 }];
      return { ...state, cart };
    }
    case 'remove': {
      const existing = state.cart.find((item) => item.product.id === action.productId);
      if (!existing) return state;
      const cart =
        existing.quantity > 1
          ? state.cart.map((item) =>
              item.product.id === action.productId ? { ...item, quantity: item.quantity - 1 } : item,
            )
          : state.cart.filter((item) => item.product.id !== action.productId);
      return { ...state, cart };
    }
    case 'cash':
      return { ...state, cash: state.cash + action.amount };
    case 'resetCash':
      return { ...state, cash: 0 };
    case 'clear':
      return { cart: [], cash: 0 };
  }
}

const DENOMINATIONS = [0.5, 1, 2, 5, 10, 20, 50];

/**
 * Quiosc a pantalla completa: fons fosc a propòsit perquè es llegeixi de nit i
 * de reüll. És l'única pantalla que no segueix la paleta editorial, i ho fa
 * per una raó funcional, no decorativa.
 */
export const BarPOS: React.FC = () => {
  const navigate = useNavigate();
  const { data: products } = useCollection<BarProduct>(barProductsQuery(), []);
  const [state, dispatch] = useReducer(posReducer, { cart: [], cash: 0 });

  const total = useMemo(
    () => state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [state.cart],
  );
  const change = state.cash - total;

  return (
    <div className="flex h-[100dvh] w-full select-none flex-col overflow-hidden bg-neutral-900 text-white lg:flex-row">
      {/* Productes */}
      <section className="flex h-1/2 min-h-0 flex-col border-neutral-700 lg:h-full lg:w-7/12 lg:border-r">
        <header className="z-10 flex shrink-0 items-center justify-between gap-3 bg-neutral-800 px-3 py-2.5 sm:px-4 sm:py-3">
          <h1 className="min-w-0 text-base font-bold tracking-wide sm:text-lg">Barra Aramunt</h1>
          <button
            type="button"
            onClick={() => navigate('/panell/barra')}
            className="shrink-0 rounded bg-neutral-700 px-2.5 py-2 text-sm transition-colors hover:bg-neutral-600 sm:flex sm:items-center sm:gap-2 sm:px-3"
          >
            <X size={16} className="sm:inline-block" /> <span className="hidden sm:inline">Sortir del TPV</span><span className="sm:hidden">Sortir</span>
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-2 auto-rows-[minmax(72px,1fr)] content-start gap-2 overflow-y-auto overscroll-contain p-2 sm:grid-cols-3">
          {products.length === 0 ? (
            <p className="col-span-full mt-10 text-center text-neutral-400">
              Cap producte. Afegeix-ne des del panell de la barra.
            </p>
          ) : (
            products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => dispatch({ type: 'add', product })}
                style={{ touchAction: 'manipulation' }}
                className="flex min-w-0 flex-col items-center justify-center rounded border-2 border-neutral-700 bg-neutral-800 p-2 transition-colors active:border-brand active:bg-brand"
              >
                <span className="line-clamp-2 break-words text-center text-base font-bold leading-tight sm:text-lg">{product.name}</span>
                <span className="mt-1 font-mono text-sm text-neutral-300">{formatPrice(product.price)}</span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Tiquet i canvi */}
      <section className="flex h-1/2 min-h-0 flex-col bg-neutral-800 lg:h-full lg:w-5/12">
        <header className="flex shrink-0 items-center justify-between gap-3 bg-neutral-900 px-3 py-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Tiquet</h2>
          <button
            type="button"
            onClick={() => dispatch({ type: 'clear' })}
            className="shrink-0 rounded bg-red-900/60 px-3 py-1.5 text-sm text-red-200 transition-colors hover:bg-red-900 sm:flex sm:items-center sm:gap-2"
          >
            <Trash2 size={14} /> <span className="hidden sm:inline">Buidar</span>
          </button>
        </header>

        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
          {state.cart.length === 0 ? (
            <li className="mt-8 text-center text-sm text-neutral-500">
              Toca un producte per començar. Toca una línia del tiquet per treure&apos;n una unitat.
            </li>
          ) : (
            state.cart.map((item) => (
              <li key={item.product.id}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'remove', productId: item.product.id })}
                  className="flex w-full min-w-0 items-center justify-between gap-3 rounded bg-neutral-700/50 p-2.5 text-left transition-colors active:bg-neutral-600 sm:p-3"
                >
                  <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span className="w-8 shrink-0 rounded bg-neutral-900 py-1 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <span className="min-w-0 break-words font-medium">{item.product.name}</span>
                  </span>
                  <span className="shrink-0 font-mono text-neutral-300">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="shrink-0 border-t-4 border-black">
          <div className="flex items-center justify-between bg-black px-4 py-2">
            <span className="text-sm font-bold uppercase tracking-wide text-neutral-400">Total</span>
            <span className="shrink-0 font-mono text-2xl font-bold sm:text-3xl">{formatPrice(total)}</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 p-2 sm:gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'resetCash' })}
              className="rounded bg-red-900/80 py-2.5 text-xs font-bold transition-colors active:bg-red-700 sm:py-3 sm:text-sm"
            >
              Netejar
            </button>
            {DENOMINATIONS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => dispatch({ type: 'cash', amount })}
                className="rounded border border-emerald-700/50 bg-emerald-800/80 py-2.5 text-base font-bold transition-colors active:bg-emerald-600 sm:py-3 sm:text-lg"
              >
                +{amount}€
              </button>
            ))}
          </div>

          <div className="border-t border-neutral-700 bg-neutral-900">
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
              <span className="text-sm font-bold uppercase tracking-wide text-neutral-400">Entregat</span>
              <span className="shrink-0 font-mono text-3xl font-bold text-white sm:text-4xl">
                {formatPrice(state.cash)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-neutral-700 px-3 py-2.5 sm:px-4 sm:py-3">
              <span className="text-sm font-bold uppercase tracking-wide text-amber-400">Canvi</span>
              <span
                className={cn(
                  'shrink-0 font-mono text-3xl font-bold sm:text-4xl',
                  change >= 0 ? 'text-emerald-400' : 'text-neutral-600',
                )}
              >
                {formatPrice(Math.max(change, 0))}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
