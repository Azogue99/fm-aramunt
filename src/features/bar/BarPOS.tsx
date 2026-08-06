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
    <div className="flex h-screen w-screen touch-none select-none flex-col overflow-hidden bg-neutral-900 text-white lg:flex-row">
      {/* Productes */}
      <section className="flex h-1/2 flex-col border-neutral-700 lg:h-full lg:w-7/12 lg:border-r">
        <header className="z-10 flex items-center justify-between bg-neutral-800 px-4 py-3">
          <h1 className="text-lg font-bold tracking-wide">Barra Aramunt</h1>
          <button
            type="button"
            onClick={() => navigate('/panell/barra')}
            className="flex items-center gap-2 rounded bg-neutral-700 px-3 py-2 text-sm transition-colors hover:bg-neutral-600"
          >
            <X size={16} /> Sortir del TPV
          </button>
        </header>

        <div className="grid flex-1 auto-rows-[minmax(72px,1fr)] content-start gap-2 overflow-y-auto p-2 sm:grid-cols-3">
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
                className="flex flex-col items-center justify-center rounded border-2 border-neutral-700 bg-neutral-800 p-2 transition-colors active:border-brand active:bg-brand"
              >
                <span className="line-clamp-2 text-center text-lg font-bold leading-tight">{product.name}</span>
                <span className="mt-1 font-mono text-sm text-neutral-300">{formatPrice(product.price)}</span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Tiquet i canvi */}
      <section className="flex h-1/2 flex-col bg-neutral-800 lg:h-full lg:w-5/12">
        <header className="flex items-center justify-between bg-neutral-900 px-3 py-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Tiquet</h2>
          <button
            type="button"
            onClick={() => dispatch({ type: 'clear' })}
            className="flex items-center gap-2 rounded bg-red-900/60 px-3 py-1.5 text-sm text-red-200 transition-colors hover:bg-red-900"
          >
            <Trash2 size={14} /> Buidar
          </button>
        </header>

        <ul className="flex-1 space-y-1 overflow-y-auto p-2">
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
                  className="flex w-full items-center justify-between rounded bg-neutral-700/50 p-3 text-left transition-colors active:bg-neutral-600"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 rounded bg-neutral-900 py-1 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <span className="font-medium">{item.product.name}</span>
                  </span>
                  <span className="font-mono text-neutral-300">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex flex-col border-t-4 border-black">
          <div className="flex items-center justify-between bg-black px-4 py-2">
            <span className="text-sm font-bold uppercase tracking-wide text-neutral-400">Total</span>
            <span className="font-mono text-3xl font-bold">{formatPrice(total)}</span>
          </div>

          <div className="grid grid-cols-4 gap-2 p-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'resetCash' })}
              className="rounded bg-red-900/80 py-3 text-sm font-bold transition-colors active:bg-red-700"
            >
              Netejar
            </button>
            {DENOMINATIONS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => dispatch({ type: 'cash', amount })}
                className="rounded border border-emerald-700/50 bg-emerald-800/80 py-3 text-lg font-bold transition-colors active:bg-emerald-600"
              >
                +{amount}€
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-neutral-700 bg-neutral-900 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-neutral-400">
                Entregat: {formatPrice(state.cash)}
              </span>
              <span className="text-lg font-bold uppercase text-amber-400">Canvi</span>
            </div>
            <span
              className={cn(
                'font-mono text-4xl font-bold',
                change >= 0 ? 'text-emerald-400' : 'text-neutral-600',
              )}
            >
              {formatPrice(Math.max(change, 0))}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
