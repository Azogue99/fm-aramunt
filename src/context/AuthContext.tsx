import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { USERS, fetchInvite } from '../services/users';
import type { UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  roles: UserRole[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  roles: [],
  loading: true,
  signOut: async () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

/**
 * Crea el perfil de l'usuari si és el primer cop que entra, reclamant els rols
 * que el superadmin li hagi reservat per email a `role_invites`.
 */
async function ensureProfile(currentUser: User): Promise<UserRole[]> {
  const userRef = doc(db, USERS, currentUser.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data();
    // L'esquema antic guardava un únic `role`; el llegim si encara no hi ha `roles`.
    const roles: UserRole[] = data.roles ?? [];
    return roles.length === 0 && data.role ? [data.role as UserRole] : roles;
  }

  const invite = currentUser.email ? await fetchInvite(currentUser.email) : null;
  const roles = invite?.roles ?? [];

  await setDoc(userRef, {
    email: currentUser.email,
    name: currentUser.displayName,
    photoURL: currentUser.photoURL,
    roles,
  });

  return roles;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setRoles([]);
          setLoading(false);
          return;
        }

        try {
          setRoles(await ensureProfile(currentUser));
        } catch (error) {
          console.error('No s\'han pogut carregar els rols', error);
          setRoles([]);
        }
        setLoading(false);
      }),
    [],
  );

  // A diferència de la versió anterior, els fills es renderitzen sempre: la web
  // pública no ha d'esperar que Firebase resolgui l'autenticació. Els guards
  // (`RequireAuth`, `RequireRole`) són els únics que miren `loading`.
  return (
    <AuthContext.Provider value={{ user, roles, loading, signOut: () => firebaseSignOut(auth) }}>
      {children}
    </AuthContext.Provider>
  );
};
