import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import LandingPage from '@/pages/LandingPage';
import { LoginScreen } from '@/components/auth/LoginScreen';

function App() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (isAuthenticated) {
    return <AppShell />;
  }

  if (showLogin) {
    return <LoginScreen onBack={() => setShowLogin(false)} />;
  }

  return <LandingPage onSignup={() => setShowLogin(true)} />;
}

export default App;
