import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Trophy, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const [content, setContent] = useState({
    hero_title: "Festa Major d'Aramunt",
    hero_subtitle: "5, 6, 7 i 8 d'Agost del 2026",
    info_text: `Carbassots, carbassotes i carbassotis, deixeu per uns dies les presses i els neguits. Pareu bé les orelles i presteu atenció, Que ja torna a Aramunt la Festa Major!

Aquest any el calendari ens ha fet esperar, però la gresca a Aramunt ja és a tocar.
I com una setmana ens sembla ben poca, des de molt abans la festa ja ens convoca.

Que peti la música, el xou i la diversió:
VISCA ARAMUNT I VISCA LA FESTA MAJOR!
#SOCARBASSOT #FEMCOLLA #FEMPOBLE`
  });

  const [teams, setTeams] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', members: '', tournament: 'futbol' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

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

  useEffect(() => {
    return onSnapshot(collection(db, 'teams'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeams(data);
    });
  }, []);

  const futbolTeams = teams.filter(t => t.tournament === 'futbol' && t.status === 'approved').sort((a, b) => b.points - a.points);
  const basquetTeams = teams.filter(t => t.tournament === 'basquet' && t.status === 'approved').sort((a, b) => b.points - a.points);

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'teams'), {
        ...newTeam,
        points: 0,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: user?.uid || 'unknown'
      });
      setIsModalOpen(false);
      setNewTeam({ name: '', members: '', tournament: 'futbol' });
      alert("L'equip s'ha enviat correctament! Serà visible quan un administrador l'aprovi.");
    } catch (error) {
      console.error("Error afegint equip", error);
      alert("Hi ha hagut un error enviant la inscripció.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-[#333]">
      
      {/* Header / Navbar */}
      <header className="w-full max-w-6xl mx-auto py-10 px-6 flex flex-col items-center sm:flex-row sm:justify-between sm:items-center relative z-10">
        <Link to="/" className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6 sm:mb-0 hover:text-gray-600 transition-colors">
          FM Aramunt
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium uppercase tracking-wider text-gray-600">
          <a href="#programa" className="hover:text-primary transition-colors text-primary">Programa</a>
          <a href="#tornejos" className="hover:text-primary transition-colors">Tornejos</a>
          <a href="#comissio" className="hover:text-primary transition-colors">Comissió</a>
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

        {/* Tornejos Section */}
        <div id="tornejos" className="w-full mb-24">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-2">Tornejos Esportius</h2>
              <p className="text-gray-500 text-lg">Inscriu el teu equip i segueix la classificació en directe.</p>
            </div>
            <button 
              onClick={() => {
                if (user) {
                  setIsModalOpen(true);
                } else {
                  alert("Has d'iniciar sessió amb Google per poder inscriure un equip i evitar l'spam.");
                  navigate('/login');
                }
              }}
              className="mt-4 md:mt-0 flex items-center gap-2 bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-all shadow-md"
            >
              <Users size={20} /> Inscriure un Equip
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Futbol Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6 text-green-600">
                <Trophy size={32} />
                <h3 className="text-2xl font-bold text-gray-900">Futbol 5v5</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="p-4 w-12 text-center">#</th>
                      <th className="p-4">Equip</th>
                      <th className="p-4 text-center w-20">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {futbolTeams.length === 0 ? (
                      <tr><td colSpan={3} className="p-6 text-center text-gray-400 italic">No hi ha equips aprovats.</td></tr>
                    ) : (
                      futbolTeams.map((t, i) => (
                        <tr key={t.id} className="hover:bg-gray-50/50">
                          <td className="p-4 text-center font-bold text-gray-400">{i + 1}</td>
                          <td className="p-4 font-bold text-gray-800">{t.name}</td>
                          <td className="p-4 text-center font-black text-green-600">{t.points}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Basquet Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6 text-orange-600">
                <Trophy size={32} />
                <h3 className="text-2xl font-bold text-gray-900">Bàsquet 3x3</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="p-4 w-12 text-center">#</th>
                      <th className="p-4">Equip</th>
                      <th className="p-4 text-center w-20">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {basquetTeams.length === 0 ? (
                      <tr><td colSpan={3} className="p-6 text-center text-gray-400 italic">No hi ha equips aprovats.</td></tr>
                    ) : (
                      basquetTeams.map((t, i) => (
                        <tr key={t.id} className="hover:bg-gray-50/50">
                          <td className="p-4 text-center font-bold text-gray-400">{i + 1}</td>
                          <td className="p-4 font-bold text-gray-800">{t.name}</td>
                          <td className="p-4 text-center font-black text-orange-600">{t.points}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

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
            id="comissio"
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

      {/* Inscription Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900">Inscripció d'Equip</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleRegisterTeam} className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Quin torneig voleu jugar?</label>
                    <select 
                      className="w-full border border-gray-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      value={newTeam.tournament}
                      onChange={e => setNewTeam({...newTeam, tournament: e.target.value})}
                    >
                      <option value="futbol">Futbol 5v5</option>
                      <option value="basquet">Bàsquet 3x3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nom de l'Equip</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Els Barrufets"
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      value={newTeam.name}
                      onChange={e => setNewTeam({...newTeam, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nom i Cognoms dels Jugadors</label>
                    <textarea 
                      required
                      placeholder="1. Barrufet Rondinaire&#10;2. Pocahontas&#10;3. Son Goku..."
                      className="w-full border border-gray-300 rounded-xl p-3 h-32 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                      value={newTeam.members}
                      onChange={e => setNewTeam({...newTeam, members: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-8 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Enviant...' : 'Enviar Inscripció'}
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">La inscripció quedarà pendent d'aprovació.</p>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
