import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const [content, setContent] = useState({
    hero_title: "Festa Major d'Aramunt",
    hero_subtitle: "Benvinguts a la festa!",
    info_text: "Carregant informació..."
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'web_content', 'landing_texts');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };
    fetchContent();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-red-600">Aramunt</h1>
        <Link to="/login" className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
          Accés / Login
        </Link>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-5xl font-extrabold text-gray-900 mb-4">{content.hero_title}</h2>
        <p className="text-2xl text-gray-700 mb-8">{content.hero_subtitle}</p>
        <div className="max-w-2xl bg-white p-8 rounded-lg shadow-md">
          <p className="text-lg text-gray-600 whitespace-pre-line">{content.info_text}</p>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white text-center py-4">
        <p>&copy; {new Date().getFullYear()} Festa Major d'Aramunt</p>
      </footer>
    </div>
  );
};
