import React, { useEffect, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { auth, googleProvider } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { resolveHomePanel } from '../../config/roles';
import { Button } from '../../components/ui/Button';
import { LOGO_IMAGE, SITE_NAME } from '../../config/site';

const GoogleMark = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

/**
 * Un únic login per a tothom. Després d'entrar, cadascú va on li toca: al
 * destí que portava (p. ex. un enllaç d'invitació), al seu panell d'admin,
 * o al panell de participant.
 */
export const LoginPage: React.FC = () => {
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const { user, roles, loading } = useAuth();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const redirect =
    params.get('redirect') ?? (location.state as { from?: string } | null)?.from ?? null;

  useEffect(() => {
    if (loading || !user) return;
    navigate(redirect ?? resolveHomePanel(roles) ?? '/participa', { replace: true });
  }, [user, roles, loading, redirect, navigate]);

  const handleLogin = async () => {
    setError('');
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setError("No s'ha pogut iniciar sessió amb Google. Comprova que no s'hagi bloquejat la finestra emergent.");
      setSigningIn(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-14">
      <div className="w-full max-w-sm text-center">
        <img src={LOGO_IMAGE} alt="" className="mx-auto mb-8 h-16 w-16 rounded-full" width={64} height={64} />

        <h1 className="text-3xl font-bold tracking-tight text-ink">{SITE_NAME}</h1>
        <p className="mt-3 text-muted">
          Entra amb Google per inscriure el teu equip o per gestionar la festa.
        </p>

        {error && (
          <p className="mt-6 border-l-2 border-red-600 bg-white px-4 py-3 text-left text-sm text-red-800">
            {error}
          </p>
        )}

        <Button variant="ghost" size="lg" onClick={handleLogin} disabled={signingIn} className="mt-8 w-full">
          <GoogleMark />
          {signingIn ? 'Iniciant sessió…' : 'Entra amb Google'}
        </Button>

        <Link
          to="/"
          className="mt-8 inline-block border-t border-hairline pt-6 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          ← Tornar a l&apos;inici
        </Link>
      </div>
    </div>
  );
};
