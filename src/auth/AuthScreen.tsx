import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === 'signup') {
      setInfo('Konto erstellt. Falls E-Mail-Bestätigung aktiviert ist, prüfe deinen Posteingang.');
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-zinc-100">
      <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl shadow-sm p-8">
        <div className="mb-6">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center mb-4">
            <span className="text-white text-xs font-extrabold tracking-tight">DO</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900">
            {mode === 'signin' ? 'Anmelden' : 'Konto erstellen'}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Deal Manager</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">E-Mail</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="du@firma.ch"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Passwort</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-700">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-black transition-colors disabled:opacity-60"
          >
            {submitting ? 'Bitte warten…' : mode === 'signin' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
            setInfo(null);
          }}
          className="w-full mt-4 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          {mode === 'signin' ? 'Noch kein Konto? Registrieren' : 'Bereits ein Konto? Anmelden'}
        </button>
      </div>
    </div>
  );
}
