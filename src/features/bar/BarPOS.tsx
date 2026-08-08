import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
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
    <div className="flex shrink-0 items-center justify-between gap-2 px-1 py-1 text-xs text-neutral-400 sm:text-sm">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="inline-flex items-center gap-1 rounded px-1.5 py-1 font-semibold disabled:opacity-30"
        aria-label={`Pàgina anterior de ${label}`}
      >
        <ChevronLeft size={16} /> Anterior
      </button>
      <span>{page + 1} / {pageCount}</span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount - 1}
        className="inline-flex items-center gap-1 rounded px-1.5 py-1 font-semibold disabled:opacity-30"
        aria-label={`Pàgina següent de ${label}`}
      >
        Següent <ChevronRight size={16} />
      </button>
    </div>
  );
};

const ProductMenu: React.FC<{
  products: BarProduct[];
  productPage: number;
  productPageCount: number;
  onProductPage: (page: number) => void;
  onAdd: (product: BarProduct) => void;
}> = ({ products, productPage, productPageCount, onProductPage, onAdd }) => {
  const visible = products.slice(productPage * PRODUCTS_PER_PAGE, (productPage + 1) * PRODUCTS_PER_PAGE);
  const rows = visible.length <= 9 ? 3 : 4;

  if (products.length === 0) {
    return <p className="m-auto max-w-xs text-center text-sm text-neutral-400">Cap producte. Afegeix-ne des del panell de la barra.</p>;
  }

  return (
    <>
      <div
        className="grid min-h-0 flex-1 grid-cols-3 gap-1.5 sm:gap-2 md:grid-cols-4"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
      >
        {visible.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onAdd(product)}
            className="flex min-w-0 flex-col items-center justify-center rounded border border-neutral-700 bg-neutral-800 p-1.5 transition-transform duration-75 active:scale-[0.97] active:border-brand active:bg-brand sm:p-2"
          >
            <span className="line-clamp-2 break-words text-center text-sm font-bold leading-tight sm:text-base">{product.name}</span>
            <span className="mt-0.5 font-mono text-xs text-neutral-300 sm:text-sm">{formatPrice(product.price)}</span>
          </button>
        ))}
      </div>
      <Pager page={productPage} pageCount={productPageCount} onChange={onProductPage} label="productes" />
    </>
  );
};

const TicketLines: React.FC<{
  items: CartItem[];
  onRemove: (productId: string) => void;
}> = ({ items, onRemove }) => {
  const listRef = useRef<HTMLUListElement>(null);
  const lineCount = items.length;

  // En afegir una línia nova, la baixem a la vista: qui cobra ha de veure
  // sempre l'últim producte que acaba de tocar.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lineCount]);

  if (lineCount === 0) {
    return <p className="m-auto text-center text-xs text-neutral-500 sm:text-sm">Toca un producte per començar.</p>;
  }

  return (
    <ul ref={listRef} className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain sm:gap-2">
      {items.map((item) => (
        <li key={item.product.id}>
          <button
            type="button"
            onClick={() => onRemove(item.product.id)}
            className="flex w-full min-w-0 items-center justify-between gap-2 rounded bg-neutral-800 p-2 text-left transition-transform duration-75 active:scale-[0.99] active:bg-neutral-700 sm:p-3"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="w-7 shrink-0 rounded bg-neutral-900 py-0.5 text-center text-xs font-bold">{item.quantity}</span>
              <span className="line-clamp-2 min-w-0 break-words text-sm font-medium">{item.product.name}</span>
            </span>
            <span className="shrink-0 font-mono text-sm text-neutral-300">{formatPrice(item.product.price * item.quantity)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};

const CashControls: React.FC<{
  total: number;
  cash: number;
  change: number;
  onCash: (amount: number) => void;
  onReset: () => void;
  showTotal?: boolean;
  roomy?: boolean;
}> = ({ total, cash, change, onCash, onReset, showTotal = true, roomy = false }) => (
  <div className="shrink-0 border-t-2 border-black bg-neutral-900">
    {showTotal && (
      <div className="flex items-center justify-between bg-black px-3 py-1.5 sm:px-4 sm:py-2">
        <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">Total</span>
        <span className="font-mono text-xl font-bold sm:text-2xl">{formatPrice(total)}</span>
      </div>
    )}
    <div className="grid grid-cols-4 gap-1 p-1.5 sm:gap-1.5 sm:p-2">
      <button type="button" onClick={onReset} className={cn('rounded bg-red-900/80 text-xs font-bold transition-transform duration-75 active:scale-[0.97] active:bg-red-700', roomy ? 'h-11 sm:h-12' : 'h-8 sm:h-10')}>
        Netejar
      </button>
      {DENOMINATIONS.map((amount) => (
        <button
          key={amount}
          type="button"
          onClick={() => onCash(amount)}
          className={cn('rounded border border-emerald-700/50 bg-emerald-800/80 font-bold transition-transform duration-75 active:scale-[0.97] active:bg-emerald-600', roomy ? 'h-11 text-base sm:h-12 sm:text-lg' : 'h-8 text-sm sm:h-10 sm:text-base')}
        >
          +{amount}€
        </button>
      ))}
    </div>
    <div className="grid grid-cols-2 divide-x divide-neutral-700 border-t border-neutral-700">
      <div className="min-w-0 px-3 py-1.5 sm:px-4 sm:py-2">
        <span className="block text-[0.65rem] font-bold uppercase tracking-wide text-neutral-400">Entregat</span>
        <span className="block truncate font-mono text-lg font-bold text-white sm:text-2xl">{formatPrice(cash)}</span>
      </div>
      <div className="min-w-0 px-3 py-1.5 sm:px-4 sm:py-2">
        <span className="block text-[0.65rem] font-bold uppercase tracking-wide text-amber-400">Canvi</span>
        <span className={cn('block truncate font-mono text-lg font-bold sm:text-2xl', change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
          {formatPrice(change)}
        </span>
      </div>
    </div>
  </div>
);

/** Mòbil: Productes + Tiquet o Tiquet + Canvi. Escriptori: tot a un clic. */
export const BarPOS: React.FC = () => {
  const navigate = useNavigate();
  const { data: products } = useCollection<BarProduct>(barProductsQuery(), []);
  const [state, dispatch] = useReducer(posReducer, { cart: [], cash: 0 });
  const [productPage, setProductPage] = useState(0);
  const [cashOpen, setCashOpen] = useState(false);
  const productPageCount = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const total = useMemo(() => state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [state.cart]);
  const change = state.cash - total;

  useEffect(() => setProductPage((page) => Math.min(page, productPageCount - 1)), [productPageCount]);

  const addProduct = (product: BarProduct) => dispatch({ type: 'add', product });

  const ticket = (
    <>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-700 bg-neutral-900 px-3 py-2 sm:px-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Tiquet</h2>
        <button
          type="button"
          onClick={() => dispatch({ type: 'clear' })}
          disabled={state.cart.length === 0}
          aria-label="Buidar el tiquet"
          className="inline-flex shrink-0 items-center gap-1.5 rounded bg-red-900/60 px-2 py-1.5 text-sm text-red-100 active:bg-red-900 disabled:opacity-40"
        >
          <Trash2 size={15} /> <span className="hidden sm:inline">Buidar</span>
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col p-1.5 sm:p-2">
        <TicketLines items={state.cart} onRemove={(productId) => dispatch({ type: 'remove', productId })} />
      </div>
    </>
  );

  return (
    <div className="flex h-[100dvh] w-full touch-manipulation select-none flex-col overflow-hidden bg-neutral-900 text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-700 bg-neutral-800 px-3 py-2.5 sm:px-4 sm:py-3">
        <h1 className="min-w-0 text-lg font-bold tracking-wide sm:text-xl">Barra Aramunt</h1>
        <button type="button" onClick={() => navigate('/panell/barra')} className="inline-flex shrink-0 items-center gap-1.5 rounded bg-neutral-700 px-2.5 py-1.5 text-sm active:bg-neutral-600">
          <X size={16} /> Sortir
        </button>
      </header>

      <div className="flex min-h-0 flex-1 md:hidden">
        <div className="flex min-h-0 flex-1 flex-col">
          <section className={cn('flex min-h-0 flex-col border-b border-neutral-700', cashOpen ? 'shrink-0' : 'flex-1')}>
            <button
              type="button"
              onClick={() => setCashOpen(false)}
              className="flex shrink-0 items-center justify-between px-3 py-2 text-left text-sm font-bold uppercase tracking-wide"
              aria-expanded={!cashOpen}
            >
              Productes <ChevronDown size={18} className={cn('transition-transform', cashOpen && '-rotate-90')} />
            </button>
            {!cashOpen && <div className="flex min-h-0 flex-1 flex-col px-2 pb-2"><ProductMenu products={products} productPage={productPage} productPageCount={productPageCount} onProductPage={setProductPage} onAdd={addProduct} /></div>}
          </section>

          <section className={cn('flex min-h-0 flex-col border-b border-neutral-700', cashOpen ? 'flex-1' : 'flex-1')}>
            {ticket}
          </section>

          <section className="shrink-0">
            <button
              type="button"
              onClick={() => setCashOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-3 bg-neutral-800 px-3 py-2 text-left"
              aria-expanded={cashOpen}
            >
              <span className="text-sm font-bold uppercase tracking-wide text-neutral-300">Total</span>
              <span className="flex items-center gap-2 font-mono text-xl font-bold text-white">
                {formatPrice(total)} <ChevronDown size={18} className={cn('transition-transform', cashOpen && 'rotate-180')} />
              </span>
            </button>
            {cashOpen && <CashControls total={total} cash={state.cash} change={change} onCash={(amount) => dispatch({ type: 'cash', amount })} onReset={() => dispatch({ type: 'resetCash' })} showTotal={false} roomy />}
          </section>
        </div>
      </div>

      <div className="hidden min-h-0 flex-1 md:flex">
        <section className="flex min-h-0 w-7/12 flex-col border-r border-neutral-700 p-3 lg:p-4">
          <ProductMenu products={products} productPage={productPage} productPageCount={productPageCount} onProductPage={setProductPage} onAdd={addProduct} />
        </section>
        <section className="flex min-h-0 w-5/12 flex-col bg-neutral-800">
          {ticket}
          <CashControls total={total} cash={state.cash} change={change} onCash={(amount) => dispatch({ type: 'cash', amount })} onReset={() => dispatch({ type: 'resetCash' })} />
        </section>
      </div>
    </div>
  );
};
