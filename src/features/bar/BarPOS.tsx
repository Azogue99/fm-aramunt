import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingCart, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const PRODUCTS_PER_PAGE = 12;
const CART_ITEMS_PER_PAGE = 6;
const DENOMINATIONS = [0.5, 1, 2, 5, 10, 20, 50];

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

const Pager: React.FC<{
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  label: string;
}> = ({ page, pageCount, onChange, label }) => {
  if (pageCount < 2) return null;

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 px-1 py-2 text-sm text-neutral-400">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold disabled:opacity-30"
        aria-label={`Pàgina anterior de ${label}`}
      >
        <ChevronLeft size={18} /> Anterior
      </button>
      <span>{page + 1} / {pageCount}</span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount - 1}
        className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold disabled:opacity-30"
        aria-label={`Pàgina següent de ${label}`}
      >
        Següent <ChevronRight size={18} />
      </button>
    </div>
  );
};

/** TPV en dues pantalles: carta i cobrament, sense cap zona amb scroll. */
export const BarPOS: React.FC = () => {
  const navigate = useNavigate();
  const { data: products } = useCollection<BarProduct>(barProductsQuery(), []);
  const [state, dispatch] = useReducer(posReducer, { cart: [], cash: 0 });
  const [screen, setScreen] = useState<'products' | 'checkout'>('products');
  const [productPage, setProductPage] = useState(0);
  const [cartPage, setCartPage] = useState(0);

  const productPageCount = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const cartPageCount = Math.max(1, Math.ceil(state.cart.length / CART_ITEMS_PER_PAGE));
  const visibleProducts = products.slice(productPage * PRODUCTS_PER_PAGE, (productPage + 1) * PRODUCTS_PER_PAGE);
  const visibleCart = state.cart.slice(cartPage * CART_ITEMS_PER_PAGE, (cartPage + 1) * CART_ITEMS_PER_PAGE);
  const productRows = visibleProducts.length <= 9 ? 3 : 4;
  const total = useMemo(
    () => state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [state.cart],
  );
  const itemCount = useMemo(() => state.cart.reduce((sum, item) => sum + item.quantity, 0), [state.cart]);
  const change = state.cash - total;

  useEffect(() => setProductPage((page) => Math.min(page, productPageCount - 1)), [productPageCount]);
  useEffect(() => setCartPage((page) => Math.min(page, cartPageCount - 1)), [cartPageCount]);

  const addProduct = (product: BarProduct) => {
    const isNewLine = !state.cart.some((item) => item.product.id === product.id);
    const nextLineCount = state.cart.length + Number(isNewLine);
    dispatch({ type: 'add', product });
    setCartPage(Math.floor((nextLineCount - 1) / CART_ITEMS_PER_PAGE));
  };

  return (
    <div className="flex h-[100dvh] w-full touch-manipulation select-none flex-col overflow-hidden bg-neutral-900 text-white">
      {screen === 'products' ? (
        <>
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-700 bg-neutral-800 px-4 py-3 sm:px-5 sm:py-4">
            <h1 className="min-w-0 text-2xl font-bold tracking-wide sm:text-3xl">Barra Aramunt</h1>
            <button
              type="button"
              onClick={() => navigate('/panell/barra')}
              className="inline-flex shrink-0 items-center gap-2 rounded bg-neutral-700 px-3 py-2 text-base font-medium active:bg-neutral-600"
            >
              <X size={20} /> Sortir
            </button>
          </header>

          <main className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
            {products.length === 0 ? (
              <p className="m-auto max-w-xs text-center text-base text-neutral-400">
                Cap producte. Afegeix-ne des del panell de la barra.
              </p>
            ) : (
              <>
                <div
                  className="grid min-h-0 flex-1 grid-cols-3 gap-2 sm:gap-3"
                  style={{ gridTemplateRows: `repeat(${productRows}, minmax(0, 1fr))` }}
                >
                  {visibleProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="flex min-w-0 flex-col items-center justify-center rounded border border-neutral-700 bg-neutral-800 p-2 transition-colors active:border-brand active:bg-brand sm:p-3"
                    >
                      <span className="line-clamp-2 break-words text-center text-base font-bold leading-tight sm:text-xl">
                        {product.name}
                      </span>
                      <span className="mt-1 font-mono text-sm text-neutral-300 sm:text-lg">{formatPrice(product.price)}</span>
                    </button>
                  ))}
                </div>
                <Pager page={productPage} pageCount={productPageCount} onChange={setProductPage} label="productes" />
              </>
            )}
          </main>

          <footer className="shrink-0 border-t border-neutral-700 bg-neutral-800 p-3 sm:p-4">
            <button
              type="button"
              onClick={() => setScreen('checkout')}
              className="flex w-full items-center justify-between gap-3 rounded bg-brand px-4 py-3 text-left text-white active:bg-brand-ink sm:px-5 sm:py-4"
            >
              <span className="flex min-w-0 items-center gap-3">
                <ShoppingCart size={24} className="shrink-0" />
                <span className="min-w-0">
                  <span className="block text-lg font-bold">Tiquet</span>
                  <span className="block text-sm text-white/80">{itemCount} {itemCount === 1 ? 'article' : 'articles'}</span>
                </span>
              </span>
              <span className="shrink-0 font-mono text-2xl font-bold">{formatPrice(total)}</span>
            </button>
          </footer>
        </>
      ) : (
        <>
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-700 bg-neutral-800 px-4 py-3 sm:px-5 sm:py-4">
            <button
              type="button"
              onClick={() => setScreen('products')}
              className="inline-flex items-center gap-2 rounded px-1 py-2 text-base font-semibold text-neutral-200 active:text-white"
            >
              <ArrowLeft size={22} /> Productes
            </button>
            <h1 className="text-xl font-bold sm:text-2xl">Tiquet</h1>
            <button
              type="button"
              onClick={() => dispatch({ type: 'clear' })}
              disabled={state.cart.length === 0}
              aria-label="Buidar el tiquet"
              className="inline-flex shrink-0 items-center gap-2 rounded bg-red-900/60 px-3 py-2 text-sm font-medium text-red-100 active:bg-red-900 disabled:opacity-40"
            >
              <Trash2 size={18} /> <span className="hidden sm:inline">Buidar</span>
            </button>
          </header>

          <main className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
            <Pager page={cartPage} pageCount={cartPageCount} onChange={setCartPage} label="tiquet" />
            {state.cart.length === 0 ? (
              <p className="m-auto text-center text-base text-neutral-500">El tiquet és buit.</p>
            ) : (
              <ul className="grid min-h-0 flex-1 content-center gap-2 sm:gap-3">
                {visibleCart.map((item) => (
                  <li key={item.product.id}>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'remove', productId: item.product.id })}
                      className="flex w-full min-w-0 items-center justify-between gap-3 rounded border border-neutral-700 bg-neutral-800 p-3 text-left active:bg-neutral-700 sm:p-4"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="w-9 shrink-0 rounded bg-neutral-900 py-1 text-center font-mono text-sm font-bold">{item.quantity}</span>
                        <span className="min-w-0 break-words text-base font-semibold sm:text-lg">{item.product.name}</span>
                      </span>
                      <span className="shrink-0 font-mono text-base text-neutral-300 sm:text-lg">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </main>

          <footer className="shrink-0 border-t-2 border-black bg-neutral-900">
            <div className="flex items-center justify-between bg-black px-4 py-2.5 sm:px-5 sm:py-3">
              <span className="text-sm font-bold uppercase tracking-wide text-neutral-400">Total</span>
              <span className="font-mono text-3xl font-bold">{formatPrice(total)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 p-3 sm:gap-3 sm:p-4">
              <button
                type="button"
                onClick={() => dispatch({ type: 'resetCash' })}
                className="h-11 rounded bg-red-900/80 text-sm font-bold active:bg-red-700 sm:h-12"
              >
                Netejar
              </button>
              {DENOMINATIONS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => dispatch({ type: 'cash', amount })}
                  className="h-11 rounded border border-emerald-700/50 bg-emerald-800/80 text-base font-bold active:bg-emerald-600 sm:h-12 sm:text-lg"
                >
                  +{amount}€
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 divide-x divide-neutral-700 border-t border-neutral-700">
              <div className="min-w-0 px-4 py-2.5 sm:px-5 sm:py-3">
                <span className="block text-xs font-bold uppercase tracking-wide text-neutral-400">Entregat</span>
                <span className="block truncate font-mono text-2xl font-bold text-white sm:text-3xl">{formatPrice(state.cash)}</span>
              </div>
              <div className="min-w-0 px-4 py-2.5 sm:px-5 sm:py-3">
                <span className="block text-xs font-bold uppercase tracking-wide text-amber-400">Canvi</span>
                <span className={cn('block truncate font-mono text-2xl font-bold sm:text-3xl', change >= 0 ? 'text-emerald-400' : 'text-neutral-600')}>
                  {formatPrice(Math.max(change, 0))}
                </span>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};
