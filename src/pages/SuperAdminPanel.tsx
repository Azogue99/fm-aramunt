import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, onSnapshot, addDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const SuperAdminPanel: React.FC = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'textos' | 'productes' | 'usuaris'>('textos');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-red-600">Panell Super-Admin</h1>
        <div className="flex gap-4">
          <Link to="/bar" className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">Anar a Barra</Link>
          <Link to="/futbol" className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200">Anar a Futbol</Link>
          <Link to="/basquet" className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200">Anar a Bàsquet</Link>
          <button onClick={signOut} className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Tancar Sessió</button>
        </div>
      </header>
      
      <div className="flex-1 flex mt-4 max-w-6xl w-full mx-auto bg-white rounded-lg shadow overflow-hidden">
        <aside className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
          <button onClick={() => setActiveTab('textos')} className={`p-4 text-left border-b border-gray-200 ${activeTab === 'textos' ? 'bg-white font-bold text-red-600' : 'hover:bg-gray-100'}`}>Gestió de Textos</button>
          <button onClick={() => setActiveTab('productes')} className={`p-4 text-left border-b border-gray-200 ${activeTab === 'productes' ? 'bg-white font-bold text-red-600' : 'hover:bg-gray-100'}`}>Gestió de Barra</button>
          <button onClick={() => setActiveTab('usuaris')} className={`p-4 text-left ${activeTab === 'usuaris' ? 'bg-white font-bold text-red-600' : 'hover:bg-gray-100'}`}>Gestió d'Usuaris</button>
        </aside>
        
        <main className="flex-1 p-6">
          {activeTab === 'textos' && <ManageTexts />}
          {activeTab === 'productes' && <ManageProducts />}
          {activeTab === 'usuaris' && <ManageUsers />}
        </main>
      </div>
    </div>
  );
};

const ManageTexts = () => {
  const [content, setContent] = useState({ hero_title: '', hero_subtitle: '', info_text: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'web_content', 'landing_texts')).then(snap => {
      if (snap.exists()) setContent(snap.data() as any);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await setDoc(doc(db, 'web_content', 'landing_texts'), content);
    setSaving(false);
    alert('Desat correctament!');
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Textos de la Landing Page</h2>
      <div>
        <label className="block text-sm font-medium">Títol Principal</label>
        <input type="text" className="mt-1 block w-full border rounded p-2" value={content.hero_title} onChange={e => setContent({...content, hero_title: e.target.value})} required />
      </div>
      <div>
        <label className="block text-sm font-medium">Subtítol</label>
        <input type="text" className="mt-1 block w-full border rounded p-2" value={content.hero_subtitle} onChange={e => setContent({...content, hero_subtitle: e.target.value})} required />
      </div>
      <div>
        <label className="block text-sm font-medium">Text Informatiu</label>
        <textarea className="mt-1 block w-full border rounded p-2 h-32" value={content.info_text} onChange={e => setContent({...content, info_text: e.target.value})} required />
      </div>
      <button type="submit" disabled={saving} className="bg-red-600 text-white px-4 py-2 rounded">{saving ? 'Desant...' : 'Desar Canvis'}</button>
    </form>
  );
};

const ManageProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', order: '' });

  useEffect(() => {
    return onSnapshot(collection(db, 'bar_products'), (snap) => {
      const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prods.sort((a: any, b: any) => a.order - b.order));
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'bar_products'), {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      order: parseInt(newProduct.order)
    });
    setNewProduct({ name: '', price: '', order: '' });
  };

  const handleDelete = async (id: string) => {
    if(confirm("Segur que vols esborrar aquest producte?")) {
      await deleteDoc(doc(db, 'bar_products', id));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Productes de la Barra</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6 items-end">
        <div>
          <label className="block text-sm">Nom</label>
          <input type="text" className="border rounded p-1" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm">Preu (€)</label>
          <input type="number" step="0.01" className="border rounded p-1 w-24" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm">Ordre</label>
          <input type="number" className="border rounded p-1 w-20" value={newProduct.order} onChange={e => setNewProduct({...newProduct, order: e.target.value})} required />
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-1 rounded h-[34px]">Afegeix</button>
      </form>
      
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2">Ordre</th>
            <th className="p-2">Nom</th>
            <th className="p-2">Preu</th>
            <th className="p-2">Accions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.order}</td>
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.price.toFixed(2)}€</td>
              <td className="p-2">
                <button onClick={() => handleDelete(p.id)} className="text-red-600 text-sm">Esborrar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ManageUsers = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleAddRole = async (userId: string, role: string) => {
    await updateDoc(doc(db, 'users', userId), {
      roles: arrayUnion(role)
    });
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    if(confirm(`Segur que vols treure el rol ${role}?`)) {
      await updateDoc(doc(db, 'users', userId), {
        roles: arrayRemove(role)
      });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Gestió d'Usuaris i Rols</h2>
      <p className="text-sm text-gray-500 mb-6">Tots els usuaris que iniciïn sessió apareixeran aquí automàticament. Pots assignar-los múltiples rols simultàniament.</p>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2">Usuari</th>
            <th className="p-2">Rols Actuals</th>
            <th className="p-2">Afegeix Rol</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b">
              <td className="p-2">
                <div className="font-bold">{u.name || 'Usuari Anònim'}</div>
                <div className="text-sm text-gray-500">{u.email || u.id}</div>
              </td>
              <td className="p-2">
                <div className="flex flex-wrap gap-1">
                  {u.roles && u.roles.map((r: string) => (
                    <span key={r} className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1 rounded text-xs flex items-center gap-1 font-medium">
                      {r}
                      <button onClick={() => handleRemoveRole(u.id, r)} className="text-blue-500 hover:text-blue-800 font-bold ml-1" title="Eliminar rol">×</button>
                    </span>
                  ))}
                  {(!u.roles || u.roles.length === 0) && <span className="text-gray-400 text-sm italic">Sense rols</span>}
                </div>
              </td>
              <td className="p-2">
                <div className="flex gap-2">
                  <select id={`select-${u.id}`} className="border rounded p-1 text-sm bg-white">
                    <option value="superadmin">Super-Admin</option>
                    <option value="admin_futbol">Admin Futbol</option>
                    <option value="admin_basquet">Admin Bàsquet</option>
                    <option value="barista">Barista</option>
                  </select>
                  <button onClick={() => {
                    const select = document.getElementById(`select-${u.id}`) as HTMLSelectElement;
                    handleAddRole(u.id, select.value);
                  }} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition">Afegir</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
