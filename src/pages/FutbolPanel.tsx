import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export const FutbolPanel: React.FC = () => {
  const { signOut } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'teams'), where('tournament', '==', 'futbol'));
    return onSnapshot(q, (snap) => {
      const data: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => b.points - a.points);
      setTeams(data);
    });
  }, []);

  const updatePoints = async (id: string, current: number, change: number) => {
    await updateDoc(doc(db, 'teams', id), { points: current + change });
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    await updateDoc(doc(db, 'teams', id), { status: newStatus });
  };

  const handleDelete = async (id: string) => {
    if(confirm("Segur que vols esborrar aquest equip?")) {
      await deleteDoc(doc(db, 'teams', id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white shadow-sm py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">Admin: Futbol 5v5</h1>
        <div className="flex gap-4">
          <Link to="/" className="text-sm bg-green-600 px-3 py-1 rounded hover:bg-green-500">Inici</Link>
          <button onClick={signOut} className="flex items-center gap-1 text-sm bg-gray-900 px-3 py-1 rounded hover:bg-gray-800"><LogOut size={16}/> Sortir</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-6 bg-white rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-6">Classificació i Equips</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3">Pos.</th>
                <th className="p-3">Equip</th>
                <th className="p-3">Membres</th>
                <th className="p-3">Estat</th>
                <th className="p-3 text-center">Punts</th>
                <th className="p-3 text-center">Gestió</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">Cap equip inscrit encara.</td></tr>
              )}
              {teams.map((t, index) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-bold text-gray-500">{index + 1}</td>
                  <td className="p-3 font-bold">{t.name}</td>
                  <td className="p-3 text-sm text-gray-600 whitespace-pre-wrap">{t.members}</td>
                  <td className="p-3">
                    <button 
                      onClick={() => toggleStatus(t.id, t.status)}
                      className={`text-xs px-2 py-1 rounded-full font-bold ${t.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                    >
                      {t.status === 'approved' ? 'Aprovat' : 'Pendent'}
                    </button>
                  </td>
                  <td className="p-3 text-center text-xl font-black">{t.points || 0}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => updatePoints(t.id, t.points || 0, 1)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200">+1 pt</button>
                      <button onClick={() => updatePoints(t.id, t.points || 0, -1)} className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold hover:bg-red-200">-1 pt</button>
                      <button onClick={() => handleDelete(t.id)} className="ml-2 text-gray-400 hover:text-red-600" title="Eliminar equip">×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
