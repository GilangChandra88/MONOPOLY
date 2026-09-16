import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google');
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInAnonymously(auth);
    } catch (err: any) {
      setError(err.message || 'Gagal login sebagai tamu');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl text-center"
      >
        <div className="text-6xl mb-4">🎲</div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">MONOPOLI</h1>
        <p className="text-emerald-300 font-semibold mb-8">🇮🇩 Edisi Indonesia</p>

        {error && (
          <div className="bg-red-500/20 text-red-200 p-3 rounded-lg text-sm mb-4 border border-red-500/50">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-base shadow-lg transition-all disabled:opacity-50"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Lanjutkan dengan Google
          </button>

          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-base border border-white/20 shadow-lg transition-all disabled:opacity-50"
          >
            👤 Main sebagai Tamu
          </button>
        </div>

        <p className="text-white/40 text-xs mt-8">
          Data permainanmu akan disimpan secara otomatis di cloud.
        </p>
      </motion.div>
    </div>
  );
}
