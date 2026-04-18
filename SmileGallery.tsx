'use client';

import { useState, useEffect } from 'react';
import { fetchGallery, smileBack } from '@/lib/contract';
import { usePrivy } from '@privy-io/react-auth';

interface SmileEntry {
  id: string;
  imageData: string;
  score: number;
  wallet: string;
  smilebacks: number;
  txHash: string;
  timestamp: number;
}

export default function SmileGallery() {
  const [entries, setEntries] = useState<SmileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [reacting, setReacting] = useState<string | null>(null);
  const { user } = usePrivy();

  useEffect(() => {
    fetchGallery().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const handleSmileBack = async (id: string) => {
    if (!user?.wallet?.address || reacting) return;
    setReacting(id);
    try {
      await smileBack(id, user.wallet.address);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, smilebacks: e.smilebacks + 1 } : e))
      );
    } finally {
      setReacting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Winning smiles</h2>
        <span className="text-[10px] text-white/30 tracking-wider uppercase">on-chain gallery</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-white/30 text-sm">
          No smiles yet — be the first!
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {entries.map((entry) => (
            <SmileCard
              key={entry.id}
              entry={entry}
              onSmileBack={() => handleSmileBack(entry.id)}
              reacting={reacting === entry.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SmileCard({
  entry, onSmileBack, reacting,
}: {
  entry: SmileEntry;
  onSmileBack: () => void;
  reacting: boolean;
}) {
  const timeAgo = formatTimeAgo(entry.timestamp);
  const shortWallet = `${entry.wallet.slice(0, 4)}…${entry.wallet.slice(-3)}`;

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group">
      {/* Image */}
      {entry.imageData ? (
        <img
          src={entry.imageData}
          alt="Smile"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl">😊</div>
      )}

      {/* Score badge */}
      <div className="absolute top-1.5 right-1.5 bg-teal-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
        {entry.score}/5
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
        <div className="text-[9px] text-white/60">{shortWallet}</div>
        <div className="space-y-1">
          <div className="text-[9px] text-white/40">{timeAgo}</div>
          <button
            onClick={onSmileBack}
            disabled={reacting}
            className="w-full text-[10px] bg-white/10 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 py-1 rounded-lg transition-colors disabled:opacity-40"
          >
            {reacting ? '…' : `😊 ${entry.smilebacks}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
