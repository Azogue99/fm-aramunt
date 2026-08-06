import React, { useEffect, useMemo, useReducer, useState } from 'react';
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

function useMobileLayout() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return mobile;
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
            className="flex min-w-0 flex-col items-center justify-center rounded border border-neutral-700 bg-neutral-800 p-1.5 transition-colors active:border-brand active:bg-brand sm:p-2"
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
  empty: boolean;
  onRemove: (productId: string) => void;
}> = ({ items, empty, onRemove }) => {
  if (empty) return <p className="m-auto text-center text-xs text-neutral-500 sm:text-sm">Toca un producte per començar.</p>;

  return (
    <ul className="flex min-h-0 flex-1 flex-col justify-center gap-1.5 overflow-hidden sm:gap-2">
      {items.map((item) => (
        <li key={item.product.id}>
          <button
            type="button"
            onClick={() => onRemove(item.product.id)}
            className="flex w-full min-w-0 items-center justify-between gap-2 rounded bg-neutral-800 p-2 text-left active:bg-neutral-700 sm:p-3"
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
}> = ({ total, cash, change, onCash, onReset }) => (
  <div className="shrink-0 border-t-2 border-black bg-neutral-900">
    <div className="flex items-center justify-between bg-black px-3 py-1.5 sm:px-4 sm:py-2">
      <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">Total</span>
      <span className="font-mono text-xl font-bold sm:text-2xl">{formatPrice(total)}</span>
    </div>
    <div className="grid grid-cols-4 gap-1 p-1.5 sm:gap-1.5 sm:p-2">
      <button type="button" onClick={onReset} className="h-8 rounded bg-red-900/80 text-xs font-bold active:bg-red-700 sm:h-10">
        Netejar
      </button>
      {DENOMINATIONS.map((amount) => (
        <button
          key={amount}
          type="button"
          onClick={() => onCash(amount)}
          className="h-8 rounded border border-emerald-700/50 bg-emerald-800/80 text-sm font-bold active:bg-emerald-600 sm:h-10 sm:text-base"
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
        <span className={cn('block truncate font-mono text-lg font-bold sm:text-2xl', change >= 0 ? 'text-emerald-400' : 'text-neutral-600')}>
          {formatPrice(Math.max(change, 0))}
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
  const [cartPage, setCartPage] = useState(0);
  const [cashOpen, setCashOpen] = useState(false);
  const mobile = useMobileLayout();
  const cartItemsPerPage = mobile ? 1 : 6;
  const productPageCount = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const cartPageCount = Math.max(1, Math.ceil(state.cart.length / cartItemsPerPage));
  const visibleCart = state.cart.slice(cartPage * cartItemsPerPage, (cartPage + 1) * cartItemsPerPage);
  const total = useMemo(() => state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [state.cart]);
  const change = state.cash - total;

  useEffect(() => setProductPage((page) => Math.min(page, productPageCount - 1)), [productPageCount]);
  useEffect(() => setCartPage((page) => Math.min(page, cartPageCount - 1)), [cartPageCount]);

  const addProduct = (product: BarProduct) => {
    const isNewLine = !state.cart.some((item) => item.product.id === product.id);
    const nextLineCount = state.cart.length + Number(isNewLine);
    dispatch({ type: 'add', product });
    setCartPage(Math.floor((nextLineCount - 1) / cartItemsPerPage));
  };

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
        <Pager page={cartPage} pageCount={cartPageCount} onChange={setCartPage} label="tiquet" />
        <TicketLines items={visibleCart} empty={state.cart.length === 0} onRemove={(productId) => dispatch({ type: 'remove', productId })} />
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
              <span className="text-sm font-bold uppercase tracking-wide text-amber-400">Canvi</span>
              <span className="flex items-center gap-2 font-mono text-lg font-bold text-emerald-400">
                {formatPrice(Math.max(change, 0))} <ChevronDown size={18} className={cn('transition-transform', cashOpen && 'rotate-180')} />
              </span>
            </button>
            {cashOpen && <CashControls total={total} cash={state.cash} change={change} onCash={(amount) => dispatch({ type: 'cash', amount })} onReset={() => dispatch({ type: 'resetCash' })} />}
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
