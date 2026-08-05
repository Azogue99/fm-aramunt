import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type UserRole = 'superadmin' | 'admin_futbol' | 'admin_basquet' | 'barista';

interface AuthContextType {
  user: User | null;
  roles: UserRole[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  roles: [],
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          let userDoc = await getDoc(userRef);
          
          // Si l'usuari no existeix, el creem automàticament sense rols perquè el Super-Admin el vegi
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              email: currentUser.email,
              name: currentUser.displayName,
              roles: []
            });
            userDoc = await getDoc(userRef);
          }

          let fetchedRoles = userDoc.data()?.roles || [];
          
          // Suport per la migració de l'antic format de rol únic (role) a múltiple (roles)
          if (userDoc.data()?.role && fetchedRoles.length === 0) {
            fetchedRoles = [userDoc.data()?.role];
          }

          setRoles(fetchedRoles);
        } catch (error) {
          console.error("Error fetching user roles:", error);
          setRoles([]);
        }
      } else {
        setRoles([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, roles, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
