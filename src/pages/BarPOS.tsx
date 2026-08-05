import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, useAnimation } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogOut, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  order: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const BarPOS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveredCash, setDeliveredCash] = useState<number>(0);
  const { signOut } = useAuth();
  const controls = useAnimation();

  useEffect(() => {
    const q = query(collection(db, 'bar_products'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => prods.push({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    });
    return () => unsub();
  }, []);

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }, [cart]);

  const change = useMemo(() => {
    return deliveredCash - total;
  }, [total, deliveredCash]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const clearCart = () => {
    setCart([]);
    setDeliveredCash(0);
  };

  const addCash = (amount: number) => {
    setDeliveredCash(prev => prev + amount);
  };

  const handleDragEnd = (_event: any, info: any) => {
    if (info.offset.x < -100) { // Swipe d'almenys 100px cap a l'esquerra
      clearCart();
    }
    controls.start({ x: 0 }); // Torna a la posició original si no és suficient o després del swipe
  };

  const cashDenominations = [0.5, 1, 2, 5, 10, 20, 50];

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 flex flex-row font-sans text-white select-none touch-none">
      
      {/* LEFT: Product Grid */}
      <div className="w-7/12 h-full flex flex-col border-r border-gray-700">
        <div className="p-4 bg-gray-800 flex justify-between items-center shadow-md z-10">
          <h1 className="text-xl font-bold text-red-500 tracking-wider">BAR ARAMUNT</h1>
          <button onClick={signOut} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition">
            <LogOut size={20} className="text-white" />
          </button>
        </div>
        
        <div className="flex-1 p-2 grid grid-cols-3 gap-2 overflow-hidden content-start auto-rows-[minmax(80px,1fr)]">
          {products.length === 0 ? (
             <div className="col-span-3 text-center text-gray-500 mt-10">Cap producte trobat. Afegeix-ne al Super-Admin.</div>
          ) : (
             products.map(prod => (
              <button
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="bg-gray-800 border-2 border-gray-700 rounded-xl p-2 flex flex-col items-center justify-center active:bg-red-600 active:border-red-500 transition-colors"
                style={{ touchAction: 'manipulation' }}
              >
                <span className="text-lg font-bold leading-tight line-clamp-2 text-center mb-1">{prod.name}</span>
                <span className="text-md text-red-400 font-mono">{prod.price.toFixed(2)}€</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Ticket & Change Calculator */}
      <div className="w-5/12 h-full flex flex-col bg-gray-800">
        
        {/* Ticket Header & Swipe Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-900">
            <h2 className="text-lg font-semibold uppercase">Tiquet Actual</h2>
            <button 
              onClick={clearCart} 
              className="flex items-center gap-1 px-3 py-1 bg-red-900/50 text-red-400 rounded hover:bg-red-900 transition"
            >
              <Trash2 size={16} /> Buidar
            </button>
          </div>

          <motion.div 
            className="flex-1 p-2 overflow-y-auto"
            drag="x"
            dragDirectionLock
            onDragEnd={handleDragEnd}
            animate={controls}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
          >
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 opacity-50">
                Llisca cap a l'esquerra per buidar
              </div>
            ) : (
              <ul className="space-y-1">
                {cart.map(item => (
                  <li 
                    key={item.product.id}
                    onClick={() => removeFromCart(item.product.id)}
                    className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg active:bg-gray-600 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white font-bold px-2 py-1 rounded text-sm w-8 text-center">
                        {item.quantity}
                      </span>
                      <span className="font-medium text-lg">{item.product.name}</span>
                    </div>
                    <span className="font-mono text-lg text-gray-300">
                      {(item.product.price * item.quantity).toFixed(2)}€
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>

        {/* Change Calculator (Fixed at bottom right) */}
        <div className="h-2/5 min-h-[250px] bg-gray-900 border-t-4 border-black flex flex-col">
          {/* Totals */}
          <div className="flex justify-between items-center px-4 py-2 bg-black">
            <span className="text-xl text-gray-400 font-bold uppercase">Total</span>
            <span className="text-4xl font-mono font-bold text-white">{total.toFixed(2)}€</span>
          </div>
          
          {/* Cash Input Buttons */}
          <div className="p-2 grid grid-cols-4 gap-2 flex-1">
            <button onClick={() => setDeliveredCash(0)} className="col-span-1 bg-red-900/80 rounded-lg text-white font-bold active:bg-red-700">
              C<br/><span className="text-xs font-normal">Netejar Efectiu</span>
            </button>
            {cashDenominations.map(amount => (
              <button 
                key={amount}
                onClick={() => addCash(amount)}
                className="bg-green-800/80 rounded-lg text-white font-bold text-xl active:bg-green-600 border border-green-700/50"
              >
                +{amount}€
              </button>
            ))}
          </div>

          {/* Change Result */}
          <div className="flex justify-between items-center px-4 py-3 bg-gray-800 border-t border-gray-700">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-widest">Entregat: {deliveredCash.toFixed(2)}€</span>
              <span className="text-xl font-bold uppercase text-yellow-500">Canvi a Tornar</span>
            </div>
            <span className={`text-5xl font-mono font-black ${change >= 0 ? 'text-green-400' : 'text-red-500'}`}>
              {change >= 0 ? change.toFixed(2) : '0.00'}€
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
