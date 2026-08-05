import React from 'react';
import { useAuth } from '../context/AuthContext';

export const BasquetPanel: React.FC = () => {
  const { signOut } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Torneig de Bàsquet 3x3</h1>
      <button onClick={signOut} className="bg-red-500 text-white px-4 py-2 rounded">Tancar Sessió</button>
      <p className="mt-4">Gestió de classificació en desenvolupament...</p>
    </div>
  );
};
