import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [content, setContent] = useState({
    hero_title: "Festa Major d'Aramunt",
    hero_subtitle: "Torna la festa més esperada del Pallars!",
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
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-[#333]">
      
      {/* Header / Navbar */}
      <header className="w-full max-w-6xl mx-auto py-10 px-6 flex flex-col items-center sm:flex-row sm:justify-between sm:items-center relative z-10">
        <Link to="/" className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6 sm:mb-0 hover:text-gray-600 transition-colors">
          FM Aramunt
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium uppercase tracking-wider text-gray-600">
          <a href="#" className="hover:text-primary transition-colors text-primary">Notícies</a>
          <a href="#" className="hover:text-primary transition-colors">Calendari</a>
          <a href="#" className="hover:text-primary transition-colors">Comissió</a>
          <Link to="/login" className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-gray-700 transition-all shadow-sm">
            <LogIn size={16} /> Entrar
          </Link>
        </nav>
      </header>
      
      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center px-6 w-full max-w-6xl mx-auto">
        
        {/* Featured Card 1: Mascot & Main Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full flex flex-col md:flex-row items-center justify-between mt-12 mb-24 gap-12"
        >
          <div className="md:w-1/2 flex justify-center">
             <img 
              src="https://cdn.prod.website-files.com/6893ba338f49004dbec3957c/6893d3db3bc3db789dcdee1b_CarbassotBailongo.png" 
              alt="Carbassot Bailongo" 
              className="w-full max-w-[460px] drop-shadow-2xl hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
              {content.hero_title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 font-light mb-8 max-w-lg">
              {content.hero_subtitle}
            </p>
            <a href="#programa" className="bg-primary text-white text-lg font-semibold px-8 py-4 rounded-full shadow-lg hover:bg-primary-hover hover:shadow-xl transition-all hover:-translate-y-1">
              Veure Programa 2025
            </a>
          </div>
        </motion.div>

        {/* Featured Blog Posts / Info Section */}
        <div id="programa" className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group cursor-pointer"
          >
            <div className="overflow-hidden rounded-2xl shadow-md mb-6">
              <img 
                src="https://cdn.prod.website-files.com/6893ba338f49004dbec3957c/6893bf315f83ed1bc8080a01_FMAramunt2025.png" 
                alt="Cartell FM Aramunt" 
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">Programa d'Actes</h2>
            <p className="text-gray-600 font-serif leading-relaxed line-clamp-3">
              Ei carbassots i carbassotes! Posseu-vos les xancletes bones, agafeu el ventall i un bon somriure, perquè... ARAMUUUNT ESTÀ ON FIRE! Consulta tots els horaris i actuacions d'enguany.
            </p>
            <div className="mt-4 text-primary font-bold tracking-wide uppercase text-sm">Llegir TOT</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="group cursor-pointer flex flex-col justify-center bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6 group-hover:text-primary transition-colors">Notes de la Comissió</h2>
            <div className="text-gray-600 font-serif text-lg leading-relaxed whitespace-pre-line">
              {content.info_text}
            </div>
          </motion.div>

        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-100 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} Festa Major d'Aramunt. Tots els drets reservats.
          </div>
          <div className="flex gap-4 items-center">
            <a href="https://www.instagram.com/fmaramunt?igsh=Z2k2MDdlYmRoMGE2" target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
              <img src="https://cdn.prod.website-files.com/6893ba338f49004dbec39510/6893ba338f49004dbec3958b_instagram-s.svg" width="24" alt="Instagram" />
            </a>
            <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">
              <img src="https://cdn.prod.website-files.com/6893ba338f49004dbec39510/6893ba338f49004dbec395f1_social-03.svg" width="24" alt="Facebook" />
            </a>
            <a href="#" className="opacity-60 hover:opacity-100 transition-opacity">
              <img src="https://cdn.prod.website-files.com/6893ba338f49004dbec39510/6893ba338f49004dbec3956f_social-18.svg" width="24" alt="Email" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
