import { addDoc, collection, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BarProduct } from '../types';

export const BAR_PRODUCTS = 'bar_products';

export const barProductsQuery = () => query(collection(db, BAR_PRODUCTS), orderBy('order', 'asc'));

export function createProduct(product: Omit<BarProduct, 'id'>) {
  return addDoc(collection(db, BAR_PRODUCTS), product);
}

export function updateProduct(id: string, patch: Partial<Omit<BarProduct, 'id'>>) {
  return updateDoc(doc(db, BAR_PRODUCTS, id), patch);
}

export function deleteProduct(id: string) {
  return deleteDoc(doc(db, BAR_PRODUCTS, id));
}
