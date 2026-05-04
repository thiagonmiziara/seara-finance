import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const name = firebaseUser.displayName || 'Usuário';
          const email = firebaseUser.email || '';
          const avatar = firebaseUser.photoURL || null;
          setUser({
            id: firebaseUser.uid,
            name,
            email,
            avatar: avatar || undefined,
          });
          setDoc(
            doc(db, 'users', firebaseUser.uid),
            {
              name,
              email,
              avatar,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          ).catch(() => {
            // Non-blocking: profile sync errors should not break login
          });
        } else {
          setUser(null);
        }
        setLoading(false);
        setIsLoggingIn(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setIsLoggingIn(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setIsLoggingIn(false);
      alert(
        `ERRO DE CONFIGURAÇÃO:\n${error.code}\n\n1. Verifique se clicou em SALVAR no Firebase.\n2. Tente abrir em uma janela ANÔNIMA.\n3. Domínio localhost deve estar autorizado.`,
      );
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      // Handle logout error silently
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
        isLoggingIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
