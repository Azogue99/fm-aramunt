import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, roles, loading } = useAuth();

  // Si ja està loguejat, redirigir segons els rols, o mostrar error més educat si no en té
  React.useEffect(() => {
    if (!loading) {
      if (roles && roles.length > 0) {
        if (roles.includes('superadmin')) navigate('/admin');
        else if (roles.includes('barista')) navigate('/bar');
        else if (roles.includes('admin_futbol')) navigate('/futbol');
        else if (roles.includes('admin_basquet')) navigate('/basquet');
      } else if (user) {
        setError("Si ets part de la comissió o col·laborador, contacta amb l'administrador de la plataforma per concedir-te accés.");
        setIsLoading(false);
      }
    }
  }, [user, roles, loading, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError("No s'ha pogut iniciar sessió amb Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] font-sans">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center">
        
        <img 
          src="https://cdn.prod.website-files.com/6893ba338f49004dbec39510/6893d81b59d9759d7ed49584_CarbassotBailongoCrop-32x32.png" 
          alt="Logo" 
          className="w-16 h-16 mb-6 rounded-full"
        />

        <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">Accés Restringit</h2>
        <p className="text-gray-500 text-center mb-8">Inicia sessió per accedir a la gestió de la Festa Major</p>
        
        {error && (
          <div className="w-full bg-blue-50 text-blue-800 p-4 rounded-lg text-sm text-center mb-6 border border-blue-100 font-medium leading-relaxed">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-full shadow-sm text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isLoading ? 'Iniciant sessió...' : 'Entra amb Google'}
        </button>
        
        <div className="mt-2 text-center w-full border-t border-gray-100 pt-6">
            <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              &larr; Tornar a l'inici
            </Link>
        </div>
      </div>
    </div>
  );
};
