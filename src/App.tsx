import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { AuthScreen } from '@/auth/AuthScreen';
import DealManagerApp from '@/DealManagerApp';

function Gate() {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-100 text-zinc-500 text-sm">
        Lädt…
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <DealManagerApp
      userId={session.user.id}
      userEmail={session.user.email ?? ''}
      isAdmin={profile?.role === 'admin'}
      onSignOut={signOut}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
