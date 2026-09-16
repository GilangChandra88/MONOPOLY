import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

interface GameSession {
  id: string;
  sessionName: string;
  playersCount: number;
  updatedAt: any;
  winner: string | null;
}

interface SessionListScreenProps {
  user: User;
  onSelectSession: (sessionId: string, sessionName: string) => void;
  onCreateNew: () => void;
  onLogout: () => void;
}

export default function SessionListScreen({ user, onSelectSession, onCreateNew, onLogout }: SessionListScreenProps) {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const qCreator = query(collection(db, 'games'), where('creatorId', '==', user.uid));
        const qParticipant = query(collection(db, 'games'), where('participantIds', 'array-contains', user.uid));
        
        const [snapCreator, snapParticipant] = await Promise.all([getDocs(qCreator), getDocs(qParticipant)]);
        
        const fetchedSessions: GameSession[] = [];
        const seenIds = new Set<string>();

        const processDocs = (snapshot: any) => {
          snapshot.forEach((doc: any) => {
            if (seenIds.has(doc.id)) return;
            seenIds.add(doc.id);
            const data = doc.data();
            fetchedSessions.push({
              id: doc.id,
              sessionName: data.sessionName || 'Sesi Tanpa Nama',
              playersCount: data.players ? data.players.length : 0,
              updatedAt: data.updatedAt,
              winner: data.winner || null,
            });
          });
        };

        processDocs(snapCreator);
        processDocs(snapParticipant);

        // Urutkan manual (agar tidak error jika index firestore belum ada)
        fetchedSessions.sort((a, b) => {
          const tA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
          const tB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
          return tB - tA; // descending
        });

        setSessions(fetchedSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, [user.uid]);

  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;

    setIsJoining(true);
    setJoinError('');

    try {
      const q = query(collection(db, 'games'), where('activeInviteCodes', 'array-contains', code));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setJoinError('Kode tidak valid atau slot sudah terisi.');
        setIsJoining(false);
        return;
      }

      const gameDoc = snapshot.docs[0];
      const gameData = gameDoc.data();

      // Temukan pemain dengan kode ini
      const updatedPlayers = gameData.players.map((p: any) => {
        if (p.inviteCode === code) {
          return { ...p, userId: user.uid, inviteCode: null }; // Hapus kode agar tidak dipakai lagi
        }
        return p;
      });

      // Hapus dari activeInviteCodes
      const newActiveCodes = (gameData.activeInviteCodes || []).filter((c: string) => c !== code);

      await updateDoc(gameDoc.ref, {
        players: updatedPlayers,
        activeInviteCodes: newActiveCodes
      });

      onSelectSession(gameDoc.id, gameData.sessionName || 'Permainan Online');

    } catch (error) {
      console.error(error);
      setJoinError('Gagal bergabung. Coba lagi.');
    }
    setIsJoining(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-4">
      
      <button 
        onClick={onLogout} 
        className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-colors"
      >
        Logout
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/40 backdrop-blur-md rounded-3xl p-8 w-full max-w-3xl border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="text-3xl font-black text-white tracking-tight">Lobby Permainan</h1>
          <p className="text-emerald-400 font-semibold mt-1">Pilih sesi untuk dilanjutkan, atau buat baru!</p>
        </div>

        {loading ? (
          <div className="text-white text-center py-10 animate-pulse">Memuat riwayat permainan...</div>
        ) : (
          <div className="grid gap-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {sessions.length === 0 ? (
              <div className="text-white/50 text-center py-8 border border-dashed border-white/20 rounded-xl">
                Belum ada sesi permainan yang tersimpan.
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id, session.sessionName)}
                  className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 rounded-xl transition-all group text-left"
                >
                  <div>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      {session.sessionName}
                      {session.winner && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/50">Selesai</span>}
                    </h3>
                    <p className="text-white/50 text-sm mt-1">
                      {session.playersCount} Pemain • Terakhir main: {session.updatedAt?.toDate ? session.updatedAt.toDate().toLocaleDateString('id-ID') : 'Baru saja'}
                    </p>
                  </div>
                  <div className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 font-bold">
                    Lanjutkan <span className="text-xl">➡️</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        <div className="mb-6 pt-6 border-t border-white/10">
          <h2 className="text-white/80 font-bold mb-3 text-sm tracking-widest uppercase">Gabung Game Online</h2>
          <form onSubmit={handleJoinByCode} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Masukkan 5 Kode Undangan" 
              maxLength={5}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white font-bold tracking-widest uppercase placeholder-white/30 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button 
              type="submit" 
              disabled={isJoining || joinCode.length < 5}
              className="px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold transition-colors"
            >
              {isJoining ? '...' : 'Gabung'}
            </button>
          </form>
          {joinError && <div className="text-red-400 text-xs mt-2 font-semibold">{joinError}</div>}
        </div>

        <button
          onClick={onCreateNew}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          ➕ Buat Game Baru
        </button>

      </motion.div>
    </div>
  );
}
