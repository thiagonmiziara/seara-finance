import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { syncUserToSupabase } from '@/lib/users';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  isLoggingIn: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseError(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/user-disabled':
      return 'Esta conta foi desabilitada.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Já existe uma conta com esse e-mail.';
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente em alguns minutos.';
    case 'auth/network-request-failed':
      return 'Sem conexão. Verifique a internet e tente de novo.';
    default:
      return 'Algo deu errado. Tente novamente.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const mapped: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Usuário',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || undefined,
          };
          setUser(mapped);
          syncUserToSupabase(mapped).catch(() => {
            // non-blocking; sync is retried on next login
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

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setIsLoggingIn(false);
      setAuthError(mapFirebaseError(error?.code));
      throw error;
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      setAuthError(null);
      setIsLoggingIn(true);
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        if (name && cred.user) {
          await updateProfile(cred.user, { displayName: name });
        }
      } catch (error: any) {
        setIsLoggingIn(false);
        setAuthError(mapFirebaseError(error?.code));
        throw error;
      }
    },
    [],
  );

  const resetPassword = useCallback(async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setAuthError(mapFirebaseError(error?.code));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      // logout falha silenciosa
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        resetPassword,
        logout,
        isAuthenticated: !!user,
        loading,
        isLoggingIn,
        authError,
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
